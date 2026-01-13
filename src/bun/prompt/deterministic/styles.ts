/**
 * Style tag assembly for deterministic prompt generation.
 *
 * Tag Assembly Priority Order
 *
 * Tags are assembled in the following priority order. Production and recording
 * context tags are added first to ensure they are never dropped due to the
 * 10-tag limit. This prioritizes the most important tags for Suno.
 *
 * Priority (highest to lowest):
 * 1. Production Descriptor (4 tags: reverb, texture, stereo, dynamic) - ALWAYS INCLUDED
 * 2. Recording Context (1 tag) - ALWAYS INCLUDED
 * 3. Mood/Genre (2-4 tags from genre mood pool)
 * 4. Texture (2 tags)
 * 5. Vocal (0-2 tags, genre-weighted probability)
 * 6. Spatial (0-1 tag, genre-weighted probability)
 * 7. Harmonic (0-1 tag, genre-weighted probability)
 * 8. Dynamic (0-1 tag, genre-weighted probability)
 * 9. Temporal (0-1 tag, genre-weighted probability)
 *
 * Note: Due to probability-based selection, not all categories will be
 * included in every prompt. The 10-tag limit enforces conciseness.
 * When exceeded, tags are dropped from the end (lower priority categories).
 * Dropped tags are traced via `traceDecision` for debugging.
 *
 * @see TAG_CATEGORY_MAX_COUNTS for max count configuration
 * @see GENRE_TAG_WEIGHTS in `./weights.ts` for genre-specific weight adjustments
 *
 * @module prompt/deterministic/styles
 */

import { GENRE_REGISTRY } from '@bun/instruments';
import { selectCompoundMood } from '@bun/mood';
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
} from '@bun/prompt/tags';
import { traceDecision } from '@bun/trace';

import { getTagWeightsForGenre } from './weights';

import type { StyleTagsResult, TagCategoryWeights } from './types';
import type { GenreType } from '@bun/instruments/genres';
import type { TraceCollector } from '@bun/trace';

/**
 * Maximum tag counts per category for deterministic selection.
 *
 * These counts define the maximum number of tags to select from each category
 * when that category passes its probability threshold. Probabilities are now
 * genre-specific and defined in `./weights.ts`.
 *
 * @since v2.0.0
 * @see getTagWeightsForGenre for genre-specific probabilities
 */
const TAG_CATEGORY_MAX_COUNTS = {
  vocal: 2,
  spatial: 1,
  harmonic: 1,
  dynamic: 1,
  temporal: 1,
} as const;

/**
 * Collect weighted category tags based on genre-specific probabilities.
 * Applies probability-based selection for vocal, spatial, harmonic, dynamic, and temporal tags.
 */
function collectWeightedTags(
  weights: TagCategoryWeights,
  primaryGenre: GenreType,
  addUnique: (tag: string) => void,
  rng: () => number
): void {
  // Vocal: genre-aware weights (e.g., jazz ~80%, electronic ~40%, ambient ~15%)
  applyWeightedSelection(
    weights.vocal,
    () => selectVocalTags(primaryGenre, TAG_CATEGORY_MAX_COUNTS.vocal, rng),
    addUnique,
    rng
  );

  // Spatial: stereo imaging and reverb (e.g., ambient ~85%, electronic ~70%, folk ~35%)
  applyWeightedSelection(
    weights.spatial,
    () => selectSpatialTags(TAG_CATEGORY_MAX_COUNTS.spatial, rng),
    addUnique,
    rng
  );

  // Harmonic: tonal character (e.g., classical ~70%, jazz ~50%, electronic ~30%)
  applyWeightedSelection(
    weights.harmonic,
    () => selectHarmonicTags(TAG_CATEGORY_MAX_COUNTS.harmonic, rng),
    addUnique,
    rng
  );

  // Dynamic: compression and loudness (e.g., metal ~70%, hardstyle ~70%, ambient ~25%)
  applyWeightedSelection(
    weights.dynamic,
    () => selectDynamicTags(TAG_CATEGORY_MAX_COUNTS.dynamic, rng),
    addUnique,
    rng
  );

  // Temporal: timing and groove (e.g., afrobeat ~55%, drumandbass ~55%, ambient ~20%)
  applyWeightedSelection(
    weights.temporal,
    () => selectTemporalTags(TAG_CATEGORY_MAX_COUNTS.temporal, rng),
    addUnique,
    rng
  );
}

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
 * Select moods based on creativity level.
 *
 * At creativity levels > 60 (adventurous/high creativity), uses compound moods
 * for richer emotional expression (e.g., "dark euphoria", "bittersweet nostalgia").
 *
 * At creativity levels ≤ 60 (standard/low creativity), uses simple moods
 * from the genre's mood pool for more conventional results.
 *
 * @param genre - Target genre for mood selection
 * @param creativityLevel - Creativity level (0-100). Above 60 triggers compound moods.
 * @param count - Number of moods to select
 * @param rng - Random number generator
 * @param trace - Optional trace collector for debugging
 * @returns Array of selected mood strings
 *
 * @example
 * // High creativity (61+) - uses compound moods
 * selectMoodsForCreativity('jazz', 75, 3, Math.random)
 * // ['bittersweet nostalgia', 'smooth', 'warm']
 *
 * @example
 * // Low creativity (≤60) - uses simple moods
 * selectMoodsForCreativity('jazz', 50, 3, Math.random)
 * // ['smooth', 'warm', 'sophisticated']
 */
