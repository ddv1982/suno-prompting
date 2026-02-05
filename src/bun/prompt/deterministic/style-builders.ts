/**
 * Tag assembly helpers for deterministic style tag generation.
 *
 * Contains weighted tag collection, mood selection, production tag assembly,
 * and utility functions for building style tags.
 *
 * @module prompt/deterministic/style-builders
 */

import { GENRE_REGISTRY } from '@bun/instruments';
import { extractHarmonicComplexity, extractPriorityMoods } from '@bun/keywords';
import { selectCompoundMood } from '@bun/mood';
import { buildBlendedProductionDescriptor } from '@bun/prompt/genre-parser';
import {
  buildProductionDescriptorMulti,
  buildProductionDescriptorWithEra,
  buildProductionDescriptorWithSpatialHint,
} from '@bun/prompt/production-elements';
import {
  selectVocalTags,
  selectVocalTagsWithCharacter,
  selectSpatialTags,
  selectHarmonicTags,
  selectDynamicTags,
  selectTemporalTags,
} from '@bun/prompt/tags';
import { traceDecision } from '@bun/trace';
import { selectRandomN } from '@shared/utils/random';

import { TAG_CATEGORY_MAX_COUNTS, ARC_WEIGHT_MULTIPLIERS } from './style-constants';
import { adjustWeightsForEnergyLevel } from './weights';

import type { AssembleStyleTagsOptions } from './styles';
import type { TagCategoryWeights } from './types';
import type { GenreType } from '@bun/instruments/genres';
import type { TraceCollector } from '@bun/trace';
import type {
  Era,
  EnergyLevel,
  SpatialHint,
  ThematicContext,
  VocalCharacter,
} from '@shared/schemas/thematic-context';

/**
 * Calculate dynamic tag weight multiplier based on narrativeArc length.
 * Longer arcs indicate more dramatic/epic songs that benefit from higher dynamic tag probability.
 *
 * @param narrativeArc - Array of narrative arc elements from thematic context
 * @returns Weight multiplier from ARC_WEIGHT_MULTIPLIERS
 *
 * @example
 * getDynamicWeightFromArc(undefined)     // 1.0 (default)
 * getDynamicWeightFromArc(['act1'])      // 1.0 (≤2 elements)
 * getDynamicWeightFromArc(['a', 'b'])    // 1.0 (≤2 elements)
 * getDynamicWeightFromArc(['a', 'b', 'c', 'd']) // 1.3 (3-4 elements)
 * getDynamicWeightFromArc(['a', 'b', 'c', 'd', 'e']) // 1.6 (≥5 elements)
 */
export function getDynamicWeightFromArc(narrativeArc?: string[]): number {
  if (!narrativeArc || narrativeArc.length <= 2) return ARC_WEIGHT_MULTIPLIERS.DEFAULT;
  if (narrativeArc.length <= 4) return ARC_WEIGHT_MULTIPLIERS.MEDIUM;
  return ARC_WEIGHT_MULTIPLIERS.EPIC;
}

/**
 * Options for collectWeightedTags function.
 */
interface CollectWeightedTagsOptions {
  readonly weights: TagCategoryWeights;
  readonly primaryGenre: GenreType;
  readonly addUnique: (tag: string) => void;
  readonly rng: () => number;
  readonly thematicContext?: ThematicContext;
  readonly vocalCharacter?: VocalCharacter;
  readonly energyLevel?: EnergyLevel;
  readonly description?: string;
  readonly trace?: TraceCollector;
}

/**
 * Collect weighted category tags based on genre-specific probabilities.
 * Applies probability-based selection for vocal, spatial, harmonic, dynamic, and temporal tags.
 *
 * Enhancements:
 * - Uses vocalCharacter for priority vocal tag selection
 * - Uses energyLevel to adjust category weights
 *
 * @param options - Options for tag collection
 */
