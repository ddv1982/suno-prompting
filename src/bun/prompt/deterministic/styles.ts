/**
 * Style tag assembly for deterministic prompt generation.
 *
 * @module prompt/deterministic/styles
 */

import { GENRE_REGISTRY } from '@bun/instruments';
import { buildBlendedProductionDescriptor } from '@bun/prompt/genre-parser';
import { buildProductionDescriptor } from '@bun/prompt/production-elements';
import {
  selectRealismTags,
  selectElectronicTags,
  isElectronicGenre,
  selectGenericTags,
} from '@bun/prompt/realism-tags';

import type { StyleTagsResult } from './types';
import type { GenreType } from '@bun/instruments/genres';

/**
 * Select random moods from a genre's mood pool.
 *
 * @param genre - Target genre
 * @param count - Number of moods to select
 * @param rng - Random number generator
 * @returns Array of selected moods
 *
 * @example
 * selectMoodsForGenre('jazz', 2, Math.random)
 * // ['smooth', 'warm']
 */
function selectMoodsForGenre(
  genre: GenreType,
  count: number,
  rng: () => number
): string[] {
  const genreDef = GENRE_REGISTRY[genre];
  const moods = genreDef?.moods ?? [];

  if (moods.length === 0) return [];

  const shuffled = [...moods].sort(() => rng() - 0.5);
  return shuffled.slice(0, count).map((m) => m.toLowerCase());
}

/**
 * Assemble style tags from mood pool, realism/electronic tags, and production.
 * Supports multi-genre blending when multiple components are provided.
 *
 * @param components - Array of genre components (supports single or multi-genre)
 * @param rng - Random number generator
 * @returns Formatted style tags string and array
 *
 * @example
 * assembleStyleTags(['jazz'], Math.random)
 * // { tags: ['smooth', 'warm', 'sophisticated', 'natural dynamics'], formatted: '...' }
 *
 * @example
 * assembleStyleTags(['jazz', 'rock'], Math.random)
 * // Blends moods and production from both genres
 */
export function assembleStyleTags(
  components: GenreType[],
  rng: () => number = Math.random
): StyleTagsResult {
  const primaryGenre = components[0] ?? 'pop';
  const allTags: string[] = [];
  const seenTags = new Set<string>();

  const addUnique = (tag: string): void => {
    const lower = tag.toLowerCase();
    if (!seenTags.has(lower)) {
      seenTags.add(lower);
      allTags.push(lower);
    }
  };

  // 1. Select moods from all genre components' mood pools
  for (const genre of components) {
    const moods = selectMoodsForGenre(genre, 2, rng);
    for (const mood of moods) {
      addUnique(mood);
    }
  }

  // 2. Select realism or electronic tags based on primary genre
  let styleTags: string[];
  if (isElectronicGenre(primaryGenre)) {
    styleTags = selectElectronicTags(3, rng);
  } else {
    styleTags = selectRealismTags(primaryGenre, 3, rng);
  }

  if (styleTags.length === 0) {
    styleTags = selectGenericTags(3, rng);
  }

  for (const tag of styleTags) {
    addUnique(tag);
  }

  // 3. Add production descriptor elements
  const productionDesc =
    components.length > 1
      ? buildBlendedProductionDescriptor(components, rng)
      : buildProductionDescriptor(primaryGenre, rng);

  const productionParts = productionDesc.split(',').map((p) => p.trim().toLowerCase());
  for (const part of productionParts) {
    if (part) addUnique(part);
  }

  const finalTags = allTags.slice(0, 6);

  return {
    tags: finalTags,
    formatted: finalTags.join(', '),
  };
}
