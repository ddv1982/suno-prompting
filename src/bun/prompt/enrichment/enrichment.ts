/**
 * Centralized Prompt Enrichment Service
 *
 * Single source of truth for genre-based prompt enhancement.
 * Used by both seed genres and Suno V5 styles paths.
 *
 * @module prompt/enrichment/enrichment
 */

import { createLogger } from '@bun/logger';
import { selectMoodsForCategory } from '@bun/mood';
import { getBlendedBpmRange, formatBpmRange } from '@bun/prompt/bpm';
import { SUNO_STYLE_GENRE_MAP } from '@bun/prompt/datasets/suno-style-mappings';
import { assembleInstruments } from '@bun/prompt/deterministic/instruments';
import { assembleStyleTags } from '@bun/prompt/deterministic/styles';
import { buildBlendedProductionDescriptor, buildBlendedVocalDescriptor } from '@bun/prompt/genre-parser';
import { traceDecision } from '@bun/trace';


import { buildMaxModeEnrichedLines, buildStandardModeEnrichedLines } from './formatters';

import type { EnrichmentResult, EnrichmentOptions, EnrichedSunoStyleResult } from './types';
import type { GenreType } from '@bun/instruments/genres';
import type { Rng } from '@bun/instruments/services/random';
import type { MoodCategory } from '@bun/mood';
import type { TraceCollector } from '@bun/trace';

const log = createLogger('Enrichment');

/**
 * Default enrichment for when no genres are extracted.
 */
function getDefaultEnrichment(rng: Rng, moodCategory?: MoodCategory, trace?: TraceCollector): EnrichmentResult {
  const defaultGenres: GenreType[] = ['pop'];
  return enrichFromGenresInternal(defaultGenres, rng, moodCategory, trace);
}

/**
 * Internal enrichment logic without logging (to avoid recursion).
 *
 * When moodCategory is provided, moods are selected from that category
 * instead of being derived from genre style tags.
 */
function enrichFromGenresInternal(
  genres: GenreType[],
  rng: Rng,
  moodCategory?: MoodCategory,
  trace?: TraceCollector,
): EnrichmentResult {
  // Use existing pipeline functions - no duplication
  const styleResult = assembleStyleTags(genres, rng, trace);
  const instrumentResult = assembleInstruments(genres, rng, trace);
  const production = buildBlendedProductionDescriptor(genres, rng);
  const vocalStyle = buildBlendedVocalDescriptor(genres, rng);

  // Get BPM range with warning for unexpected nulls
  const genreString = genres.join(' ');
  const bpmResult = getBlendedBpmRange(genreString);

  if (!bpmResult && genres.length > 0) {
    log.warn('enrichFromGenres:noBpmRange', { genres: genreString });
  }

  const bpmRange = bpmResult ? formatBpmRange(bpmResult) : 'between 90 and 120';

  traceDecision(trace, {
    domain: 'bpm',
    key: 'enrichment.bpm.range',
    branchTaken: bpmResult ? 'blended' : 'fallback',
    why: bpmResult
      ? `genres=${genreString} range=${bpmRange}`
      : `no BPM range found for genres=${genreString}; using default`,
  });

  // Select moods: use mood category if provided, otherwise use style tags
  let moods: string[];
  if (moodCategory) {
    const categoryMoods = selectMoodsForCategory(moodCategory, 3, rng);
    // Fall back to style tags if category selection returns empty
    moods = categoryMoods.length > 0 ? categoryMoods : [...styleResult.tags.slice(0, 3)];

    traceDecision(trace, {
      domain: 'mood',
      key: 'enrichment.moods.source',
      branchTaken: categoryMoods.length > 0 ? 'moodCategory' : 'moodCategory.fallback',
      why:
        categoryMoods.length > 0
          ? `moodCategory=${moodCategory} selected=${categoryMoods.length}`
          : `moodCategory=${moodCategory} returned empty; using styleTags`,
      selection: categoryMoods.length > 0
        ? {
            method: 'shuffleSlice',
            candidates: categoryMoods,
          }
        : undefined,
    });
  } else {
    moods = [...styleResult.tags.slice(0, 3)];

    traceDecision(trace, {
      domain: 'mood',
      key: 'enrichment.moods.source',
      branchTaken: 'styleTags',
      why: 'no moodCategory override; using styleTags-derived moods',
      selection: {
        method: 'shuffleSlice',
        candidates: moods,
      },
    });
  }

  return {
    moods,
    instruments: [...instrumentResult.instruments],
    instrumentsFormatted: instrumentResult.formatted,
    vocalStyle,
    production,
    styleTags: [...styleResult.tags],
    chordProgression: instrumentResult.chordProgression,
    bpmRange,
  };
}

/**
 * Enrich prompt metadata from genre components.
 * Used by both seed genres and Suno V5 styles paths.
 *
 * When moodCategory is provided, moods are selected from that category
 * instead of being derived from genre style tags.
 *
 * @param genres - Array of recognized genre types
 * @param rngOrOptions - Random number generator OR options object
 * @returns Complete enrichment result with all metadata
 */
