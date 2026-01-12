/**
 * Types for Enrichment Module
 *
 * @module prompt/enrichment/types
 */

import type { GenreType } from '@bun/instruments/genres';
import type { Rng } from '@bun/instruments/services/random';
import type { MoodCategory } from '@bun/mood';

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
 * Options for enrichment functions.
 */
export interface EnrichmentOptions {
  /** Random number generator for selections (defaults to Math.random) */
  rng?: Rng;
  /** Optional mood category to override genre-based mood selection */
  moodCategory?: MoodCategory;
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
