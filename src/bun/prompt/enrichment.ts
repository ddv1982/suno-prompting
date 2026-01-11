/**
 * Centralized Prompt Enrichment Service
 *
 * Single source of truth for genre-based prompt enhancement.
 * Used by both seed genres and Suno V5 styles paths.
 *
 * @module prompt/enrichment
 */

import { createLogger } from '@bun/logger';
import { getBlendedBpmRange, formatBpmRange } from '@bun/prompt/bpm';
import { SUNO_STYLE_GENRE_MAP } from '@bun/prompt/datasets/suno-style-mappings';
import { assembleInstruments } from '@bun/prompt/deterministic/instruments';
import { assembleStyleTags } from '@bun/prompt/deterministic/styles';
import { buildBlendedProductionDescriptor, buildBlendedVocalDescriptor } from '@bun/prompt/genre-parser';

import type { GenreType } from '@bun/instruments/genres';
import type { Rng } from '@bun/instruments/services/random';

const log = createLogger('Enrichment');

/**
 * Result of enriching a prompt with genre-based metadata.
 */
export interface EnrichmentResult {
  /** Moods selected from genre pools */
  moods: string[];
  /** Articulated instruments with genre-appropriate selection */
  instruments: string[];
  /** Full formatted instruments string including vocals and chord progression */
  instrumentsFormatted: string;
  /** Vocal style descriptor */
  vocalStyle: string;
  /** Production/recording texture (texture + reverb) */
  production: string;
  /** Style tags (moods + realism/electronic tags + production) */
  styleTags: string[];
  /** Chord progression if applicable */
  chordProgression: string;
  /** BPM range string (e.g., "between 80 and 100") */
  bpmRange: string;
}

/**
 * Default enrichment for when no genres are extracted.
 */
function getDefaultEnrichment(rng: Rng): EnrichmentResult {
  const defaultGenres: GenreType[] = ['pop'];
  return enrichFromGenresInternal(defaultGenres, rng);
}

/**
 * Internal enrichment logic without logging (to avoid recursion).
 */
