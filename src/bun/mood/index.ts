/**
 * Mood Module
 *
 * Public API for mood category system.
 * Provides types, registries, mappings, and services for
 * mood-based filtering and selection.
 *
 * @module mood
 *
 * @example
 * import {
 *   MOOD_CATEGORIES,
 *   getMoodCategoryOptions,
 *   selectMoodsForCategory,
 *   filterSunoStylesByMoodCategory,
 *   initializeMoodMappings,
 * } from '@bun/mood';
 *
 * // Initialize mappings at app startup
 * initializeMoodMappings();
 *
 * // Get options for a combobox
 * const options = getMoodCategoryOptions();
 *
 * // Select moods from a category
 * const moods = selectMoodsForCategory('energetic', 3);
 *
 * // Filter Suno V5 styles by mood category
 * const styles = filterSunoStylesByMoodCategory('groove');
 */

// Types
export type {
  MoodCategory,
  MoodCategoryDefinition,
  MoodCategoryOption,
  MoodCategoryRegistry,
} from './types';

// Category registry
export {
  MOOD_CATEGORIES,
  MOOD_CATEGORY_KEYS,
  getMoodCategoryOptions,
} from './categories';

// Mappings
export {
  getGenresForCategory,
  getSunoStylesForCategory,
  initializeCategoryToGenresMappings,
  initializeCategoryToStylesMappings,
  clearCategoryToGenresCache,
  clearCategoryToStylesCache,
} from './mappings';

// Services
export {
  selectMoodsForCategory,
  selectGenreForMoodCategory,
  selectGenresForMoodCategory,
  filterSunoStylesByMoodCategory,
  filterGenresByMoodCategory,
  isSunoStyleCompatibleWithCategory,
} from './services';

// Import initialization functions for the combined initializer
import { initializeCategoryToGenresMappings } from './mappings/category-to-genres';
import { initializeCategoryToStylesMappings } from './mappings/category-to-suno-styles';

/**
 * Initialize all mood mappings.
 * Call once at app startup before using mood services.
 *
 * This builds cached mappings for:
 * - Category to compatible genres
 * - Category to compatible Suno V5 styles
 *
 * @example
 * // In app initialization
 * import { initializeMoodMappings } from '@bun/mood';
 * initializeMoodMappings();
 */
export function initializeMoodMappings(): void {
  initializeCategoryToGenresMappings();
  initializeCategoryToStylesMappings();
}
