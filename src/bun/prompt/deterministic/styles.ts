/**
 * Style tag assembly for deterministic prompt generation.
 *
 * Tag Assembly Priority Order
 *
 * Tags are assembled in the following priority order. Production and recording
 * context tags are added first to ensure they are never dropped due to the
 * tag limit (configured via APP_CONSTANTS.STYLE_TAG_LIMIT, default 15).
 * This prioritizes the most important tags for Suno.
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
 * included in every prompt. The tag limit (APP_CONSTANTS.STYLE_TAG_LIMIT)
 * enforces conciseness. When exceeded, tags are dropped from the end
 * (lower priority categories). Dropped tags are traced via `traceDecision`.
 *
 * @see TAG_CATEGORY_MAX_COUNTS for max count configuration
 * @see GENRE_TAG_WEIGHTS in `./weights.ts` for genre-specific weight adjustments
 *
 * @module prompt/deterministic/styles
 */

import { GENRE_REGISTRY } from '@bun/instruments';
import { getCulturalScale, selectCulturalInstruments } from '@bun/instruments/cultural-instruments';
import { extractHarmonicComplexity, extractPriorityMoods, extractThemes } from '@bun/keywords';
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
  selectTextureTags,
  selectRecordingContext,
} from '@bun/prompt/tags';
import { traceDecision } from '@bun/trace';
import { APP_CONSTANTS } from '@shared/constants';
import { EraSchema } from '@shared/schemas/thematic-context';
import { selectRandomN } from '@shared/utils/random';

import { getEraProductionTagsLimited } from './era-tags';
import { getIntentTagsLimited } from './intent-tags';
import { adjustWeightsForEnergyLevel, getTagWeightsForGenre } from './weights';

import type { StyleTagsResult, TagCategoryWeights } from './types';
import type { GenreType } from '@bun/instruments/genres';
import type { TraceCollector } from '@bun/trace';
import type { Era, EnergyLevel, SpatialHint, ThematicContext, VocalCharacter } from '@shared/schemas/thematic-context';

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
 * Weight multipliers for narrativeArc-based dynamic tag boosting.
 * Longer arcs indicate more dramatic/epic songs that benefit from higher dynamic tag probability.
 */
