/**
 * Mood Filter Services
 *
 * Functions for filtering Suno V5 styles and genres by mood category.
 * All functions use cached mappings for O(1) performance.
 *
 * @module mood/services/filter
 */



import { getGenresForCategory } from '../mappings/category-to-genres';
import { getSunoStylesForCategory } from '../mappings/category-to-suno-styles';

import type { MoodCategory } from '../types';
import type { GenreType } from '@bun/instruments';

/**
 * Filter Suno V5 styles by mood category.
 * Returns all styles compatible with the category's genres.
 *
 * @param category - Mood category to filter by
 * @returns Array of compatible Suno V5 style strings
 *
 * @example
 * filterSunoStylesByMoodCategory('groove');
 * // ['funk', 'disco', 'g-funk', ...]
 */
export function filterSunoStylesByMoodCategory(
  category: MoodCategory,
): string[] {
  return getSunoStylesForCategory(category);
}

/**
 * Filter genres by mood category.
 * Returns all genres whose moods overlap with the category.
 *
 * @param category - Mood category to filter by
 * @returns Array of compatible genre types
 *
 * @example
 * filterGenresByMoodCategory('calm');
 * // ['ambient', 'lofi', 'newage', ...]
 */
export function filterGenresByMoodCategory(category: MoodCategory): GenreType[] {
  return getGenresForCategory(category);
}

/**
 * Check if a Suno V5 style is compatible with a mood category.
 *
 * @param style - The Suno V5 style to check
 * @param category - The mood category to check against
 * @returns True if the style is compatible with the category
 *
 * @example
 * isSunoStyleCompatibleWithCategory('funk', 'groove');
 * // true
 */
export function isSunoStyleCompatibleWithCategory(
  style: string,
  category: MoodCategory,
): boolean {
  const compatibleStyles = getSunoStylesForCategory(category);
  // Compare lowercase to handle case differences
  const styleLower = style.toLowerCase();
  return compatibleStyles.some((s) => s.toLowerCase() === styleLower);
}
