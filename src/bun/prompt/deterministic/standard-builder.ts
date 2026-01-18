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
import { createSeededRng } from '@shared/utils/random';

import { resolveGenre } from './genre';
import {
  truncatePrompt,
  joinRecordingDescriptors,
  getBpmRangeForGenreWithTrace,
  selectKeyAndModeWithTrace,
} from './helpers';
import { assembleInstruments } from './instruments';
import { assembleStyleTags, selectMoodsForCreativity } from './styles';

import type { DeterministicOptions, DeterministicResult, StyleTagsResult } from './types';
import type { GenreType } from '@bun/instruments/genres';
import type { MoodCategory } from '@bun/mood';
import type { TraceCollector } from '@bun/trace';
import type { ThematicContext } from '@shared/schemas/thematic-context';

/**
 * Resolve moods based on thematic context, category override, creativity level, or genre defaults.
 *
 * Priority (highest to lowest):
 * 1. ThematicContext moods (LLM-extracted) - REPLACE genre moods entirely
 * 2. MoodCategory (user-selected)
 * 3. Creativity-based compound moods (creativityLevel > 60)
 * 4. Genre-derived moods from style tags
 */
function resolveMoodsWithOverrides(
  styleResult: StyleTagsResult,
  primaryGenre: GenreType,
  moodCategory: MoodCategory | undefined,
  creativityLevel: number,
  rng: () => number,
  trace?: TraceCollector,
  thematicContext?: ThematicContext
): readonly string[] {
  // Priority 1: Thematic context moods REPLACE genre moods entirely
  if (thematicContext && thematicContext.moods.length > 0) {
    const moods = thematicContext.moods.slice(0, 3);
    traceDecision(trace, {
      domain: 'mood',
      key: 'deterministic.moods.source',
      branchTaken: 'thematicContext',
      why: `thematicContext provided with ${moods.length} moods; replacing genre moods`,
      selection: { method: 'shuffleSlice', candidates: moods },
    });
    return moods;
  }

  // Priority 2: Mood category override
  if (moodCategory) {
    const categoryMoods = selectMoodsForCategory(moodCategory, 3, rng);
    const moods = categoryMoods.length > 0 ? categoryMoods : styleResult.moodTags.slice(0, 3);

    traceDecision(trace, {
      domain: 'mood',
      key: 'deterministic.moods.source',
      branchTaken: categoryMoods.length > 0 ? 'moodCategory' : 'moodCategory.fallback',
      why:
        categoryMoods.length > 0
          ? `moodCategory=${moodCategory} selected=${categoryMoods.length}`
          : `moodCategory=${moodCategory} returned empty; using genre-derived moods`,
      selection: categoryMoods.length > 0
        ? { method: 'shuffleSlice', candidates: categoryMoods }
        : undefined,
    });
    return moods;
  }

  if (creativityLevel > 60) {
    const moods = selectMoodsForCreativity(primaryGenre, creativityLevel, 3, rng, trace);
    traceDecision(trace, {
      domain: 'mood',
      key: 'deterministic.moods.source',
      branchTaken: 'creativityBased',
      why: `creativityLevel=${creativityLevel} > 60; using compound moods`,
      selection: { method: 'shuffleSlice', candidates: moods },
    });
    return moods;
  }

  const moods = styleResult.moodTags.slice(0, 3);
  traceDecision(trace, {
    domain: 'mood',
    key: 'deterministic.moods.source',
    branchTaken: 'moodTags',
    why: 'no moodCategory override; using genre-derived moods from moodTags',
    selection: { method: 'shuffleSlice', candidates: moods },
  });
  return moods;
}

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
  const { description, genreOverride, moodCategory, creativityLevel = 50, seed, rng: providedRng, trace, thematicContext } = options;

  // Determine RNG: use provided rng, or create seeded rng from seed, or default to Math.random
  const rng = providedRng ?? (seed !== undefined ? createSeededRng(seed) : Math.random);

  // Trace seed usage for debugging
  if (seed !== undefined && !providedRng) {
    traceDecision(trace, {
      domain: 'other',
      key: 'deterministic.standard.seed',
      branchTaken: 'seeded-rng',
      why: `seed=${seed} provided; using seeded RNG for reproducibility`,
    });
  }

  // Trace thematic context usage
  if (thematicContext) {
    traceDecision(trace, {
      domain: 'other',
      key: 'deterministic.standard.thematicContext',
      branchTaken: 'hybrid-merge',
      why: `thematicContext provided; will merge LLM moods (${thematicContext.moods.length}), themes (${thematicContext.themes.length}), and scene`,
    });
  }

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
  // Pass thematicContext to append first 2 themes to style tags
  const styleResult = assembleStyleTags({
    components,
    rng,
    trace,
    thematicContext,
  });

  // 3b. Resolve moods based on thematic context, category, creativity, or genre defaults
  // Thematic context moods REPLACE genre moods entirely
  const moods = resolveMoodsWithOverrides(
    styleResult, primaryGenre, moodCategory, creativityLevel, rng, trace, thematicContext
  );

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
  // When thematicContext is provided, use first LLM mood for header
  const primaryMood = moods[0] ?? 'Energetic';
  const capitalizedMood = primaryMood.charAt(0).toUpperCase() + primaryMood.slice(1);

  // 9. Articulate instruments for display in header
  const articulatedForDisplay = instrumentsResult.instruments.map((i) =>
    articulateInstrument(i, rng),
  );

  // 10. Get recording context (production/studio descriptors)
  const recordingContext = joinRecordingDescriptors({ rng, count: 2, trace });

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
