/**
 * MAX MODE deterministic prompt builder.
 *
 * @module prompt/deterministic/max-builder
 */

import { selectMoodsForCategory } from '@bun/mood';
import { traceDecision } from '@bun/trace';
import { MAX_MODE_HEADER } from '@shared/max-format';
import { createSeededRng } from '@shared/utils/random';

import { resolveGenre } from './genre';
import { truncatePrompt, joinRecordingDescriptors, getBpmRangeForGenreWithTrace } from './helpers';
import { assembleInstruments } from './instruments';
import { assembleStyleTags, selectMoodsForCreativity } from './styles';

import type { DeterministicOptions, DeterministicResult, StyleTagsResult } from './types';
import type { GenreType } from '@bun/instruments/genres';
import type { MoodCategory } from '@bun/mood';
import type { TraceCollector } from '@bun/trace';

/**
 * Resolve style tags with mood overrides based on category or creativity level.
 */
function resolveStyleTagsWithOverrides(
  styleResult: StyleTagsResult,
  primaryGenre: GenreType,
  moodCategory: MoodCategory | undefined,
  creativityLevel: number,
  rng: () => number,
  trace?: TraceCollector
): { styleTags: string; styleTagsArray: readonly string[] } {
  // Helper to replace mood tags with new moods
  const replaceMoods = (newMoods: readonly string[]): { styleTags: string; styleTagsArray: readonly string[] } => {
    const nonMoodTags = styleResult.tags.filter((tag) => !styleResult.moodTags.includes(tag));
    const combinedTags = [...nonMoodTags.slice(0, 5), ...newMoods, ...nonMoodTags.slice(5)];
    const cappedTags = combinedTags.slice(0, 10);
    return { styleTags: cappedTags.join(', '), styleTagsArray: cappedTags };
  };

  if (moodCategory) {
    const categoryMoods = selectMoodsForCategory(moodCategory, 3, rng);
    if (categoryMoods.length > 0) {
      traceDecision(trace, {
        domain: 'mood',
        key: 'deterministic.moods.source',
        branchTaken: 'moodCategory',
        why: `moodCategory=${moodCategory} selected=${categoryMoods.length}`,
        selection: { method: 'shuffleSlice', candidates: categoryMoods },
      });
      return replaceMoods(categoryMoods);
    }
    traceDecision(trace, {
      domain: 'mood',
      key: 'deterministic.moods.source',
      branchTaken: 'moodCategory.fallback',
      why: `moodCategory=${moodCategory} returned empty; using genre-derived style tags`,
    });
    return { styleTags: styleResult.formatted, styleTagsArray: styleResult.tags };
  }

  if (creativityLevel > 60) {
    const compoundMoods = selectMoodsForCreativity(primaryGenre, creativityLevel, 3, rng, trace);
    traceDecision(trace, {
      domain: 'mood',
      key: 'deterministic.moods.source',
      branchTaken: 'creativityBased',
      why: `creativityLevel=${creativityLevel} > 60; using compound moods`,
      selection: { method: 'shuffleSlice', candidates: compoundMoods },
    });
    return replaceMoods(compoundMoods);
  }

  traceDecision(trace, {
    domain: 'mood',
    key: 'deterministic.moods.source',
    branchTaken: 'styleTags',
    why: 'no moodCategory override; using genre-derived style tags',
  });
  return { styleTags: styleResult.formatted, styleTagsArray: styleResult.tags };
}

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
  const { description, genreOverride, moodCategory, creativityLevel = 50, seed, rng: providedRng, trace } = options;

  // Determine RNG: use provided rng, or create seeded rng from seed, or default to Math.random
  const rng = providedRng ?? (seed !== undefined ? createSeededRng(seed) : Math.random);

  // Trace seed usage for debugging
  if (seed !== undefined && !providedRng) {
    traceDecision(trace, {
      domain: 'other',
      key: 'deterministic.max.seed',
      branchTaken: 'seeded-rng',
      why: `seed=${seed} provided; using seeded RNG for reproducibility`,
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
  const styleResult = assembleStyleTags(components, rng, trace);

  // 3b. Resolve style tags with mood overrides
  const { styleTags, styleTagsArray } = resolveStyleTagsWithOverrides(
    styleResult, primaryGenre, moodCategory, creativityLevel, rng, trace
  );

  // 4. Get recording context
  const recordingContext = joinRecordingDescriptors(rng, 2, trace);

  // 5. Get BPM range - uses blended range for multi-genre
  const bpmRange = getBpmRangeForGenreWithTrace(displayGenre, trace);

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