function enrichFromGenresInternal(
  genres: GenreType[],
  rng: Rng
): EnrichmentResult {
  // Use existing pipeline functions - no duplication
  const styleResult = assembleStyleTags(genres, rng);
  const instrumentResult = assembleInstruments(genres, rng);
  const production = buildBlendedProductionDescriptor(genres, rng);
  const vocalStyle = buildBlendedVocalDescriptor(genres, rng);

  // Get BPM range with warning for unexpected nulls
  const genreString = genres.join(' ');
  const bpmResult = getBlendedBpmRange(genreString);

  if (!bpmResult && genres.length > 0) {
    log.warn('enrichFromGenres:noBpmRange', { genres: genreString });
  }

  const bpmRange = bpmResult ? formatBpmRange(bpmResult) : 'between 90 and 120';

  return {
    moods: [...styleResult.tags.slice(0, 3)],
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
 * @param genres - Array of recognized genre types
 * @param rng - Random number generator for selections
 * @returns Complete enrichment result with all metadata
 */
export function enrichFromGenres(
  genres: GenreType[],
  rng: Rng = Math.random
): EnrichmentResult {
  if (genres.length === 0) {
    log.info('enrichFromGenres:empty', { fallback: 'pop' });
    return getDefaultEnrichment(rng);
  }

  log.info('enrichFromGenres', { genreCount: genres.length, genres });
  return enrichFromGenresInternal(genres, rng);
}

/**
 * Extract recognized genres from Suno V5 style strings.
 * Parses style names to find known genre keywords.
 *
 * @example
 * extractGenresFromSunoStyles(['dreamy shoegaze']) → ['dreampop']
 * extractGenresFromSunoStyles(['afrobeat disco', 'hawaiian electropop']) → ['afrobeat', 'disco', 'electronic']
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
 * Result of building an enriched Suno V5 style prompt.
 */
export interface EnrichedSunoStyleResult {
  /** The raw Suno V5 styles (preserved exactly as-is) */
  rawStyles: string[];
  /** The genres extracted for enrichment */
  extractedGenres: GenreType[];
  /** The enrichment metadata */
  enrichment: EnrichmentResult;
}

/**
 * Build enriched metadata for Suno V5 styles.
 * Preserves styles as-is, enriches everything else based on extracted genres.
 *
 * @param sunoStyles - Array of Suno V5 style names (passed through unchanged)
 * @param rng - Random number generator for selections
 * @returns Enriched result with raw styles and metadata
 */
export function enrichSunoStyles(
  sunoStyles: string[],
  rng: Rng = Math.random
): EnrichedSunoStyleResult {
  // Input validation: filter out empty/invalid entries
  const validStyles = sunoStyles.filter(
    (s): s is string => typeof s === 'string' && s.trim().length > 0
  );

  // Extract genres for enrichment (styles stay as-is)
  const extractedGenres = extractGenresFromSunoStyles(validStyles);

  log.info('enrichSunoStyles', {
    inputCount: sunoStyles.length,
    validCount: validStyles.length,
    extractedCount: extractedGenres.length,
    genres: extractedGenres,
  });

  // Get enrichment from extracted genres (or default if none found)
  const enrichment =
    extractedGenres.length > 0
      ? enrichFromGenresInternal(extractedGenres, rng)
      : getDefaultEnrichment(rng);

  return {
    rawStyles: validStyles,
    extractedGenres,
    enrichment,
  };
}

/**
 * Build max mode prompt lines with enrichment.
 * Suno V5 styles go directly into genre field.
 *
 * @param sunoStyles - Raw Suno V5 styles (preserved exactly)
 * @param enrichment - Enrichment metadata
 * @returns Array of prompt lines for max mode
 */
export function buildMaxModeEnrichedLines(
  sunoStyles: string[],
  enrichment: EnrichmentResult
): string[] {
  const lines: string[] = [];

  // Max mode headers
  lines.push('[Is_MAX_MODE: MAX](MAX)');
  lines.push('[QUALITY: MAX](MAX)');
  lines.push('[REALISM: MAX](MAX)');
  lines.push('[REAL_INSTRUMENTS: MAX](MAX)');

  // Genre field: Suno V5 styles exactly as-is
  lines.push(`genre: "${sunoStyles.join(', ')}"`);

  // Enriched fields
  lines.push(`bpm: "${enrichment.bpmRange}"`);
  lines.push(`instruments: "${enrichment.instrumentsFormatted}"`);
  lines.push(`style tags: "${enrichment.styleTags.join(', ')}"`);
  lines.push(`recording: "${enrichment.production}"`);

  return lines;
}

/**
 * Build standard mode prompt lines with enrichment.
 * Suno V5 styles go directly into genre field.
 *
 * @param sunoStyles - Raw Suno V5 styles (preserved exactly)
 * @param enrichment - Enrichment metadata
 * @returns Array of prompt lines for standard mode
 */
export function buildStandardModeEnrichedLines(
  sunoStyles: string[],
  enrichment: EnrichmentResult
): string[] {
  const lines: string[] = [];
  const topMoods = enrichment.moods.slice(0, 2).join(', ');

  // Header line
  lines.push(`[${topMoods}, ${sunoStyles.join(', ')}]`);
  lines.push('');

  // Metadata
  lines.push(`Genre: ${sunoStyles.join(', ')}`);
  lines.push(`BPM: ${enrichment.bpmRange}`);
  lines.push(`Mood: ${enrichment.moods.join(', ')}`);
  lines.push(`Instruments: ${enrichment.instrumentsFormatted}`);
  lines.push(`Style Tags: ${enrichment.styleTags.join(', ')}`);
  lines.push(`Recording: ${enrichment.production}`);

  return lines;
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