export function collectWeightedTags(options: CollectWeightedTagsOptions): void {
  const {
    weights,
    primaryGenre,
    addUnique,
    rng,
    thematicContext,
    vocalCharacter,
    energyLevel,
    description,
    trace,
  } = options;

  // Apply energy level adjustment to weights
  const adjustedWeights = adjustWeightsForEnergyLevel(weights, energyLevel);

  // Trace energy level adjustment if applied
  if (energyLevel && energyLevel !== 'moderate') {
    traceDecision(trace, {
      domain: 'styleTags',
      key: 'deterministic.styleTags.energyLevel',
      branchTaken: 'energy-adjusted',
      why: `Applied energy level adjustment for ${energyLevel}: dynamic ${weights.dynamic.toFixed(2)} → ${adjustedWeights.dynamic.toFixed(2)}, temporal ${weights.temporal.toFixed(2)} → ${adjustedWeights.temporal.toFixed(2)}`,
    });
  }

  // Calculate arc multiplier for dynamic tags (longer arcs = more dramatic = higher dynamic probability)
  const arcMultiplier = getDynamicWeightFromArc(thematicContext?.narrativeArc);
  const adjustedDynamicWeight = adjustedWeights.dynamic * arcMultiplier;

  // Trace the arc multiplier if applied
  if (arcMultiplier !== 1.0) {
    traceDecision(trace, {
      domain: 'styleTags',
      key: 'deterministic.styleTags.arcMultiplier',
      branchTaken: 'arc-dynamic-boost',
      why: `Applied arc multiplier ${arcMultiplier} (arc length: ${thematicContext?.narrativeArc?.length ?? 0}), dynamic weight: ${adjustedWeights.dynamic.toFixed(2)} → ${adjustedDynamicWeight.toFixed(2)}`,
    });
  }

  // Calculate harmonic complexity multiplier
  const harmonicMultiplier = description ? extractHarmonicComplexity(description) : 1.0;
  const adjustedHarmonicWeight = adjustedWeights.harmonic * harmonicMultiplier;

  // Trace the harmonic complexity multiplier if applied
  if (harmonicMultiplier !== 1.0) {
    traceDecision(trace, {
      domain: 'styleTags',
      key: 'deterministic.styleTags.harmonicComplexity',
      branchTaken: 'harmonic-complexity-boost',
      why: `Applied harmonic complexity multiplier ${harmonicMultiplier} from description, harmonic weight: ${adjustedWeights.harmonic.toFixed(2)} → ${adjustedHarmonicWeight.toFixed(2)}`,
    });
  }

  // Use vocalCharacter-aware selection if provided
  if (vocalCharacter) {
    applyWeightedSelection(
      adjustedWeights.vocal,
      () =>
        selectVocalTagsWithCharacter(
          primaryGenre,
          TAG_CATEGORY_MAX_COUNTS.vocal,
          rng,
          vocalCharacter
        ),
      addUnique,
      rng
    );
    traceDecision(trace, {
      domain: 'styleTags',
      key: 'deterministic.styleTags.vocalCharacter',
      branchTaken: 'character-influenced',
      why: `Using vocalCharacter for vocal tag selection: style=${vocalCharacter.style ?? 'none'}, layering=${vocalCharacter.layering ?? 'none'}, technique=${vocalCharacter.technique ?? 'none'}`,
    });
  } else {
    applyWeightedSelection(
      adjustedWeights.vocal,
      () => selectVocalTags(primaryGenre, TAG_CATEGORY_MAX_COUNTS.vocal, rng),
      addUnique,
      rng
    );
  }

  applyWeightedSelection(
    adjustedWeights.spatial,
    () => selectSpatialTags(TAG_CATEGORY_MAX_COUNTS.spatial, rng),
    addUnique,
    rng
  );
  applyWeightedSelection(
    adjustedHarmonicWeight,
    () => selectHarmonicTags(TAG_CATEGORY_MAX_COUNTS.harmonic, rng),
    addUnique,
    rng
  );
  applyWeightedSelection(
    adjustedDynamicWeight,
    () => selectDynamicTags(TAG_CATEGORY_MAX_COUNTS.dynamic, rng),
    addUnique,
    rng
  );
  applyWeightedSelection(
    adjustedWeights.temporal,
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
export function applyWeightedSelection(
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
  return selectRandomN(moods, Math.min(count, moods.length), rng).map((m) => m.toLowerCase());
}

/**
 * Add production descriptor tags based on genre count.
 * Uses era-biased texture selection when era is provided for single-genre prompts.
 * Uses spatial hint for reverb selection when provided.
 *
 * @param components - Array of genre components
 * @param addUnique - Function to add unique tags
 * @param rng - Random number generator
 * @param era - Optional era for texture bias (single-genre only)
 * @param spatialHint - Optional spatial hint for reverb selection
 */
export function addProductionTags(
  components: GenreType[],
  addUnique: (tag: string) => void,
  rng: () => number,
  era?: Era,
  spatialHint?: SpatialHint
): void {
  if (components.length > 1) {
    const blended = buildBlendedProductionDescriptor(components, rng);
    for (const part of blended.split(',').map((p) => p.trim().toLowerCase())) {
      if (part) addUnique(part);
    }
  } else {
    // Use spatial hint for reverb selection if provided
    // Otherwise fall back to era-biased or standard production
    let production;
    if (spatialHint?.space) {
      production = buildProductionDescriptorWithSpatialHint(rng, spatialHint);
    } else if (era) {
      production = buildProductionDescriptorWithEra(rng, era);
    } else {
      production = buildProductionDescriptorMulti(rng);
    }
    addUnique(production.reverb);
    addUnique(production.texture);
    addUnique(production.stereo);
    addUnique(production.dynamic);
  }
}

/**
 * Collect mood tags from description and genre components.
 *
 * Priority order:
 * 1. Description-matched moods (user's explicit intent)
 * 2. Genre-based moods (to fill remaining slots)
 *
 * @param components - Genre components for fallback mood selection
 * @param addUnique - Function to add unique tags
 * @param rng - Random number generator
 * @param description - Optional user description for priority mood extraction
 * @param trace - Optional trace collector
 * @returns Array of collected mood tags (lowercase)
 */
export function collectMoodTags(
  components: GenreType[],
  addUnique: (tag: string) => void,
  rng: () => number,
  description?: string,
  trace?: TraceCollector
): string[] {
  const collectedMoodTags: string[] = [];
  const moodsPerGenre = 2;
  const totalMoodSlots = components.length * moodsPerGenre;

  // Step 1: Extract priority moods from description (user's explicit intent)
  const priorityMoods = description ? extractPriorityMoods(description, totalMoodSlots) : [];

  if (priorityMoods.length > 0) {
    for (const mood of priorityMoods) {
      addUnique(mood.toLowerCase());
      collectedMoodTags.push(mood.toLowerCase());
    }

    traceDecision(trace, {
      domain: 'mood',
      key: 'deterministic.moods.priority',
      branchTaken: 'description-moods',
      why: `Extracted ${priorityMoods.length} priority moods from description: ${priorityMoods.join(', ')}`,
      selection: { method: 'shuffleSlice', candidates: priorityMoods },
    });
  }

  // Step 2: Fill remaining slots with genre-based moods
  const remainingSlots = totalMoodSlots - collectedMoodTags.length;
  if (remainingSlots > 0) {
    for (const genre of components) {
      const slotsForGenre = Math.ceil(remainingSlots / components.length);
      for (const mood of selectMoodsForGenre(genre, slotsForGenre, rng)) {
        if (collectedMoodTags.length >= totalMoodSlots) break;
        addUnique(mood);
        collectedMoodTags.push(mood.toLowerCase());
      }
    }
  }

  return collectedMoodTags;
}

/**
 * Apply tag limit and trace dropped tags.
 */
export function applyTagLimit(allTags: string[], limit: number, trace?: TraceCollector): string[] {
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
 * Resolved options for internal use.
 */
export interface ResolvedStyleTagOptions {
  readonly components: GenreType[];
  readonly rng: () => number;
  readonly trace?: TraceCollector;
  readonly thematicContext?: ThematicContext;
  readonly description?: string;
  readonly primaryGenre: GenreType;
}

/**
 * Parse assembleStyleTags arguments into resolved options.
 * Supports both legacy array signature and new options object.
 */
export function resolveStyleTagOptions(
  componentsOrOptions: GenreType[] | AssembleStyleTagsOptions,
  rng: () => number,
  trace?: TraceCollector
): ResolvedStyleTagOptions {
  if (Array.isArray(componentsOrOptions)) {
    return {
      components: componentsOrOptions,
      rng,
      trace,
      thematicContext: undefined,
      description: undefined,
      primaryGenre: componentsOrOptions[0] ?? 'pop',
    };
  }
  return {
    components: componentsOrOptions.components,
    rng: componentsOrOptions.rng ?? Math.random,
    trace: componentsOrOptions.trace,
    thematicContext: componentsOrOptions.thematicContext,
    description: componentsOrOptions.description,
    primaryGenre: componentsOrOptions.components[0] ?? 'pop',
  };
}

/**
 * Build trace message parts from thematic context.
 */
export function buildThematicTraceParts(thematicContext: ThematicContext): string[] {
  const parts: string[] = [];
  parts.push('+thematic');
  if (thematicContext.era) parts.push(`+era=${thematicContext.era}`);
  if (thematicContext.intent) parts.push(`+intent=${thematicContext.intent}`);
  if (thematicContext.musicalReference?.signature?.length) {
    parts.push(`+musicalRef=${thematicContext.musicalReference.signature.length}sigs`);
  }
  if (thematicContext.culturalContext?.region) {
    parts.push(`+cultural=${thematicContext.culturalContext.region}`);
  }
  // Vocal and spatial fields
  if (thematicContext.vocalCharacter) parts.push('+vocalCharacter');
  if (thematicContext.energyLevel) parts.push(`+energy=${thematicContext.energyLevel}`);
  if (thematicContext.spatialHint?.space)
    parts.push(`+spatial=${thematicContext.spatialHint.space}`);
  return parts;
}

/**
 * Build trace message for style tag assembly.
 */
export function buildStyleTagTraceMessage(
  options: ResolvedStyleTagOptions,
  finalTags: string[]
): string {
  const { components, thematicContext, primaryGenre } = options;
  const baseParts = [
    `primary=${primaryGenre}`,
    `components=${components.join(' ')}`,
    `tags=${finalTags.length}`,
  ];
  const thematicParts = thematicContext ? buildThematicTraceParts(thematicContext) : [];
  return [...baseParts, ...thematicParts].join(' ');
}
