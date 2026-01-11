/**
 * Style tag assembly for deterministic prompt generation.
 *
 * @module prompt/deterministic/styles
 */

import { GENRE_REGISTRY } from '@bun/instruments';
import { buildBlendedProductionDescriptor } from '@bun/prompt/genre-parser';
import { buildProductionDescriptorMulti } from '@bun/prompt/production-elements';
import {
  selectVocalTags,
  selectSpatialTags,
  selectHarmonicTags,
  selectDynamicTags,
  selectTemporalTags,
  selectTextureTags,
  selectRecordingContext,
} from '@bun/prompt/realism-tags';

import type { StyleTagsResult } from './types';
import type { GenreType } from '@bun/instruments/genres';

/**
 * Weighted tag category configuration for deterministic selection.
 * Defines probability thresholds and max counts for each category.
 * 
 * Probabilities are tuned based on musical production best practices:
 * - **Vocal (60%):** High probability for vocal-forward genres, skipped for instrumental
 * - **Spatial (50%):** Balanced to add depth without overwhelming
 * - **Harmonic (40%):** Selective enrichment of tonal character
 * - **Dynamic (40%):** Controlled dynamics for production polish
 * - **Temporal (30%):** Subtle timing/groove hints without over-emphasis
 * 
 * Adjust these values to tune overall tag distribution across all prompts.
 * 
 * @since v2.0.0
 */
const TAG_CATEGORY_WEIGHTS = {
  vocal: { probability: 0.6, maxCount: 2 },
  spatial: { probability: 0.5, maxCount: 1 },
  harmonic: { probability: 0.4, maxCount: 1 },
  dynamic: { probability: 0.4, maxCount: 1 },
  temporal: { probability: 0.3, maxCount: 1 },
} as const;

/**
 * Apply weighted tag selection with probability threshold.
 * Reduces code duplication and cyclomatic complexity.
 * 
 * @param probability - Selection probability (0.0-1.0)
 * @param selector - Function to select tags
 * @param addUnique - Function to add tags to collection
 * @param rng - Random number generator
 * 
 * @example
 * applyWeightedSelection(
 *   0.6,
 *   () => selectVocalTags('jazz', 2, rng),
 *   addUnique,
 *   rng
 * );
 */
function applyWeightedSelection(
  probability: number,
  selector: () => string[],
  addUnique: (tag: string) => void,
  rng: () => number
): void {
  if (rng() >= probability) return;
  
  const tags = selector();
  for (const tag of tags) {
    addUnique(tag);
  }
}

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
 * **New in v2:**
 * - Increased tag count from 6 to 8-10
 * - Added 6 new weighted tag categories (vocal, spatial, harmonic, dynamic, temporal, texture)
 * - Independent probability-based selection for each category
 * - Hybrid genre support with electronic ratio weighting
 * - Multi-dimensional production descriptors (4 separate tags: reverb, texture, stereo, dynamic)
 * - Genre-specific recording contexts (1 per prompt, selected from 141 contexts across 18 genres)
 * - Production combinations increased from 204 → 30,600 for single-genre prompts
 *
 * @param components - Array of genre components (supports single or multi-genre)
 * @param rng - Random number generator for deterministic selection
 * @returns Formatted style tags string and array (8-10 tags)
 *
 * @example
 * assembleStyleTags(['jazz'], Math.random)
 * // { tags: ['smooth', 'warm', 'breathy delivery', 'wide stereo field', 'plate reverb', 'analog warmth', 'wide stereo', 'natural dynamics', 'intimate jazz club'], formatted: '...' }
 *
 * @example
 * assembleStyleTags(['jazz', 'rock'], Math.random)
 * // Blends moods and production from both genres
 */
/**
 * Apply weighted tag selection with probability threshold.
 * Exported for testing purposes.
 * 
 * @internal
 */
export { applyWeightedSelection };

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

  // 1. Select moods from all genre components' mood pools (always 2 per genre)
  for (const genre of components) {
    const moods = selectMoodsForGenre(genre, 2, rng);
    for (const mood of moods) {
      addUnique(mood);
    }
  }

  // 2. Weighted independent selection for new tag categories
  
  // Vocal: genre-aware via GENRE_VOCAL_PROBABILITY
  applyWeightedSelection(
    TAG_CATEGORY_WEIGHTS.vocal.probability,
    () => selectVocalTags(primaryGenre, TAG_CATEGORY_WEIGHTS.vocal.maxCount, rng),
    addUnique,
    rng
  );

  // Spatial: stereo imaging and reverb
  applyWeightedSelection(
    TAG_CATEGORY_WEIGHTS.spatial.probability,
    () => selectSpatialTags(TAG_CATEGORY_WEIGHTS.spatial.maxCount, rng),
    addUnique,
    rng
  );

  // Harmonic: tonal character
  applyWeightedSelection(
    TAG_CATEGORY_WEIGHTS.harmonic.probability,
    () => selectHarmonicTags(TAG_CATEGORY_WEIGHTS.harmonic.maxCount, rng),
    addUnique,
    rng
  );

  // Dynamic: compression and loudness
  applyWeightedSelection(
    TAG_CATEGORY_WEIGHTS.dynamic.probability,
    () => selectDynamicTags(TAG_CATEGORY_WEIGHTS.dynamic.maxCount, rng),
    addUnique,
    rng
  );

  // Temporal: timing and groove
  applyWeightedSelection(
    TAG_CATEGORY_WEIGHTS.temporal.probability,
    () => selectTemporalTags(TAG_CATEGORY_WEIGHTS.temporal.maxCount, rng),
    addUnique,
    rng
  );

  // 3. Texture tags (replaces some old realism tag selection)
  const textureTags = selectTextureTags(2, rng);
  for (const tag of textureTags) {
    addUnique(tag);
  }

  // 4. Add production descriptor elements (multi-dimensional for maximum variety)
  if (components.length > 1) {
    // For multi-genre, use blended production descriptor for now
    const blended = buildBlendedProductionDescriptor(components, rng);
    const parts = blended.split(',').map((p) => p.trim().toLowerCase());
    for (const part of parts) {
      if (part) addUnique(part);
    }
  } else {
    // For single genre, use multi-dimensional production (30,600 combinations)
    const production = buildProductionDescriptorMulti(rng);
    addUnique(production.reverb);
    addUnique(production.texture);
    addUnique(production.stereo);
    addUnique(production.dynamic);
  }

  // 5. Add recording context (new in v2)
  // Uses primary genre for genre-specific context selection
  const recordingContext = selectRecordingContext(primaryGenre, rng);
  addUnique(recordingContext);

  // 6. Cap at 8-10 total tags (prioritize early selections)
  const finalTags = allTags.slice(0, 10);

  return {
    tags: finalTags,
    formatted: finalTags.join(', '),
  };
}
