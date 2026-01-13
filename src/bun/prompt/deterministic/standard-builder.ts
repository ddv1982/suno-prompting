/**
 * STANDARD MODE deterministic prompt builder.
 *
 * @module prompt/deterministic/standard-builder
 */

import { GENRE_REGISTRY } from '@bun/instruments';
import { selectMoodsForCategory } from '@bun/mood';
import { articulateInstrument } from '@bun/prompt/articulations';
import { buildAllSections } from '@bun/prompt/sections';
import { traceDecision } from '@bun/trace';

import { resolveGenre } from './genre';
import {
  truncatePrompt,
  joinRecordingDescriptors,
  getBpmRangeForGenreWithTrace,
  selectKeyAndModeWithTrace,
} from './helpers';
import { assembleInstruments } from './instruments';
import { assembleStyleTags } from './styles';

import type { DeterministicOptions, DeterministicResult } from './types';

/**
 * Build a complete STANDARD MODE prompt deterministically.
 *
 * Uses section templates to generate structured prompts with mood, genre,
 * key/mode header and full section breakdowns. No LLM calls required.
 *
 * When moodCategory is provided, moods are selected from that category
 * instead of being derived from genre style tags.
 *
 * @param options - Generation options including description, genre override, and mood category
 * @returns DeterministicResult with formatted STANDARD MODE prompt
 *
 * @example
 * ```typescript
 * const result = buildDeterministicStandardPrompt({
 *   description: 'melancholic jazz ballad',
 *   genreOverride: undefined,
 *   rng: Math.random,
 * });
 * console.log(result.text);
 * // [Melancholic, Jazz, Key: D minor]
 * //
 * // Genre: Jazz
 * // BPM: between 80 and 160
 * // Mood: smooth, warm, sophisticated
 * // Instruments: Arpeggiated Rhodes, breathy tenor sax...
 * // ...
 * // [INTRO] Sparse Rhodes chords with brushed drums
 * // [VERSE] Walking bass enters...
 * ```
 *
 * @example
 * ```typescript
 * // With mood category override
 * const result = buildDeterministicStandardPrompt({
 *   description: 'jazz ballad',
 *   moodCategory: 'calm',
 * });
 * // Moods will be selected from 'calm' category
 * ```
 */
export function buildDeterministicStandardPrompt(
  options: DeterministicOptions,
): DeterministicResult {
  const { description, genreOverride, moodCategory, rng = Math.random, trace } = options;

  // 1. Resolve genre - supports compound genres like "jazz rock" (up to 4)
  const { detected, displayGenre, primaryGenre, components } = resolveGenre(
    description,
    genreOverride,
    rng,
    trace,
  );

  // 2. Assemble instruments - blends from all genre components
  const instrumentsResult = assembleInstruments(components, rng, trace);

  // 3. Assemble style tags - blends moods from all genre components
  // If moodCategory is provided, we'll use those moods instead later
  const styleResult = assembleStyleTags(components, rng, trace);

  // 3b. Override moods if mood category is provided
  let moods: readonly string[];
  if (moodCategory) {
    const categoryMoods = selectMoodsForCategory(moodCategory, 3, rng);
    // Fall back to style tags if category selection returns empty
    moods = categoryMoods.length > 0 ? categoryMoods : styleResult.tags.slice(0, 3);

    traceDecision(trace, {
      domain: 'mood',
      key: 'deterministic.moods.source',
      branchTaken: categoryMoods.length > 0 ? 'moodCategory' : 'moodCategory.fallback',
      why:
        categoryMoods.length > 0
          ? `moodCategory=${moodCategory} selected=${categoryMoods.length}`
          : `moodCategory=${moodCategory} returned empty; using genre-derived moods`,
      selection: categoryMoods.length > 0
        ? {
            method: 'shuffleSlice',
            candidates: categoryMoods,
          }
        : undefined,
    });
  } else {
    moods = styleResult.tags.slice(0, 3);

    traceDecision(trace, {
      domain: 'mood',
      key: 'deterministic.moods.source',
      branchTaken: 'styleTags',
      why: 'no moodCategory override; using genre-derived moods',
      selection: {
        method: 'shuffleSlice',
        candidates: moods,
      },
    });
  }

  // 4. Get BPM range - uses blended range for multi-genre
  const bpmRange = getBpmRangeForGenreWithTrace(displayGenre, trace);

  // 5. Get genre display name - capitalize each component for display
  const genreDisplayName = components
    .map((g) => GENRE_REGISTRY[g]?.name ?? g)
    .join(' ');

  // 6. Select key and mode
  const keyMode = selectKeyAndModeWithTrace(rng, trace);

  // 7. Build section templates using primary genre
  const sectionsResult = buildAllSections({
    genre: primaryGenre,
    rng,
    trackInstruments: instrumentsResult.instruments,
  });

  // 8. Select primary mood for header (capitalize first letter)
  const primaryMood = moods[0] ?? 'Energetic';
  const capitalizedMood = primaryMood.charAt(0).toUpperCase() + primaryMood.slice(1);

  // 9. Articulate instruments for display in header
  const articulatedForDisplay = instrumentsResult.instruments.map((i) =>
    articulateInstrument(i, rng),
  );

  // 10. Get recording context (same as MAX MODE for remix compatibility)
  const recordingContext = joinRecordingDescriptors(rng, 2, trace);

  // 11. Format the STANDARD MODE prompt
  const rawPrompt = `[${capitalizedMood}, ${genreDisplayName}, ${keyMode}]

Genre: ${genreDisplayName}
BPM: ${bpmRange}
Mood: ${moods.join(', ')}
Instruments: ${articulatedForDisplay.join(', ')}
Style Tags: ${styleResult.formatted}
Recording: ${recordingContext}

${sectionsResult.text}`;

  // 12. Enforce MAX_CHARS limit
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
