/**
 * Mood Selection Services
 *
 * Functions for selecting moods and genres based on mood categories.
 * Uses shared shuffle utility for fair random selection.
 *
 * @module mood/services/select
 */

import { MOOD_CATEGORIES } from '@bun/mood/categories';
import { getGenresForCategory } from '@bun/mood/mappings/category-to-genres';
import { shuffle } from '@shared/utils/random';

import type { GenreType } from '@bun/instruments';
import type { MoodCategory } from '@bun/mood/types';

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

  const shuffled = shuffle(definition.moods, rng);
  return shuffled.slice(0, Math.min(count, shuffled.length));
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
  const genres = getGenresForCategory(category);
  if (genres.length === 0) return [];

  const shuffled = shuffle(genres, rng);
  return shuffled.slice(0, Math.min(count, shuffled.length));
}
