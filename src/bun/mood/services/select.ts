/**
 * Mood Selection Services
 *
 * Functions for selecting moods and genres based on mood categories.
 * Uses Fisher-Yates shuffle for fair random selection.
 *
 * @module mood/services/select
 */



import { MOOD_CATEGORIES } from '@bun/mood/categories';
import { getGenresForCategory } from '@bun/mood/mappings/category-to-genres';

import type { GenreType } from '@bun/instruments';
import type { MoodCategory } from '@bun/mood/types';

/**
 * Fisher-Yates shuffle algorithm.
 * Shuffles array in place and returns it.
 *
 * @param array - Array to shuffle
 * @param rng - Random number generator function
 * @returns The shuffled array
 */
function fisherYatesShuffle<T>(array: T[], rng: () => number): T[] {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    const temp = array[i];
    // Safe swap - we know indices are valid within the loop bounds
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    array[i] = array[j]!;
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    array[j] = temp!;
  }
  return array;
}

/**
 * Select moods from a category using Fisher-Yates shuffle.
 *
 * @param category - Mood category to select from
 * @param count - Number of moods to select
 * @param rng - Random number generator (defaults to Math.random)
 * @returns Array of selected mood strings
 *
 * @example
 * selectMoodsForCategory('energetic', 3);
 * // ['euphoric', 'vibrant', 'dynamic']
 *
 * @example
 * // Deterministic with fixed RNG
 * const rng = () => 0.5;
 * selectMoodsForCategory('calm', 2, rng);
 * // Always returns same result with same RNG
 */
export function selectMoodsForCategory(
  category: MoodCategory,
  count: number,
  rng: () => number = Math.random,
): string[] {
  const definition = MOOD_CATEGORIES[category];
  if (!definition) return [];

  // Create a copy to avoid mutating the original
  const moods = [...definition.moods];

  // Shuffle with provided RNG
  fisherYatesShuffle(moods, rng);

  // Return requested count (or all if fewer available)
  return moods.slice(0, Math.min(count, moods.length));
}

/**
 * Select a single genre compatible with the mood category.
 *
 * @param category - Mood category
 * @param rng - Random number generator
 * @returns Selected genre or null if no compatible genres
 *
 * @example
 * selectGenreForMoodCategory('groove');
 * // Returns 'funk' or 'disco' or other groove-compatible genre
 */
export function selectGenreForMoodCategory(
  category: MoodCategory,
  rng: () => number = Math.random,
): GenreType | null {
  const genres = getGenresForCategory(category);
  if (genres.length === 0) return null;

  const index = Math.floor(rng() * genres.length);
  return genres[index] ?? null;
}

/**
 * Select multiple genres compatible with the mood category.
 *
 * @param category - Mood category
 * @param count - Number of genres to select
 * @param rng - Random number generator
 * @returns Array of selected genres (may be less than count if fewer available)
 *
 * @example
 * selectGenresForMoodCategory('atmospheric', 2);
 * // ['ambient', 'dreampop']
 */
export function selectGenresForMoodCategory(
  category: MoodCategory,
  count: number,
  rng: () => number = Math.random,
): GenreType[] {
  const genres = [...getGenresForCategory(category)];
  if (genres.length === 0) return [];

  // Shuffle with provided RNG
  fisherYatesShuffle(genres, rng);

  // Return requested count (or all if fewer available)
  return genres.slice(0, Math.min(count, genres.length));
}
