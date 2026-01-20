/**
 * Standards Exception: File Size Limit
 *
 * This file is intentionally exempt from the 300-line limit (currently 332 lines).
 *
 * Reason: This file contains tightly coupled genre parsing logic and genre-specific
 * building functions (vocal descriptors, production descriptors, instruments).
 * The functions share data dependencies (GENRE_VOCAL_STYLES, GENRE_PRODUCTION_STYLES)
 * and splitting would:
 * - Create circular dependencies between files
 * - Fragment logically cohesive domain logic
 * - Add complexity without improving maintainability
 *
 * Approved: 2026-01-12
 * Issue: MIN-B06
 */

import { selectInstrumentsForGenre } from '@bun/instruments';
import { GENRE_REGISTRY, type GenreType } from '@bun/instruments/genres';
import {
  getBlendedHarmonicStyle,
  getBlendedTimeSignature,
  getBlendedPolyrhythm,
} from '@bun/instruments/genres/mappings';
import { pickRandom } from '@bun/instruments/services/random';
import { articulateInstrument } from '@bun/prompt/articulations';
import { getBlendedBpmRange, formatBpmRange } from '@bun/prompt/bpm';
import {
  GENRE_PRODUCTION_STYLES,
  DEFAULT_PRODUCTION_STYLE,
} from '@bun/prompt/production-elements';
import {
  GENRE_VOCAL_STYLES,
  DEFAULT_VOCAL_STYLE,
} from '@bun/prompt/vocal-descriptors';
import { APP_CONSTANTS } from '@shared/constants';

import type { HarmonicStyle } from '@bun/instruments/modes';
import type { PolyrhythmType, TimeSignatureType } from '@bun/instruments/rhythms';
import type { Rng } from '@bun/instruments/services/random';

/**
 * Check if a string is a valid single genre in the registry
 */
export function isValidGenre(genre: string): genre is GenreType {
  return genre.toLowerCase() in GENRE_REGISTRY;
}

/**
 * Parse a compound genre string and extract recognized genre components.
 * Handles strings like "ambient symphonic rock" → ["ambient", "symphonic", "rock"]
 */
export function parseGenreComponents(genre: string): GenreType[] {
  if (!genre?.trim()) return [];

  const normalized = genre.toLowerCase().trim();

  // If it's a single valid genre, return it directly
  if (isValidGenre(normalized)) {
    return [normalized];
  }

  // Split on common separators: spaces, hyphens, slashes, "and", "&"
  const parts = normalized
    .split(/[\s\-\/]+|(?:\s+and\s+)|(?:\s*&\s*)/)
    .filter(Boolean);

  // Extract recognized genres
  const recognized: GenreType[] = [];
  for (const part of parts) {
    if (isValidGenre(part)) {
      recognized.push(part);
    }
  }

  return recognized;
}

/**
 * Collect unique items from multiple arrays
 */
function collectUnique<T>(arrays: readonly (readonly T[])[]): T[] {
  const seen = new Set<T>();
  const result: T[] = [];
  for (const arr of arrays) {
    for (const item of arr) {
      if (!seen.has(item)) {
        seen.add(item);
        result.push(item);
      }
    }
  }
  return result;
}

/**
 * Build a blended vocal descriptor from multiple genre components.
 * Combines vocal characteristics from each genre for a richer description.
 */
