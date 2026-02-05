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

import { selectTextureTags, selectRecordingContext } from '@bun/prompt/tags';
import { traceDecision } from '@bun/trace';
import { APP_CONSTANTS } from '@shared/constants';

import {
  collectWeightedTags,
  collectMoodTags,
  addProductionTags,
  applyTagLimit,
  resolveStyleTagOptions,
  buildStyleTagTraceMessage,
} from './style-builders';
import {
  appendThematicThemes,
  appendEraTags,
  appendIntentTags,
  appendMusicalReferenceTags,
  appendMusicalReferenceStyleTags,
  appendCulturalContextTags,
  resolveEra,
} from './style-enrichment';
import { getTagWeightsForGenre } from './weights';

import type { StyleTagsResult } from './types';
import type { GenreType } from '@bun/instruments/genres';
import type { TraceCollector } from '@bun/trace';
import type { ThematicContext } from '@shared/schemas/thematic-context';

// Re-export items that were previously exported directly from this module
export {
  getDynamicWeightFromArc,
  selectMoodsForCreativity,
  applyWeightedSelection,
} from './style-builders';
export { resolveEra, appendMusicalReferenceStyleTags } from './style-enrichment';

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
  const {
    components,
    rng: actualRng,
    trace: actualTrace,
    thematicContext,
    description,
    primaryGenre,
  } = resolved;

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
  const collectedMoodTags = collectMoodTags(
    components,
    addUnique,
    actualRng,
    description,
    actualTrace
  );

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