export function selectMoodsForCreativity(
  genre: GenreType,
  creativityLevel: number,
  count: number,
  rng: () => number,
  trace?: TraceCollector
): string[] {
  // Adventurous/High creativity (61+): Use compound moods
  if (creativityLevel > 60) {
    const compoundMood = selectCompoundMood(genre, rng);

    traceDecision(trace, {
      domain: 'mood',
      key: 'deterministic.moods.compound',
      branchTaken: 'compound-mood',
      why: `creativityLevel=${creativityLevel} > 60, using compound mood`,
      selection: { method: 'shuffleSlice', candidates: [compoundMood] },
    });

    // Return compound mood + simple moods to fill count
    if (count <= 1) {
      return [compoundMood];
    }

    const simpleMoods = selectMoodsForGenre(genre, count - 1, rng);
    return [compoundMood, ...simpleMoods];
  }

  // Lower creativity (≤60): Use simple moods only
  traceDecision(trace, {
    domain: 'mood',
    key: 'deterministic.moods.simple',
    branchTaken: 'simple-mood',
    why: `creativityLevel=${creativityLevel} <= 60, using simple moods`,
  });

  return selectMoodsForGenre(genre, count, rng);
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
  rng: () => number = Math.random,
  trace?: TraceCollector
): StyleTagsResult {
  const primaryGenre = components[0] ?? 'pop';
  const allTags: string[] = [];
  const seenTags = new Set<string>();

  // Get genre-specific weights for tag category selection
  const weights = getTagWeightsForGenre(primaryGenre);

  const addUnique = (tag: string): void => {
    const lower = tag.toLowerCase();
    if (!seenTags.has(lower)) {
      seenTags.add(lower);
      allTags.push(lower);
    }
  };

  // ==========================================================================
  // PRIORITY 1: Production descriptor elements (ALWAYS INCLUDED - never dropped)
  // Multi-dimensional for maximum variety (30,600 combinations for single-genre)
  // ==========================================================================
  if (components.length > 1) {
    // For multi-genre, use blended production descriptor
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

  // ==========================================================================
  // PRIORITY 2: Recording context (ALWAYS INCLUDED - never dropped)
  // Genre-specific context selection (141 contexts across 18 genres)
  // Note: We add a mixing call to break LCG patterns from production selection
  // ==========================================================================
  rng(); // Mixing call to improve variety distribution
  const recordingContext = selectRecordingContext(primaryGenre, rng);
  addUnique(recordingContext);

  // ==========================================================================
  // PRIORITY 3: Mood tags from genre mood pools (2 per genre component)
  // Track mood tags separately for header/display use
  // ==========================================================================
  const collectedMoodTags: string[] = [];
  for (const genre of components) {
    const moods = selectMoodsForGenre(genre, 2, rng);
    for (const mood of moods) {
      addUnique(mood);
      collectedMoodTags.push(mood.toLowerCase());
    }
  }

  // ==========================================================================
  // PRIORITY 4: Texture tags (2 tags)
  // ==========================================================================
  const textureTags = selectTextureTags(2, rng);
  for (const tag of textureTags) {
    addUnique(tag);
  }

  // ==========================================================================
  // PRIORITY 5-9: Weighted category tags (probability-based, may be dropped)
  // ==========================================================================
  collectWeightedTags(weights, primaryGenre, addUnique, rng);

  // ==========================================================================
  // TAG LIMIT: Cap at 10 total tags
  // Production (4) + Recording (1) are always included (5 tags)
  // Remaining 5 slots filled by: moods (2-4) + texture (2) + weighted categories
  // ==========================================================================
  const TAG_LIMIT = 10;
  const droppedTags = allTags.length > TAG_LIMIT ? allTags.slice(TAG_LIMIT) : [];
  const finalTags = allTags.slice(0, TAG_LIMIT);

  // Trace dropped tags if any
  if (droppedTags.length > 0) {
    traceDecision(trace, {
      domain: 'styleTags',
      key: 'deterministic.styleTags.truncation',
      branchTaken: 'tags-truncated',
      why: `Tag limit (${TAG_LIMIT}) exceeded. ${droppedTags.length} tags dropped: ${droppedTags.join(', ')}`,
    });
  }

  traceDecision(trace, {
    domain: 'styleTags',
    key: 'deterministic.styleTags.assemble',
    branchTaken: components.length > 1 ? 'multi-genre' : 'single-genre',
    why: `primary=${primaryGenre} components=${components.join(' ')} tags=${finalTags.length} weights=vocal:${weights.vocal}/spatial:${weights.spatial}`,
    selection: {
      method: 'shuffleSlice',
      candidates: finalTags,
    },
  });

  return {
    tags: finalTags,
    formatted: finalTags.join(', '),
    moodTags: collectedMoodTags,
  };
}
