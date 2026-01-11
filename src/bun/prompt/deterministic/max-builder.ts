/**
 * MAX MODE deterministic prompt builder.
 *
 * @module prompt/deterministic/max-builder
 */

import { selectMoodsForCategory } from '@bun/mood';
import { MAX_MODE_HEADER } from '@shared/max-format';

import { resolveGenre } from './genre';
import { truncatePrompt, selectRecordingContext, getBpmRangeForGenre } from './helpers';
import { assembleInstruments } from './instruments';
import { assembleStyleTags } from './styles';

import type { DeterministicOptions, DeterministicResult } from './types';

/**
 * Build a complete MAX MODE prompt deterministically.
 *
 * Uses pre-defined templates and random selection to build a complete
 * prompt without any LLM calls. Supports compound genres like "jazz rock".
 *
 * When moodCategory is provided, moods in style tags are selected from that
 * category instead of being derived from genre.
 *
 * @param options - Generation options including description, genre override, and mood category
 * @returns DeterministicResult with formatted MAX MODE prompt
 *
 * @example
 * ```typescript
 * const result = buildDeterministicMaxPrompt({
 *   description: 'smooth jazz night session',
 *   genreOverride: undefined,
 *   rng: Math.random,
 * });
 * console.log(result.text);
 * // ::tags realistic music ::
 * // ::quality maximum ::
 * // ...
 * // genre: "jazz"
 * // bpm: "between 80 and 160"
 * // instruments: "Rhodes, tenor sax, upright bass..."
 * ```
 *
 * @example
 * ```typescript
 * // With mood category override
 * const result = buildDeterministicMaxPrompt({
 *   description: 'jazz session',
 *   moodCategory: 'calm',
 * });
 * // Style tags will include moods from 'calm' category
 * ```
 */
export function buildDeterministicMaxPrompt(
  options: DeterministicOptions,
): DeterministicResult {
  const { description, genreOverride, moodCategory, rng = Math.random } = options;

  // 1. Resolve genre - supports compound genres like "jazz rock" (up to 4)
  const { detected, displayGenre, primaryGenre, components } = resolveGenre(
    description,
    genreOverride,
    rng,
  );

  // 2. Assemble instruments - blends from all genre components
  const instrumentsResult = assembleInstruments(components, rng);

  // 3. Assemble style tags - blends moods from all genre components
  // If moodCategory is provided, we'll override the moods
  const styleResult = assembleStyleTags(components, rng);

  // 3b. Override style tags if mood category is provided
  let styleTags: string;
  let styleTagsArray: readonly string[];
  if (moodCategory) {
    const categoryMoods = selectMoodsForCategory(moodCategory, 3, rng);
    if (categoryMoods.length > 0) {
      // Combine category moods with non-mood style tags from genre
      // Style result includes moods and other descriptors, so we prepend category moods
      styleTags = [...categoryMoods, ...styleResult.tags.slice(categoryMoods.length)].join(', ');
      styleTagsArray = [...categoryMoods, ...styleResult.tags.slice(categoryMoods.length)];
    } else {
      styleTags = styleResult.formatted;
      styleTagsArray = styleResult.tags;
    }
  } else {
    styleTags = styleResult.formatted;
    styleTagsArray = styleResult.tags;
  }

  // 4. Get recording context
  const recordingContext = selectRecordingContext(rng);

  // 5. Get BPM range - uses blended range for multi-genre
  const bpmRange = getBpmRangeForGenre(displayGenre);

  // 6. Format the prompt using standard MAX_MODE_HEADER for consistency
  const rawPrompt = `${MAX_MODE_HEADER}

genre: "${displayGenre}"
bpm: "${bpmRange}"
instruments: "${instrumentsResult.formatted}"
style tags: "${styleTags}"
recording: "${recordingContext}"`;

  // 7. Enforce MAX_CHARS limit
  const prompt = truncatePrompt(rawPrompt);

  return {
    text: prompt,
    genre: detected ?? primaryGenre,
    metadata: {
      detectedGenre: detected,
      usedGenre: displayGenre,
      instruments: instrumentsResult.instruments,
      chordProgression: instrumentsResult.chordProgression,
      vocalStyle: instrumentsResult.vocalStyle,
      styleTags: styleTagsArray,
      recordingContext,
    },
  };
}