export function buildBlendedVocalDescriptor(
  genres: GenreType[],
  rng: Rng = Math.random
): string {
  if (genres.length === 0) {
    const style = DEFAULT_VOCAL_STYLE;
    const range = pickRandom(style.ranges, rng) ?? 'Tenor';
    const delivery = pickRandom(style.deliveries, rng) ?? 'Smooth';
    const technique = pickRandom(style.techniques, rng) ?? 'Stacked Harmonies';
    return `${range}, ${delivery} Delivery, ${technique}`;
  }

  if (genres.length === 1) {
    const genre = genres[0] as string;
    const style = GENRE_VOCAL_STYLES[genre] ?? DEFAULT_VOCAL_STYLE;
    const range = pickRandom(style.ranges, rng) ?? 'Tenor';
    const delivery = pickRandom(style.deliveries, rng) ?? 'Smooth';
    const technique = pickRandom(style.techniques, rng) ?? 'Stacked Harmonies';
    return `${range}, ${delivery} Delivery, ${technique}`;
  }

  // Collect from all genres
  const allRanges = collectUnique(
    genres.map((g) => GENRE_VOCAL_STYLES[g]?.ranges ?? DEFAULT_VOCAL_STYLE.ranges)
  );
  const allDeliveries = collectUnique(
    genres.map((g) => GENRE_VOCAL_STYLES[g]?.deliveries ?? DEFAULT_VOCAL_STYLE.deliveries)
  );
  const allTechniques = collectUnique(
    genres.map((g) => GENRE_VOCAL_STYLES[g]?.techniques ?? DEFAULT_VOCAL_STYLE.techniques)
  );

  // Pick one from each pool
  const range = pickRandom(allRanges, rng) ?? 'Tenor';
  const delivery = pickRandom(allDeliveries, rng) ?? 'Smooth';
  const technique = pickRandom(allTechniques, rng) ?? 'Stacked Harmonies';

  return `${range}, ${delivery} Delivery, ${technique}`;
}

/**
 * Build a blended production descriptor from multiple genre components.
 * Combines production characteristics for a hybrid sound.
 */
export function buildBlendedProductionDescriptor(
  genres: GenreType[],
  rng: Rng = Math.random
): string {
  if (genres.length === 0) {
    const style = DEFAULT_PRODUCTION_STYLE;
    const texture = pickRandom(style.textures, rng) ?? 'Polished Production';
    const reverb = pickRandom(style.reverbs, rng) ?? 'Studio Reverb';
    return `${texture}, ${reverb}`;
  }

  if (genres.length === 1) {
    const genre = genres[0] as string;
    const style = GENRE_PRODUCTION_STYLES[genre] ?? DEFAULT_PRODUCTION_STYLE;
    const texture = pickRandom(style.textures, rng) ?? 'Polished Production';
    const reverb = pickRandom(style.reverbs, rng) ?? 'Studio Reverb';
    return `${texture}, ${reverb}`;
  }

  // Collect from all genres
  const allReverbs = collectUnique(
    genres.map((g) => GENRE_PRODUCTION_STYLES[g]?.reverbs ?? DEFAULT_PRODUCTION_STYLE.reverbs)
  );
  const allTextures = collectUnique(
    genres.map((g) => GENRE_PRODUCTION_STYLES[g]?.textures ?? DEFAULT_PRODUCTION_STYLE.textures)
  );

  const texture = pickRandom(allTextures, rng) ?? 'Polished Production';
  const reverb = pickRandom(allReverbs, rng) ?? 'Studio Reverb';

  return `${texture}, ${reverb}`;
}

/**
 * Select instruments from multiple genre components.
 * Combines instrument pools from each genre for a richer palette.
 */
export function selectInstrumentsForMultiGenre(
  genres: GenreType[],
  rng: Rng = Math.random,
  maxInstruments = 3
): string[] {
  if (genres.length === 0) return [];

  // Collect instruments from each genre
  const allInstruments: string[] = [];
  for (const genre of genres) {
    const instruments = selectInstrumentsForGenre(genre, {});
    // Take first 2 from each genre to ensure variety
    allInstruments.push(...instruments.slice(0, 2));
  }

  // Dedupe
  const unique = [...new Set(allInstruments)];

  // Shuffle and take maxInstruments (Fisher-Yates)
  for (let i = unique.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    const temp = unique[i];
    if (temp !== undefined && unique[j] !== undefined) {
      unique[i] = unique[j];
      unique[j] = temp;
    }
  }

  // Articulate each instrument
  return unique
    .slice(0, maxInstruments)
    .map((i) => articulateInstrument(i, rng, APP_CONSTANTS.ARTICULATION_CHANCE));
}

/**
 * Cache for performance guidance results.
 * Key: normalized genre string (lowercase)
 * Value: computed guidance object
 */