export function enrichFromGenres(
  genres: GenreType[],
  rngOrOptions: Rng | EnrichmentOptions = Math.random,
): EnrichmentResult {
  // Handle both old function signature (rng only) and new options object
  const options: EnrichmentOptions =
    typeof rngOrOptions === 'function'
      ? { rng: rngOrOptions }
      : rngOrOptions;

  const rng = options.rng ?? Math.random;
  const moodCategory = options.moodCategory;
  const trace = options.trace;

  if (genres.length === 0) {
    log.info('enrichFromGenres:empty', { fallback: 'pop' });
    return getDefaultEnrichment(rng, moodCategory, trace);
  }

  log.info('enrichFromGenres', { genreCount: genres.length, genres, moodCategory });
  return enrichFromGenresInternal(genres, rng, moodCategory, trace);
}

/**
 * Extract recognized genres from Suno V5 style strings.
 * Parses style names to find known genre keywords.
 *
 * @param sunoStyles - Array of Suno V5 style names
 * @returns Array of recognized GenreType values
 */
export function extractGenresFromSunoStyles(sunoStyles: string[]): GenreType[] {
  const genres = new Set<GenreType>();

  for (const style of sunoStyles) {
    // Split on spaces, hyphens, and underscores
    const words = style.toLowerCase().split(/[\s\-_]+/);

    for (const word of words) {
      const mapped = SUNO_STYLE_GENRE_MAP[word as keyof typeof SUNO_STYLE_GENRE_MAP];
      if (mapped) {
        genres.add(mapped);
      }
    }
  }

  return Array.from(genres);
}

/**
 * Build enriched metadata for Suno V5 styles.
 * Preserves styles as-is, enriches everything else based on extracted genres.
 *
 * When moodCategory is provided, moods are selected from that category
 * instead of being derived from genre style tags.
 *
 * @param sunoStyles - Array of Suno V5 style names (passed through unchanged)
 * @param rngOrOptions - Random number generator OR options object
 * @returns Enriched result with raw styles and metadata
 */
export function enrichSunoStyles(
  sunoStyles: string[],
  rngOrOptions: Rng | EnrichmentOptions = Math.random,
): EnrichedSunoStyleResult {
  // Handle both old function signature (rng only) and new options object
  const options: EnrichmentOptions =
    typeof rngOrOptions === 'function'
      ? { rng: rngOrOptions }
      : rngOrOptions;

  const rng = options.rng ?? Math.random;
  const moodCategory = options.moodCategory;
  const trace = options.trace;

  // Input validation: filter out empty/invalid entries
  const validStyles = sunoStyles.filter(
    (s): s is string => typeof s === 'string' && s.trim().length > 0,
  );

  // Extract genres for enrichment (styles stay as-is)
  const extractedGenres = extractGenresFromSunoStyles(validStyles);

  log.info('enrichSunoStyles', {
    inputCount: sunoStyles.length,
    validCount: validStyles.length,
    extractedCount: extractedGenres.length,
    genres: extractedGenres,
    moodCategory,
  });

  // Get enrichment from extracted genres (or default if none found)
  const enrichment =
    extractedGenres.length > 0
      ? enrichFromGenresInternal(extractedGenres, rng, moodCategory, trace)
      : getDefaultEnrichment(rng, moodCategory, trace);

  return {
    rawStyles: validStyles,
    extractedGenres,
    enrichment,
  };
}

/**
 * Build a complete enriched prompt for Suno V5 styles.
 * Preserves styles as-is in genre field, enriches everything else.
 *
 * @param sunoStyles - Array of Suno V5 style names
 * @param options - Options including maxMode and rng
 * @returns Complete prompt string and enrichment metadata
 */
export function buildEnrichedSunoStylePrompt(
  sunoStyles: string[],
  options: { maxMode: boolean; rng?: Rng }
): { prompt: string; metadata: EnrichedSunoStyleResult } {
  const { maxMode, rng = Math.random } = options;

  const metadata = enrichSunoStyles(sunoStyles, rng);
  const { enrichment } = metadata;

  const lines = maxMode
    ? buildMaxModeEnrichedLines(metadata.rawStyles, enrichment)
    : buildStandardModeEnrichedLines(metadata.rawStyles, enrichment);

  return {
    prompt: lines.join('\n'),
    metadata,
  };
}

/**
 * Check if any genres were successfully extracted from Suno V5 styles.
 * Useful for determining if enrichment will be meaningful.
 */
export function hasExtractableGenres(sunoStyles: string[]): boolean {
  return extractGenresFromSunoStyles(sunoStyles).length > 0;
}

/**
 * @internal
 * Test helpers for unit testing internal functions.
 * Do not use in production code.
 */
export const _testHelpers = {
  getDefaultEnrichment,
  SUNO_STYLE_GENRE_MAP,
} as const;

// Re-export types for convenience
export type { EnrichmentResult, EnrichmentOptions, EnrichedSunoStyleResult } from './types';
