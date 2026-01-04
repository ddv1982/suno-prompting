// Shared utilities for prompt conversion modules
// Consolidates duplicate logic between max-conversion.ts and non-max-conversion.ts

import { GENRE_REGISTRY, type GenreType } from '@bun/instruments/genres';
import { selectInstrumentsForGenre } from '@bun/instruments/guidance';
import { articulateInstrument } from '@bun/prompt/articulations';
import { APP_CONSTANTS } from '@shared/constants';
import { formatGenreLabels } from '@shared/labels';

// ============================================================================
// Constants
// ============================================================================

export const DEFAULT_BPM = 90;
export const DEFAULT_GENRE = 'ambient';
export const DEFAULT_INSTRUMENTS_FALLBACK = 'ambient pad, subtle textures';

// ============================================================================
// Genre Utilities
// ============================================================================

/**
 * Extract the first genre from a potentially comma-separated genre string
 * Note: Splits on commas only, not spaces (genres can have spaces like "hip hop")
 */
export function extractFirstGenre(genre: string): string {
  return genre.split(',')[0]?.toLowerCase().trim() || '';
}

// Genre aliases for common variations (defined before normalizeGenre which uses it)
export const GENRE_ALIASES: Record<string, string> = {
  'hip hop': 'trap',
  'hip-hop': 'trap',
  'hiphop': 'trap',
  'rnb': 'rnb',
  'r&b': 'rnb',
  'r and b': 'rnb',
  'lofi': 'lofi',
  'lo-fi': 'lofi',
  'lo fi': 'lofi',
  'edm': 'electronic',
  'dance': 'house',
  'dnb': 'electronic',
  'drum and bass': 'electronic',
  'orchestral': 'cinematic',
  'film score': 'cinematic',
  'soundtrack': 'cinematic',
  'acoustic': 'folk',
  'singer-songwriter': 'folk',
  'singer songwriter': 'folk',
  'r&b/soul': 'rnb',
  'progressive rock': 'rock',
  'prog rock': 'rock',
  'alternative': 'indie',
  'alt rock': 'indie',
  'hard rock': 'rock',
  'classic rock': 'rock',
  'nu metal': 'metal',
  'heavy metal': 'metal',
  'thrash': 'metal',
  'neo soul': 'soul',
  'neo-soul': 'soul',
  'bossa nova': 'jazz',
  'bossa': 'jazz',
  'smooth jazz': 'jazz',
  'bebop': 'jazz',
  'fusion': 'jazz',
};

/**
 * Normalize genre string and look up in registry or aliases
 */
export function normalizeGenre(genre: string): string | null {
  const normalized = genre.toLowerCase().trim();

  // Direct registry lookup
  if (normalized in GENRE_REGISTRY) {
    return normalized;
  }

  // Check aliases
  if (normalized in GENRE_ALIASES) {
    return GENRE_ALIASES[normalized] || null;
  }

  // Try first word for compound genres like "jazz fusion"
  const firstWord = normalized.split(/[\s,]+/)[0];
  if (firstWord && firstWord in GENRE_REGISTRY) {
    return firstWord;
  }

  return null;
}

// ============================================================================
// BPM Inference
// ============================================================================

/**
 * Infer BPM from genre using GENRE_REGISTRY
 * Handles comma-separated multi-genre strings by using the first genre
 * Can use either normalized lookup (with aliases) or direct lookup
 */
export function inferBpm(genre: string | null, useAliases = true): number {
  if (!genre) return DEFAULT_BPM;

  const firstGenre = extractFirstGenre(genre);
  const lookupGenre = useAliases ? normalizeGenre(firstGenre) : firstGenre;
  
  if (lookupGenre && lookupGenre in GENRE_REGISTRY) {
    const genreDef = GENRE_REGISTRY[lookupGenre as GenreType];
    if (genreDef?.bpm) {
      return genreDef.bpm.typical;
    }
  }

  return DEFAULT_BPM;
}

// ============================================================================
// Instrument Enhancement
// ============================================================================

/**
 * Enhance instruments list with articulations.
 * If no instruments provided, selects genre-appropriate defaults.
 * Handles comma-separated multi-genre strings by using the first genre.
 *
 * Priority: parsed instruments > performance guidance > genre fallback
 */
export function enhanceInstruments(
  instruments: string[],
  genre: string | null,
  fallback = DEFAULT_INSTRUMENTS_FALLBACK,
  performanceInstruments?: string[]
): string {
  let instrumentList = instruments;
  
  // Priority: parsed > performance guidance > genre fallback
  if (instrumentList.length === 0 && performanceInstruments?.length) {
    instrumentList = performanceInstruments;
  } else if (instrumentList.length === 0) {
    const firstGenre = genre ? extractFirstGenre(genre) : null;
    const normalizedGenre = firstGenre ? normalizeGenre(firstGenre) : null;
    
    if (normalizedGenre && normalizedGenre in GENRE_REGISTRY) {
      instrumentList = selectInstrumentsForGenre(normalizedGenre as GenreType, { maxTags: 3 });
    } else {
      return fallback;
    }
  }

  const enhanced = instrumentList.map((instrument) =>
    articulateInstrument(instrument, Math.random, APP_CONSTANTS.ARTICULATION_CHANCE)
  );

  return enhanced.join(', ');
}

// ============================================================================
// Genre Resolution
// ============================================================================

export interface ResolvedGenre {
  forOutput: string;   // Display string for the output
  forLookup: string;   // Key for BPM/instrument lookups
}

/**
 * Resolve effective genre from priority sources:
 * 1. sunoStyles (if provided) - inject directly as-is
 * 2. seedGenres (if provided) - format using display names
 * 3. detected (fallback) - use as-is
 */
export function resolveGenre(
  detected: string | null,
  seedGenres?: string[],
  sunoStyles?: string[]
): ResolvedGenre {
  if (sunoStyles?.length) {
    // Suno V5 styles: inject EXACTLY as-is (comma-separated if multiple)
    return {
      forOutput: sunoStyles.join(', '),
      forLookup: sunoStyles[0]?.split(' ')[0] || DEFAULT_GENRE,
    };
  }
  
  if (seedGenres?.length) {
    // Seed genres: format using display names
    return {
      forOutput: formatGenreLabels(seedGenres),
      forLookup: seedGenres[0] || DEFAULT_GENRE,
    };
  }
  
  // Detected from text (fallback)
  return {
    forOutput: detected || DEFAULT_GENRE,
    forLookup: detected || DEFAULT_GENRE,
  };
}
