/**
 * MAX MODE deterministic prompt builder.
 *
 * @module prompt/deterministic/max-builder
 */

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
 * @param options - Generation options including description and optional genre override
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
 */
export function buildDeterministicMaxPrompt(
  options: DeterministicOptions
): DeterministicResult {
  const { description, genreOverride, rng = Math.random } = options;

  // 1. Resolve genre - supports compound genres like "jazz rock" (up to 4)
  const { detected, displayGenre, primaryGenre, components } = resolveGenre(
    description,
    genreOverride,
    rng
  );

  // 2. Assemble instruments - blends from all genre components
  const instrumentsResult = assembleInstruments(components, rng);

  // 3. Assemble style tags - blends moods from all genre components
  const styleResult = assembleStyleTags(components, rng);

  // 4. Get recording context
  const recordingContext = selectRecordingContext(rng);

  // 5. Get BPM range - uses blended range for multi-genre
  const bpmRange = getBpmRangeForGenre(displayGenre);

  // 6. Format the prompt using standard MAX_MODE_HEADER for consistency
  const rawPrompt = `${MAX_MODE_HEADER}

genre: "${displayGenre}"
bpm: "${bpmRange}"
instruments: "${instrumentsResult.formatted}"
style tags: "${styleResult.formatted}"
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
      styleTags: styleResult.tags,
      recordingContext,
    },
  };
}
