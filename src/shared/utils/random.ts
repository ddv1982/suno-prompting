/**
 * Random selection utilities for deterministic and non-deterministic selection.
 *
 * @module shared/utils/random
 */

import { InvariantError } from '@shared/errors';

/**
 * Type for random number generator function.
 */
export type Rng = () => number;

/**
 * Select a single random element from an array.
 *
 * @param items - Array to select from (must not be empty)
 * @param rng - Random number generator function (defaults to Math.random)
 * @returns Single randomly selected item
 * @throws {InvariantError} If items array is empty
 *
 * @example
 * ```typescript
 * const genres = ['jazz', 'rock', 'pop'];
 * const selected = selectRandom(genres); // e.g., 'rock'
 *
 * // With seeded RNG for deterministic selection
 * const seededRng = createSeededRng(42);
 * const selected = selectRandom(genres, seededRng); // always same result for seed 42
 * ```
 */
export function selectRandom<T>(items: readonly T[], rng: Rng = Math.random): T {
  if (items.length === 0) {
    throw new InvariantError('selectRandom called with empty array');
  }
  const idx = Math.floor(rng() * items.length);
  return items[idx] as T;
}

/**
 * Pick a random element from an array, returning undefined for empty arrays.
 * Use this when empty arrays are valid input.
 *
 * @param items - Array to pick from
 * @param rng - Random number generator function (defaults to Math.random)
 * @returns Randomly selected item or undefined if array is empty
 *
 * @example
 * ```typescript
 * const items = ['a', 'b', 'c'];
 * const item = pickRandom(items); // e.g., 'b' or undefined if empty
 * ```
 */
export function pickRandom<T>(items: readonly T[], rng: Rng = Math.random): T | undefined {
  if (items.length === 0) return undefined;
  return items[Math.floor(rng() * items.length)];
}

/**
 * Shuffle an array using Fisher-Yates algorithm.
 *
 * Returns a new shuffled array without modifying the original.
 * Uses proper Fisher-Yates shuffle for unbiased random ordering
 * (unlike `sort(() => rng() - 0.5)` which has statistical bias).
 *
 * @param items - Array to shuffle
 * @param rng - Random number generator function (defaults to Math.random)
 * @returns New array with elements in random order
 *
 * @example
 * ```typescript
 * const cards = ['A', 'B', 'C', 'D'];
 * const shuffled = shuffle(cards); // e.g., ['C', 'A', 'D', 'B']
 *
 * // With seeded RNG for deterministic shuffling
 * const seededRng = createSeededRng(42);
 * const shuffled = shuffle(cards, seededRng); // always same order for seed 42
 * ```
 */
export function shuffle<T>(items: readonly T[], rng: Rng = Math.random): T[] {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [result[i], result[j]] = [result[j] as T, result[i] as T];
  }
  return result;
}

/**
 * Select N unique random elements from an array.
 *
 * @param items - Array to select from
 * @param count - Number of items to select
 * @param rng - Random number generator function (defaults to Math.random)
 * @returns Array of N randomly selected unique items
 * @throws {InvariantError} If count exceeds items length
 *
 * @example
 * ```typescript
 * const instruments = ['piano', 'guitar', 'drums', 'bass', 'violin'];
 * const selected = selectRandomN(instruments, 3); // e.g., ['drums', 'piano', 'violin']
 * ```
 */
export function selectRandomN<T>(items: readonly T[], count: number, rng: Rng = Math.random): T[] {
  if (count > items.length) {
    throw new InvariantError(
      `selectRandomN: requested ${count} items but array only has ${items.length}`
    );
  }
  if (count <= 0) {
    return [];
  }
  return shuffle(items, rng).slice(0, count);
}

/**
 * Create a seeded pseudo-random number generator using Mulberry32 algorithm.
 * Useful for deterministic random selection in tests or reproducible generation.
 *
 * Mulberry32 provides excellent statistical properties and passes most
 * randomness tests while being fast and simple.
 *
 * @param seed - Seed value for the RNG
 * @returns A function that returns pseudo-random numbers between 0 and 1
 *
 * @example
 * ```typescript
 * const rng = createSeededRng(12345);
 * const value1 = rng(); // always same value for seed 12345
 * const value2 = rng(); // next value in sequence
 * ```
 */
export function createSeededRng(seed: number): Rng {
  let t = seed >>> 0;
  return () => {
    t += 0x6d2b79f5;
    let x = Math.imul(t ^ (t >>> 15), 1 | t);
    x ^= x + Math.imul(x ^ (x >>> 7), 61 | x);
    return ((x ^ (x >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Generate a random integer in an inclusive range.
 *
 * @param min - Minimum value (inclusive)
 * @param max - Maximum value (inclusive)
 * @param rng - Random number generator function (defaults to Math.random)
 * @returns Random integer between min and max (inclusive)
 *
 * @example
 * ```typescript
 * const roll = randomIntInclusive(1, 6); // e.g., 4 (dice roll)
 * ```
 */
export function randomIntInclusive(min: number, max: number, rng: Rng = Math.random): number {
  return min + Math.floor(rng() * (max - min + 1));
}

/**
 * Roll a probability check.
 *
 * @param chance - Probability (0-1). If undefined, returns true.
 * @param rng - Random number generator function (defaults to Math.random)
 * @returns True if the roll succeeds
 *
 * @example
 * ```typescript
 * if (rollChance(0.3)) {
 *   // 30% chance to execute
 * }
 * ```
 */
export function rollChance(chance: number | undefined, rng: Rng = Math.random): boolean {
  if (chance === undefined) return true;
  return rng() <= chance;
}
