/**
 * Random selection utilities for deterministic and non-deterministic selection.
 *
 * @module shared/utils/random
 */

import { InvariantError } from '@shared/errors';

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
export function selectRandom<T>(items: readonly T[], rng: () => number = Math.random): T {
  if (items.length === 0) {
    throw new InvariantError('selectRandom called with empty array');
  }
  const idx = Math.floor(rng() * items.length);
  return items[idx] as T;
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
export function selectRandomN<T>(items: readonly T[], count: number, rng: () => number = Math.random): T[] {
  if (count > items.length) {
    throw new InvariantError(`selectRandomN: requested ${count} items but array only has ${items.length}`);
  }
  if (count <= 0) {
    return [];
  }

  // Fisher-Yates shuffle on a copy, then take first N
  const shuffled = [...items];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j] as T, shuffled[i] as T];
  }
  return shuffled.slice(0, count);
}

/**
 * Create a seeded pseudo-random number generator.
 * Useful for deterministic random selection in tests or reproducible generation.
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
export function createSeededRng(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
}