const ARC_WEIGHT_MULTIPLIERS = {
  /** Default multiplier for short or no arc (≤2 elements) */
  DEFAULT: 1.0,
  /** Moderate boost for medium arcs (3-4 elements) */
  MEDIUM: 1.3,
  /** Significant boost for epic arcs (≥5 elements) */
  EPIC: 1.6,
} as const;

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
function collectWeightedTags(options: CollectWeightedTagsOptions): void {
  const { weights, primaryGenre, addUnique, rng, thematicContext, vocalCharacter, energyLevel, description, trace } = options;

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
      () => selectVocalTagsWithCharacter(primaryGenre, TAG_CATEGORY_MAX_COUNTS.vocal, rng, vocalCharacter),
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
    applyWeightedSelection(adjustedWeights.vocal, () => selectVocalTags(primaryGenre, TAG_CATEGORY_MAX_COUNTS.vocal, rng), addUnique, rng);
  }

  applyWeightedSelection(adjustedWeights.spatial, () => selectSpatialTags(TAG_CATEGORY_MAX_COUNTS.spatial, rng), addUnique, rng);
  applyWeightedSelection(adjustedHarmonicWeight, () => selectHarmonicTags(TAG_CATEGORY_MAX_COUNTS.harmonic, rng), addUnique, rng);
  applyWeightedSelection(adjustedDynamicWeight, () => selectDynamicTags(TAG_CATEGORY_MAX_COUNTS.dynamic, rng), addUnique, rng);
  applyWeightedSelection(adjustedWeights.temporal, () => selectTemporalTags(TAG_CATEGORY_MAX_COUNTS.temporal, rng), addUnique, rng);
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
function addProductionTags(
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
function collectMoodTags(
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
 * Append thematic content from LLM context to style tags.
 * Adds first 2 themes + scene phrase (if available).
 *
 * If no thematic context but description is provided, falls back to
 * direct keyword extraction to preserve user's thematic intent.
 *
 * @param thematicContext - Optional LLM-extracted thematic context
 * @param addUnique - Function to add unique tags
 * @param trace - Optional trace collector
 * @param description - Optional user description for fallback extraction
 */
function appendThematicThemes(
  thematicContext: ThematicContext | undefined,
  addUnique: (tag: string) => void,
  trace?: TraceCollector,
  description?: string
): void {
  // If thematic context available, use it (LLM path)
  if (thematicContext) {
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
    return;
  }

  // Fallback: Extract themes directly from description (deterministic path)
  if (description) {
    const extractedThemes = extractThemes(description, 2);
    if (extractedThemes.length > 0) {
      for (const theme of extractedThemes) {
        addUnique(theme);
      }

      traceDecision(trace, {
        domain: 'styleTags',
        key: 'deterministic.styleTags.thematicContext',
        branchTaken: 'keyword-themes-fallback',
        why: `No LLM context; extracted ${extractedThemes.length} themes from description via keywords: ${extractedThemes.join(', ')}`,
        selection: { method: 'shuffleSlice', candidates: extractedThemes },
      });
    }
  }
}

/**
 * Resolve era from thematicContext with musicalReference fallback.
 *
 * Returns the top-level era if set, otherwise attempts to use
 * musicalReference.era as a fallback (if it's a valid Era enum value).
 *
 * @param thematicContext - Optional thematic context
 * @returns Resolved Era or undefined
 *
 * @example
 * resolveEra({ era: '80s', ... }) // Returns '80s'
 * resolveEra({ musicalReference: { era: '70s', ... }, ... }) // Returns '70s'
 * resolveEra({ musicalReference: { era: 'invalid', ... }, ... }) // Returns undefined
 */
export function resolveEra(thematicContext: ThematicContext | undefined): Era | undefined {
  // Return top-level era if set
  if (thematicContext?.era) return thematicContext.era;

  // Fallback to musicalReference.era if it's a valid Era enum value
  const refEra = thematicContext?.musicalReference?.era;
  if (refEra && EraSchema.safeParse(refEra).success) {
    return refEra as Era;
  }

  return undefined;
}

/**
 * Append era-based production tags to style output.
 *
 * Adds production tags that characterize the sonic qualities of recordings
 * from the specified era. Limited to 2 tags to preserve tag budget.
 * Uses resolveEra() to support musicalReference.era fallback.
 *
 * @param thematicContext - Optional thematic context with era field
 * @param addUnique - Function to add unique tags to collection
 * @param trace - Optional trace collector for debugging
 */
function appendEraTags(
  thematicContext: ThematicContext | undefined,
  addUnique: (tag: string) => void,
  trace?: TraceCollector
): void {
  const era = resolveEra(thematicContext);
  if (!era) return;

  const eraTags = getEraProductionTagsLimited(era, 2);
  for (const tag of eraTags) {
    addUnique(tag);
  }

  // Determine if era came from top-level or musicalReference
  const eraSource = thematicContext?.era ? 'top-level' : 'musicalReference';

  traceDecision(trace, {
    domain: 'styleTags',
    key: 'deterministic.styleTags.enrichedContext',
    branchTaken: 'era-tags-appended',
    why: `Appended ${eraTags.length} era tags for era=${era} (source: ${eraSource})`,
    selection: { method: 'index', candidates: [...eraTags] },
  });
}

/**
 * Append intent-based production tags to style output.
 *
 * Adds production tags that optimize the generated music for specific
 * listening purposes (background, focal, cinematic, dancefloor, emotional).
 * Limited to 1 tag to preserve tag budget.
 *
 * @param thematicContext - Optional thematic context with intent field
 * @param addUnique - Function to add unique tags to collection
 * @param trace - Optional trace collector for debugging
 */
function appendIntentTags(
  thematicContext: ThematicContext | undefined,
  addUnique: (tag: string) => void,
  trace?: TraceCollector
): void {
  if (!thematicContext?.intent) return;

  const intentTags = getIntentTagsLimited(thematicContext.intent, 1);
  for (const tag of intentTags) {
    addUnique(tag);
  }

  traceDecision(trace, {
    domain: 'styleTags',
    key: 'deterministic.styleTags.enrichedContext',
    branchTaken: 'intent-tags-appended',
    why: `Appended ${intentTags.length} intent tag for intent=${thematicContext.intent}`,
    selection: { method: 'index', candidates: [...intentTags] },
  });
}

/**
 * Validate that a signature element is a production descriptor, not an artist name.
 *
 * This is a CRITICAL security validation to ensure no artist names slip through
 * to the Suno output. The musicalReference.signature array should only contain
 * production style descriptors like "spacey guitar delay", "slow build", "analog synth".
 *
 * Validation criteria:
 * - Must be at least 3 characters (filters out initials)
 * - Should contain spaces or hyphens (compound descriptors are safer)
 * - Should not be a capitalized single word (likely a name)
 * - Should not match common name patterns
 *
 * @param signature - The signature element to validate
 * @returns True if the signature appears to be a valid production descriptor
 */
function isValidProductionSignature(signature: string): boolean {
  const trimmed = signature.trim();

  // Filter out very short strings (could be abbreviations or initials)
  if (trimmed.length < 3) {
    return false;
  }

  // Filter out empty or whitespace-only strings
  if (trimmed.length === 0) {
    return false;
  }

  // Check if it's a single capitalized word (likely a name)
  // Valid signatures are typically multi-word or lowercase descriptors
  const words = trimmed.split(/\s+/);
  if (words.length === 1) {
    // Single word: reject if it starts with uppercase (likely a proper noun/name)
    // Allow single words that are all lowercase (e.g., "vocoder", "reverb")
    if (/^[A-Z]/.test(trimmed)) {
      return false;
    }
  }

  // Additional pattern-based filtering for common name formats
  // Reject strings that look like "First Last" or "First Middle Last"
  const namePattern = /^[A-Z][a-z]+(\s+[A-Z][a-z]+)+$/;
  if (namePattern.test(trimmed)) {
    return false;
  }

  // Reject strings that end with common name suffixes
  const nameSuffixPattern = /\b(Jr\.?|Sr\.?|III?|IV)\s*$/i;
  if (nameSuffixPattern.test(trimmed)) {
    return false;
  }

  return true;
}

/**
 * Append musical reference signature tags to style output.
 *
 * Extracts signature production elements from the musicalReference context
 * (e.g., "spacey guitar delay", "slow build", "analog synth"). These are
 * production style characteristics extracted from artist references, but
 * NEVER include artist names themselves.
 *
 * CRITICAL: This function includes validation to ensure no artist names
 * slip through to the output. Only production descriptors are allowed.
 *
 * Limited to 2 signature tags to preserve tag budget.
 *
 * @param thematicContext - Optional thematic context with musicalReference field
 * @param addUnique - Function to add unique tags to collection
 * @param trace - Optional trace collector for debugging
 */
function appendMusicalReferenceTags(
  thematicContext: ThematicContext | undefined,
  addUnique: (tag: string) => void,
  trace?: TraceCollector
): void {
  if (!thematicContext?.musicalReference?.signature) return;

  const signatures = thematicContext.musicalReference.signature;
  if (signatures.length === 0) return;

  // Filter signatures to ensure no artist names slip through
  const validatedSignatures = signatures
    .filter(isValidProductionSignature)
    .slice(0, 2); // Limit to 2 signatures

  // Track any filtered signatures for debugging
  const filteredCount = Math.min(signatures.length, 2) - validatedSignatures.length;

  for (const sig of validatedSignatures) {
    addUnique(sig);
  }

  if (validatedSignatures.length > 0 || filteredCount > 0) {
    traceDecision(trace, {
      domain: 'styleTags',
      key: 'deterministic.styleTags.enrichedContext',
      branchTaken: validatedSignatures.length > 0 ? 'musical-reference-appended' : 'musical-reference-filtered',
      why: `Appended ${validatedSignatures.length} musical reference signature tags${filteredCount > 0 ? ` (filtered ${filteredCount} potential artist names)` : ''}`,
      selection: { method: 'index', candidates: [...validatedSignatures] },
    });
  }
}

/**
 * Append style tags from musicalReference.style array.
 *
 * Extracts up to 2 style descriptors from the musicalReference context.
 * Uses the same validation as signature tags to ensure no artist names
 * slip through to the output.
 *
 * @param thematicContext - Optional thematic context with musicalReference field
 * @param addUnique - Function to add unique tags to collection
 * @param trace - Optional trace collector for debugging
 *
 * @example
 * // With musicalReference.style = ['ethereal', 'shoegaze', 'dreamy']
 * // Adds: 'ethereal', 'shoegaze' (max 2)
 */
export function appendMusicalReferenceStyleTags(
  thematicContext: ThematicContext | undefined,
  addUnique: (tag: string) => void,
  trace?: TraceCollector
): void {
  if (!thematicContext?.musicalReference?.style) return;

  const styles = thematicContext.musicalReference.style;
  if (styles.length === 0) return;

  // Filter and limit to 2 style tags
  const validatedStyles = styles
    .filter(isValidProductionSignature) // Reuse signature validation
    .slice(0, 2);

  // Track any filtered styles for debugging
  const filteredCount = Math.min(styles.length, 2) - validatedStyles.length;

  for (const style of validatedStyles) {
    addUnique(style.toLowerCase());
  }

  if (validatedStyles.length > 0) {
    traceDecision(trace, {
      domain: 'styleTags',
      key: 'deterministic.styleTags.enrichedContext',
      branchTaken: 'musical-reference-style-appended',
      why: `Appended ${validatedStyles.length} style tags from musicalReference.style${filteredCount > 0 ? ` (filtered ${filteredCount} invalid entries)` : ''}`,
      selection: { method: 'index', candidates: [...validatedStyles] },
    });
  }
}

/**
 * Append cultural context tags to style output.
 *
 * Adds cultural/regional context elements when available:
 * 1. Regional instruments (up to 2) - merged with genre instrument pool
 * 2. Cultural scale/mode (1) - added to harmonic tag selection
 *
 * Cultural context enhances authenticity when generating music inspired by
 * specific regional traditions (Brazil, Japan, Celtic, India, Middle East, Africa).
 *
 * @param thematicContext - Optional thematic context with culturalContext field
 * @param addUnique - Function to add unique tags to collection
 * @param rng - Random number generator for instrument selection
 * @param trace - Optional trace collector for debugging
 *
 * @example
 * // With Brazilian cultural context:
 * // Adds: 'surdo', 'tamborim', 'mixolydian'
 */
function appendCulturalContextTags(
  thematicContext: ThematicContext | undefined,
  addUnique: (tag: string) => void,
  rng: () => number,
  trace?: TraceCollector
): void {
  if (!thematicContext?.culturalContext?.region) return;

  const region = thematicContext.culturalContext.region;
  const addedTags: string[] = [];

  // Add cultural instruments (up to 2)
  // First check if context provides instruments, otherwise lookup from database
  let instruments: string[] = [];
  if (thematicContext.culturalContext.instruments && thematicContext.culturalContext.instruments.length > 0) {
    // Use provided instruments (already extracted by LLM)
    instruments = thematicContext.culturalContext.instruments.slice(0, 2);
  } else {
    // Lookup from cultural instruments database
    instruments = selectCulturalInstruments(region, 2, rng);
  }

  for (const instrument of instruments) {
    addUnique(instrument);
    addedTags.push(instrument);
  }

  // Add cultural scale/mode (1 tag)
  // First check if context provides scale, otherwise lookup from database
  let scale: string | undefined;
  if (thematicContext.culturalContext.scale) {
    scale = thematicContext.culturalContext.scale;
  } else {
    scale = getCulturalScale(region);
  }

  if (scale) {
    addUnique(scale);
    addedTags.push(scale);
  }

  if (addedTags.length > 0) {
    traceDecision(trace, {
      domain: 'styleTags',
      key: 'deterministic.styleTags.enrichedContext',
      branchTaken: 'cultural-context-appended',
      why: `Appended ${addedTags.length} cultural context tags for region=${region}: ${addedTags.join(', ')}`,
      selection: { method: 'index', candidates: [...addedTags] },
    });
  }
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
  /** Optional user description for harmonic complexity inference */
  readonly description?: string;
}

/**
 * Resolved options for internal use.
 */
interface ResolvedStyleTagOptions {
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
function resolveStyleTagOptions(
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
function buildThematicTraceParts(thematicContext: ThematicContext): string[] {
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
  if (thematicContext.spatialHint?.space) parts.push(`+spatial=${thematicContext.spatialHint.space}`);
  return parts;
}

/**
 * Build trace message for style tag assembly.
 */
function buildStyleTagTraceMessage(
  options: ResolvedStyleTagOptions,
  finalTags: string[]
): string {
  const { components, thematicContext, primaryGenre } = options;
  const baseParts = [`primary=${primaryGenre}`, `components=${components.join(' ')}`, `tags=${finalTags.length}`];
  const thematicParts = thematicContext ? buildThematicTraceParts(thematicContext) : [];
  return [...baseParts, ...thematicParts].join(' ');
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
  const resolved = resolveStyleTagOptions(componentsOrOptions, rng, trace);
  const { components, rng: actualRng, trace: actualTrace, thematicContext, description, primaryGenre } = resolved;

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
  // Resolve era early for era-biased texture selection
  // Extract enrichment fields for later use
  const resolvedEra = resolveEra(thematicContext);
  const spatialHint = thematicContext?.spatialHint;
  const vocalCharacter = thematicContext?.vocalCharacter;
  const energyLevel = thematicContext?.energyLevel;

  // Trace spatial hint usage if provided
  if (spatialHint?.space) {
    traceDecision(actualTrace, {
      domain: 'styleTags',
      key: 'deterministic.styleTags.spatialHint',
      branchTaken: 'spatial-influenced',
      why: `Using spatialHint for reverb selection: space=${spatialHint.space}, reverb=${spatialHint.reverb ?? 'none'}`,
    });
  }

  addProductionTags(components, addUnique, actualRng, resolvedEra, spatialHint);

  // Priority 2: Recording context (1 tag)
  actualRng(); // Mixing call to break LCG patterns
  addUnique(selectRecordingContext(primaryGenre, actualRng));

  // Priority 3: Mood tags (description-aware + genre-based)
  const collectedMoodTags = collectMoodTags(components, addUnique, actualRng, description, actualTrace);

  // Priority 4: Thematic context (themes + scene) - user's unique intent
  // Falls back to keyword extraction if no LLM context but description provided
  appendThematicThemes(thematicContext, addUnique, actualTrace, description);

  // Priority 4.5: Era-based production tags (max 2) - enriched context
  appendEraTags(thematicContext, addUnique, actualTrace);

  // Priority 4.6: Intent-based production tags (max 1) - enriched context
  appendIntentTags(thematicContext, addUnique, actualTrace);

  // Priority 4.7: Musical reference signature tags (max 2) - enriched context
  appendMusicalReferenceTags(thematicContext, addUnique, actualTrace);

  // Priority 4.8: Cultural context tags (instruments + scale, max 3) - enriched context
  appendCulturalContextTags(thematicContext, addUnique, actualRng, actualTrace);

  // Priority 4.9: Musical reference style tags (max 2) - enriched context
  appendMusicalReferenceStyleTags(thematicContext, addUnique, actualTrace);

  // Priority 5: Texture tags (2 tags) - generic, can be cut
  for (const tag of selectTextureTags(2, actualRng)) {
    addUnique(tag);
  }

  // Priority 6-10: Weighted category tags (enhanced with vocalCharacter, energyLevel, description)
  collectWeightedTags({
    weights: getTagWeightsForGenre(primaryGenre),
    primaryGenre,
    addUnique,
    rng: actualRng,
    thematicContext,
    vocalCharacter,
    energyLevel,
    description,
    trace: actualTrace,
  });

  // Apply tag limit
  const finalTags = applyTagLimit(allTags, APP_CONSTANTS.STYLE_TAG_LIMIT, actualTrace);

  traceDecision(actualTrace, {
    domain: 'styleTags',
    key: 'deterministic.styleTags.assemble',
    branchTaken: components.length > 1 ? 'multi-genre' : 'single-genre',
    why: buildStyleTagTraceMessage(resolved, finalTags),
    selection: { method: 'shuffleSlice', candidates: finalTags },
  });

  return { tags: finalTags, formatted: finalTags.join(', '), moodTags: collectedMoodTags };
}
