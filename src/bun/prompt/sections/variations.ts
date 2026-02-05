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
import { selectRandomN, type Rng } from '@shared/utils/random';

import { GENERIC_MOODS, GENERIC_DESCRIPTORS } from './templates';

import type { Dynamics } from './types';
import type { GenreType } from '@bun/instruments/genres';

// =============================================================================
// Selection Helpers
// =============================================================================

/**
 * Select random items from an array.
 * Wrapper around selectRandomN that handles count > items.length gracefully.
 *
 * @param items - Array to select from
 * @param count - Number of items to select
 * @param rng - Random number generator
 * @returns Array of selected items (may be fewer than count if items.length < count)
 */
export function selectRandom<T>(items: readonly T[], count: number, rng: Rng): T[] {
  if (items.length === 0) return [];
  return selectRandomN(items, Math.min(count, items.length), rng);
}

// =============================================================================
// Helper Functions
// =============================================================================

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
  const effectiveCount = Math.min(count, toSelect.length);
  const selected = effectiveCount > 0 ? selectRandomN(toSelect, effectiveCount, rng) : [];
  return selected.map((instrument) => articulateInstrument(instrument, rng));
}

/**
 * Interpolate placeholders in a template string.
 *
 * @param template - Template string with placeholders
 * @param values - Values to interpolate
 * @returns Interpolated string
 */
export function interpolateTemplate(template: string, values: Record<string, string>): string {
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

// =============================================================================
// Dynamics-Aware Selection
// =============================================================================

/**
 * Descriptors mapped by dynamics level.
 * Each dynamics level has a set of appropriate descriptors that match
 * the intended energy/intensity of the section.
 */
const DYNAMICS_DESCRIPTORS: Record<Dynamics, readonly string[]> = {
  soft: ['gentle', 'delicate', 'subtle', 'whispered', 'intimate', 'tender'],
  building: ['rising', 'growing', 'layered', 'expanding', 'emerging', 'swelling'],
  powerful: ['bold', 'rich', 'full', 'commanding', 'resonant', 'majestic'],
  explosive: ['thunderous', 'intense', 'massive', 'soaring', 'electrifying', 'triumphant'],
};

/**
 * Articulation probability adjustments based on dynamics level.
 * Higher values increase likelihood of adding articulation.
 */
const DYNAMICS_ARTICULATION_CHANCE: Record<Dynamics, number> = {
  soft: 0.4, // Lower chance, more subtle
  building: 0.6, // Moderate chance
  powerful: 0.8, // Higher chance, more character
  explosive: 0.95, // Almost always articulated for impact
};

/**
 * Get a descriptor appropriate for the specified dynamics level.
 *
 * @param dynamics - Dynamics level from contrast section
 * @param rng - Random number generator
 * @returns Descriptor appropriate for the dynamics level
 *
 * @example
 * getDescriptorForDynamics('soft', Math.random)
 * // 'gentle' or 'delicate' or 'subtle' etc.
 *
 * @example
 * getDescriptorForDynamics('explosive', Math.random)
 * // 'thunderous' or 'intense' or 'massive' etc.
 */
export function getDescriptorForDynamics(dynamics: Dynamics, rng: () => number): string {
  const descriptors = DYNAMICS_DESCRIPTORS[dynamics];
  return selectOne(descriptors, rng);
}

/**
 * Select instruments for a section with dynamics-influenced articulation.
 *
 * Similar to selectSectionInstruments but adjusts articulation probability
 * based on the dynamics level:
 * - soft: subtle articulations, lower chance
 * - building: moderate articulations
 * - powerful: bold articulations, higher chance
 * - explosive: maximum articulation for impact
 *
 * @param genre - Target genre
 * @param count - Number of instruments needed
 * @param usedInstruments - Already used instruments (to avoid)
 * @param rng - Random number generator
 * @param dynamics - Dynamics level affecting articulation
 * @returns Array of selected and articulated instruments
 *
 * @example
 * selectSectionInstrumentsWithDynamics('rock', 2, [], Math.random, 'explosive')
 * // ['Thunderous drums', 'Soaring electric guitar']
 */
export function selectSectionInstrumentsWithDynamics(
  genre: GenreType,
  count: number,
  usedInstruments: readonly string[],
  rng: () => number,
  dynamics: Dynamics
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

  // Select instruments
  const effectiveCount = Math.min(count, toSelect.length);
  const selected = effectiveCount > 0 ? selectRandomN(toSelect, effectiveCount, rng) : [];

  // Apply articulation with dynamics-adjusted probability
  const articulationChance = DYNAMICS_ARTICULATION_CHANCE[dynamics];
  return selected.map((instrument) => articulateInstrument(instrument, rng, articulationChance));
}
