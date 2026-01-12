/**
 * Section Variation Selection Logic
 *
 * Contains helper functions for selecting variations, instruments,
 * and mood descriptors for section templates.
 *
 * @module prompt/sections/variations
 */

import { GENRE_REGISTRY, selectInstrumentsForGenre } from '@bun/instruments';
import { articulateInstrument } from '@bun/prompt/articulations';
import { InvariantError } from '@shared/errors';
import { selectRandomN } from '@shared/utils/random';

import { GENERIC_MOODS, GENERIC_DESCRIPTORS } from './templates';

import type { GenreType } from '@bun/instruments/genres';

// =============================================================================
// Helper Functions
// =============================================================================

/**
 * Select random items from an array using provided RNG.
 * Re-exports from shared utility for backward compatibility.
 *
 * @param items - Array to select from
 * @param count - Number of items to select
 * @param rng - Random number generator
 * @returns Selected items
 */
export function selectRandom<T>(items: readonly T[], count: number, rng: () => number): T[] {
  if (items.length === 0) return [];
  return selectRandomN(items, Math.min(count, items.length), rng);
}

/**
 * Select a random item from an array using provided RNG.
 *
 * @param items - Array to select from
 * @param rng - Random number generator
 * @returns Single selected item
 */
export function selectOne<T>(items: readonly T[], rng: () => number): T {
  if (items.length === 0) {
    throw new InvariantError('selectOne called with empty array');
  }
  const idx = Math.floor(rng() * items.length);
  const item = items[idx];
  if (item === undefined) {
    // Fallback to first item (should never happen with valid index)
    return items[0] as T;
  }
  return item;
}

/**
 * Get mood descriptors for a genre.
 *
 * @param genre - Target genre
 * @returns Array of mood strings (lowercase)
 *
 * @example
 * getMoodsForGenre('jazz')
 * // ['smooth', 'warm', 'sophisticated', 'intimate']
 */
export function getMoodsForGenre(genre: GenreType): readonly string[] {
  const genreDef = GENRE_REGISTRY[genre];
  if (genreDef?.moods && genreDef.moods.length > 0) {
    return genreDef.moods.map((m) => m.toLowerCase());
  }
  return GENERIC_MOODS;
}

/**
 * Select instruments for a specific section, ensuring variety from track instruments.
 *
 * @param genre - Target genre
 * @param count - Number of instruments needed
 * @param usedInstruments - Already used instruments (to avoid)
 * @param rng - Random number generator
 * @returns Array of selected instruments
 *
 * @example
 * selectSectionInstruments('jazz', 2, ['piano'], Math.random)
 * // ['Arpeggiated Rhodes', 'Breathy tenor sax']
 */
export function selectSectionInstruments(
  genre: GenreType,
  count: number,
  usedInstruments: readonly string[],
  rng: () => number
): string[] {
  // Get a larger pool of instruments for variety
  const poolSize = Math.max(count * 3, 6);
  const instrumentPool = selectInstrumentsForGenre(genre, {
    maxTags: poolSize,
    rng,
  });

  // Filter out already used instruments for variety
  const available = instrumentPool.filter((i) => !usedInstruments.includes(i));

  // If not enough available, include some used ones
  const toSelect = available.length >= count ? available : instrumentPool;

  // Select and articulate the instruments
  const selected = selectRandom(toSelect, count, rng);
  return selected.map((instrument) => articulateInstrument(instrument, rng));
}

/**
 * Interpolate placeholders in a template string.
 *
 * @param template - Template string with placeholders
 * @param values - Values to interpolate
 * @returns Interpolated string
 */
export function interpolateTemplate(
  template: string,
  values: Record<string, string>
): string {
  let result = template;
  for (const [key, value] of Object.entries(values)) {
    result = result.replace(new RegExp(`\\{${key}\\}`, 'g'), value);
  }
  return result;
}

/**
 * Get a random descriptor from the generic descriptors pool.
 *
 * @param rng - Random number generator
 * @returns Selected descriptor
 */
export function getRandomDescriptor(rng: () => number): string {
  return selectOne(GENERIC_DESCRIPTORS, rng);
}