/** Maximum cache size to prevent unbounded memory growth */
const GUIDANCE_CACHE_MAX_SIZE = 100;

const guidanceCache = new Map<string, { vocal: string; production: string; instruments: string[] }>();

/**
 * Internal implementation of performance guidance building.
 */
function buildPerformanceGuidanceImpl(
  components: GenreType[],
  rng: Rng
): { vocal: string; production: string; instruments: string[] } {
  return {
    vocal: buildBlendedVocalDescriptor(components, rng),
    production: buildBlendedProductionDescriptor(components, rng),
    instruments: selectInstrumentsForMultiGenre(components, rng),
  };
}

/**
 * Build complete performance guidance for a genre string (single or compound).
 * Returns null if no valid genres found.
 *
 * Results are memoized per normalized genre string for performance.
 * When using custom RNG, the cache is bypassed to allow for testing.
 */
export function buildPerformanceGuidance(
  genreString: string,
  rng: Rng = Math.random
): { vocal: string; production: string; instruments: string[] } | null {
  const components = parseGenreComponents(genreString);
  if (components.length === 0) return null;

  const cacheKey = genreString.toLowerCase().trim();

  // Use cache only when using default RNG (Math.random)
  // This allows tests to pass custom RNG and get fresh results
  const useCache = rng === Math.random;

  if (useCache) {
    const cached = guidanceCache.get(cacheKey);
    if (cached) {
      return cached;
    }
  }

  const guidance = buildPerformanceGuidanceImpl(components, rng);

  if (useCache) {
    // Evict oldest entries if cache is full (simple LRU approximation)
    if (guidanceCache.size >= GUIDANCE_CACHE_MAX_SIZE) {
      const firstKey = guidanceCache.keys().next().value;
      if (firstKey !== undefined) {
        guidanceCache.delete(firstKey);
      }
    }
    guidanceCache.set(cacheKey, guidance);
  }

  return guidance;
}

/**
 * Clear the guidance cache. Useful for testing.
 * @internal
 */
function clearGuidanceCache(): void {
  guidanceCache.clear();
}

/**
 * @internal
 * Test helpers for unit testing internal functions.
 * Do not use in production code.
 */
export const _testHelpers = {
  clearGuidanceCache,
} as const;

/**
 * Result type for multi-genre guidance including all blended elements.
 */
export interface MultiGenreGuidance {
  readonly vocal: string;
  readonly production: string;
  readonly instruments: string[];
  readonly bpmRange: string | null;
  readonly harmonicStyle: HarmonicStyle | null;
  readonly timeSignature: TimeSignatureType | null;
  readonly polyrhythm: PolyrhythmType | null;
}

/**
 * Build complete multi-genre performance guidance including all blended elements.
 * Combines basic performance guidance with BPM range, harmonic style, time signature, and polyrhythm.
 *
 * @param genreString - A genre string like "jazz rock" or "ambient, metal"
 * @param rng - Optional random number generator (defaults to Math.random)
 * @returns Complete guidance object with all blended elements, or null if invalid input
 */
export function buildMultiGenreGuidance(
  genreString: string,
  rng: Rng = Math.random
): MultiGenreGuidance | null {
  const components = parseGenreComponents(genreString);
  if (components.length === 0) return null;

  // Get basic performance guidance
  const basicGuidance = buildPerformanceGuidance(genreString, rng);
  if (!basicGuidance) return null;

  // Get blended BPM range
  const bpmResult = getBlendedBpmRange(genreString);
  const bpmRange = bpmResult ? formatBpmRange(bpmResult) : null;

  // Get blended harmonic style
  const harmonicStyle = getBlendedHarmonicStyle(genreString, rng);

  // Get blended time signature
  const timeSignature = getBlendedTimeSignature(genreString, rng);

  // Get blended polyrhythm (only for applicable genres)
  const polyrhythm = getBlendedPolyrhythm(genreString, rng);

  return {
    ...basicGuidance,
    bpmRange,
    harmonicStyle,
    timeSignature,
    polyrhythm,
  };
}
