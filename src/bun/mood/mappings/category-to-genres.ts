/**
 * Category-to-Genres Mapping
 *
 * Provides reverse lookup from mood categories to compatible genres.
 * Uses genre.moods arrays to determine compatibility.
 *
 * @module mood/mappings/category-to-genres
 */

import { GENRE_REGISTRY, type GenreType } from '@bun/instruments';

import { MOOD_CATEGORIES, MOOD_CATEGORY_KEYS } from '../categories';

import type { MoodCategory } from '../types';


/** Cached mapping of categories to compatible genres */
let categoryToGenresCache: Map<MoodCategory, GenreType[]> | null = null;

/**
 * Build reverse lookup from genre.moods arrays.
 * For each mood category, find genres whose moods overlap with category moods.
 *
 * @returns Map of category to compatible genres
 */
function buildCategoryToGenresMapping(): Map<MoodCategory, GenreType[]> {
  const mapping = new Map<MoodCategory, GenreType[]>();

  for (const category of MOOD_CATEGORY_KEYS) {
    const definition = MOOD_CATEGORIES[category];
    const compatibleGenres: GenreType[] = [];
    const categoryMoodsLower = definition.moods.map((m) => m.toLowerCase());

    for (const [genreType, genreDef] of Object.entries(GENRE_REGISTRY)) {
      // Check if genre has moods defined
      if (!genreDef.moods || genreDef.moods.length === 0) {
        continue;
      }

      // Check if genre's moods overlap with category's moods (case-insensitive)
      const genreMoodsLower = genreDef.moods.map((m) => m.toLowerCase());

      const hasOverlap = genreMoodsLower.some((genreMood) =>
        categoryMoodsLower.some(
          (catMood) =>
            genreMood.includes(catMood) || catMood.includes(genreMood),
        ),
      );

      if (hasOverlap) {
        compatibleGenres.push(genreType as GenreType);
      }
    }

    mapping.set(category, compatibleGenres);
  }

  return mapping;
}

/**
 * Get genres compatible with a mood category.
 * Uses cached mapping built at initialization.
 *
 * @param category - The mood category to look up
 * @returns Array of compatible genre types
 */
export function getGenresForCategory(category: MoodCategory): GenreType[] {
  if (!categoryToGenresCache) {
    categoryToGenresCache = buildCategoryToGenresMapping();
  }
  return categoryToGenresCache.get(category) ?? [];
}

/**
 * Initialize category-to-genres mappings.
 * Builds cache and populates compatibleGenres in MOOD_CATEGORIES.
 * Call once at app startup.
 */
export function initializeCategoryToGenresMappings(): void {
  categoryToGenresCache = buildCategoryToGenresMapping();

  // Populate compatibleGenres in MOOD_CATEGORIES for reference
  for (const [category, genres] of categoryToGenresCache.entries()) {
    const def = MOOD_CATEGORIES[category];
    // Cast to mutable to populate the compatibleGenres array
    (def as unknown as { compatibleGenres: string[] }).compatibleGenres = genres;
  }
}

/**
 * Clear the cache. Mainly useful for testing.
 */
export function clearCategoryToGenresCache(): void {
  categoryToGenresCache = null;
}
