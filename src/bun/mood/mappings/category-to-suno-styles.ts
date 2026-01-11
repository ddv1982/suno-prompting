/**
 * Category-to-Suno-Styles Mapping
 *
 * Provides mapping from mood categories to compatible Suno V5 styles.
 * Uses genre-based bridging: category → genres → styles.
 *
 * @module mood/mappings/category-to-suno-styles
 */


import { MOOD_CATEGORY_KEYS } from '@bun/mood/categories';
import { getGenresForCategory } from '@bun/mood/mappings/category-to-genres';
import { SUNO_V5_STYLES } from '@shared/suno-v5-styles';

import type { MoodCategory } from '@bun/mood/types';

/** Cached mapping of categories to compatible styles */
let categoryToStylesCache: Map<MoodCategory, string[]> | null = null;

/**
 * Extract genre keywords from Suno V5 style name.
 * Styles are compound names like "Progressive House", "Neo-Soul".
 *
 * @param style - The style name to extract keywords from
 * @returns Array of lowercase keywords
 */
function extractGenreKeywords(style: string): string[] {
  // Split on spaces and hyphens, normalize to lowercase
  return style.toLowerCase().split(/[\s-]+/);
}

/**
 * Build mapping from mood categories to compatible Suno V5 styles.
 * Uses compatible genres to filter styles.
 *
 * @returns Map of category to compatible style names
 */
function buildCategoryToStylesMapping(): Map<MoodCategory, string[]> {
  const mapping = new Map<MoodCategory, string[]>();

  for (const category of MOOD_CATEGORY_KEYS) {
    const compatibleGenres = getGenresForCategory(category);
    const genreKeywords = new Set(compatibleGenres.map((g) => g.toLowerCase()));

    // If no compatible genres, include an empty array
    if (genreKeywords.size === 0) {
      mapping.set(category, []);
      continue;
    }

    const compatibleStyles = SUNO_V5_STYLES.filter((style) => {
      const styleKeywords = extractGenreKeywords(style);
      return styleKeywords.some((keyword) => genreKeywords.has(keyword));
    });

    mapping.set(category, compatibleStyles);
  }

  return mapping;
}

/**
 * Get Suno V5 styles compatible with a mood category.
 * Uses cached mapping built at initialization.
 *
 * @param category - The mood category to look up
 * @returns Array of compatible Suno V5 style names
 */
export function getSunoStylesForCategory(category: MoodCategory): string[] {
  if (!categoryToStylesCache) {
    categoryToStylesCache = buildCategoryToStylesMapping();
  }
  return categoryToStylesCache.get(category) ?? [];
}

/**
 * Initialize category-to-styles mappings.
 * Builds cache for O(1) lookups. Call once at app startup.
 */
export function initializeCategoryToStylesMappings(): void {
  categoryToStylesCache = buildCategoryToStylesMapping();
}

/**
 * Clear the cache. Mainly useful for testing.
 */
export function clearCategoryToStylesCache(): void {
  categoryToStylesCache = null;
}
