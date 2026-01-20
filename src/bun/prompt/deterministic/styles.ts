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
import type { ThematicContext } from '@shared/schemas/thematic-context';

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
  applyWeightedSelection(weights.vocal, () => selectVocalTags(primaryGenre, TAG_CATEGORY_MAX_COUNTS.vocal, rng), addUnique, rng);
  applyWeightedSelection(weights.spatial, () => selectSpatialTags(TAG_CATEGORY_MAX_COUNTS.spatial, rng), addUnique, rng);
  applyWeightedSelection(weights.harmonic, () => selectHarmonicTags(TAG_CATEGORY_MAX_COUNTS.harmonic, rng), addUnique, rng);
  applyWeightedSelection(weights.dynamic, () => selectDynamicTags(TAG_CATEGORY_MAX_COUNTS.dynamic, rng), addUnique, rng);
  applyWeightedSelection(weights.temporal, () => selectTemporalTags(TAG_CATEGORY_MAX_COUNTS.temporal, rng), addUnique, rng);
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
 */
function selectMoodsForGenre(genre: GenreType, count: number, rng: () => number): string[] {
  const moods = GENRE_REGISTRY[genre]?.moods ?? [];
  if (moods.length === 0) return [];
  return [...moods].sort(() => rng() - 0.5).slice(0, count).map((m) => m.toLowerCase());
}

/**
 * Add production descriptor tags based on genre count.
 */
function addProductionTags(
  components: GenreType[],
  addUnique: (tag: string) => void,
  rng: () => number
): void {
  if (components.length > 1) {
    const blended = buildBlendedProductionDescriptor(components, rng);
    for (const part of blended.split(',').map((p) => p.trim().toLowerCase())) {
      if (part) addUnique(part);
    }
  } else {
    const production = buildProductionDescriptorMulti(rng);
    addUnique(production.reverb);
    addUnique(production.texture);
    addUnique(production.stereo);
    addUnique(production.dynamic);
  }
}

/**
 * Collect mood tags from all genre components.
 */
function collectMoodTags(
  components: GenreType[],
  addUnique: (tag: string) => void,
  rng: () => number
): string[] {
  const collectedMoodTags: string[] = [];
  for (const genre of components) {
    for (const mood of selectMoodsForGenre(genre, 2, rng)) {
      addUnique(mood);
      collectedMoodTags.push(mood.toLowerCase());
    }
  }
  return collectedMoodTags;
}

/**
 * Append thematic content from LLM context to style tags.
 * Adds first 2 themes + scene phrase (if available).
 */
function appendThematicThemes(
  thematicContext: ThematicContext | undefined,
  addUnique: (tag: string) => void,
  trace?: TraceCollector
): void {
  if (!thematicContext) return;

  // Add first 2 themes
  const themesToAppend = thematicContext.themes.slice(0, 2);
  for (const theme of themesToAppend) {
    addUnique(theme);
  }

  // Add scene phrase if available
  const scene = thematicContext.scene?.trim();
  if (scene) {
    addUnique(scene);
  }

  traceDecision(trace, {
    domain: 'styleTags',
    key: 'deterministic.styleTags.thematicContext',
    branchTaken: 'thematic-appended',
    why: `Appended ${themesToAppend.length} themes${scene ? ' + scene phrase' : ''} from LLM context`,
    selection: { method: 'shuffleSlice', candidates: scene ? [...themesToAppend, scene] : themesToAppend },
  });
}

/**
 * Apply tag limit and trace dropped tags.
 */
function applyTagLimit(
  allTags: string[],
  limit: number,
  trace?: TraceCollector
): string[] {
  if (allTags.length <= limit) return allTags;

  const droppedTags = allTags.slice(limit);
  traceDecision(trace, {
    domain: 'styleTags',
    key: 'deterministic.styleTags.truncation',
    branchTaken: 'tags-truncated',
    why: `Tag limit (${limit}) exceeded. ${droppedTags.length} tags dropped: ${droppedTags.join(', ')}`,
  });

  return allTags.slice(0, limit);
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

/**
 * Options for assembleStyleTags function.
 */
export interface AssembleStyleTagsOptions {
  /** Array of genre components (supports single or multi-genre) */
  readonly components: GenreType[];
  /** Random number generator for deterministic selection */
  readonly rng?: () => number;
  /** Optional trace collector for debugging */
  readonly trace?: TraceCollector;
  /** Optional thematic context from LLM extraction */
  readonly thematicContext?: ThematicContext;
}

/**
 * Assemble style tags for deterministic prompt generation.
 *
 * Supports two call signatures:
 * 1. Options object (preferred): `assembleStyleTags({ components, rng, trace, thematicContext })`
 * 2. Legacy array: `assembleStyleTags(components[], rng, trace)` - kept for backward compatibility
 *
 * @param componentsOrOptions - Either an options object (preferred) or array of genre components
 * @param rng - Random number generator (only used with array signature)
 * @param trace - Trace collector (only used with array signature)
 */
export function assembleStyleTags(
  componentsOrOptions: GenreType[] | AssembleStyleTagsOptions,
  rng: () => number = Math.random,
  trace?: TraceCollector
): StyleTagsResult {
  // Support both old signature (GenreType[], rng, trace) and new options object
  const options: AssembleStyleTagsOptions = Array.isArray(componentsOrOptions)
    ? { components: componentsOrOptions, rng, trace }
    : componentsOrOptions;

  const { components, rng: optionsRng = Math.random, trace: optionsTrace, thematicContext } = options;
  const actualRng = Array.isArray(componentsOrOptions) ? rng : optionsRng;
  const actualTrace = Array.isArray(componentsOrOptions) ? trace : optionsTrace;
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

  // Priority 1: Production descriptor elements (4 tags)
  addProductionTags(components, addUnique, actualRng);

  // Priority 2: Recording context (1 tag)
  actualRng(); // Mixing call to break LCG patterns
  addUnique(selectRecordingContext(primaryGenre, actualRng));

  // Priority 3: Mood tags (2 per genre component)
  const collectedMoodTags = collectMoodTags(components, addUnique, actualRng);

  // Priority 4: Thematic context (themes + scene) - user's unique intent
  appendThematicThemes(thematicContext, addUnique, actualTrace);

  // Priority 5: Texture tags (2 tags) - generic, can be cut
  for (const tag of selectTextureTags(2, actualRng)) {
    addUnique(tag);
  }

  // Priority 6-10: Weighted category tags
  collectWeightedTags(getTagWeightsForGenre(primaryGenre), primaryGenre, addUnique, actualRng);

  // Apply tag limit
  const TAG_LIMIT = 10;
  const finalTags = applyTagLimit(allTags, TAG_LIMIT, actualTrace);

  traceDecision(actualTrace, {
    domain: 'styleTags',
    key: 'deterministic.styleTags.assemble',
    branchTaken: components.length > 1 ? 'multi-genre' : 'single-genre',
    why: `primary=${primaryGenre} components=${components.join(' ')} tags=${finalTags.length}${thematicContext ? ' +thematic' : ''}`,
    selection: { method: 'shuffleSlice', candidates: finalTags },
  });

  return { tags: finalTags, formatted: finalTags.join(', '), moodTags: collectedMoodTags };
}
