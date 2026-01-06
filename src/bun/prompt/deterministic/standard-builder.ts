/**
 * STANDARD MODE deterministic prompt builder.
 *
 * @module prompt/deterministic/standard-builder
 */

import { GENRE_REGISTRY } from '@bun/instruments';
import { articulateInstrument } from '@bun/prompt/articulations';
import { buildAllSections } from '@bun/prompt/sections';

import { resolveGenre } from './genre';
import {
  truncatePrompt,
  selectRecordingContext,
  getBpmRangeForGenre,
  selectKeyAndMode,
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
 * @param options - Generation options including description and optional genre override
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
 */
export function buildDeterministicStandardPrompt(
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

  // 4. Get BPM range - uses blended range for multi-genre
  const bpmRange = getBpmRangeForGenre(displayGenre);

  // 5. Get genre display name - capitalize each component for display
  const genreDisplayName = components
    .map((g) => GENRE_REGISTRY[g]?.name ?? g)
    .join(' ');

  // 6. Select key and mode
  const keyMode = selectKeyAndMode(rng);

  // 7. Build section templates using primary genre
  const sectionsResult = buildAllSections({
    genre: primaryGenre,
    rng,
    trackInstruments: instrumentsResult.instruments,
  });

  // 8. Select primary mood for header (capitalize first letter)
  const primaryMood = styleResult.tags[0] ?? 'Energetic';
  const capitalizedMood = primaryMood.charAt(0).toUpperCase() + primaryMood.slice(1);

  // 9. Articulate instruments for display in header
  const articulatedForDisplay = instrumentsResult.instruments.map((i) =>
    articulateInstrument(i, rng)
  );

  // 10. Get recording context (same as MAX MODE for remix compatibility)
  const recordingContext = selectRecordingContext(rng);

  // 11. Format the STANDARD MODE prompt
  const rawPrompt = `[${capitalizedMood}, ${genreDisplayName}, ${keyMode}]

Genre: ${genreDisplayName}
BPM: ${bpmRange}
Mood: ${styleResult.tags.slice(0, 3).join(', ')}
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
