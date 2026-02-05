/**
 * Prompt Refinement Module
 *
 * Handles refinement of existing prompts based on user feedback.
 *
 * Architecture (unified for all providers):
 * - Style refinement: Always deterministic (no LLM calls, <50ms)
 * - Lyrics refinement: Uses LLM (cloud or Ollama based on settings)
 *
 * Supports three refinement types (auto-detected by frontend):
 * - 'style': Only style fields changed, no LLM calls needed
 * - 'lyrics': Only feedback text provided, refine lyrics with LLM
 * - 'combined': Both style changes AND feedback, do both
 *
 * This ensures fast, consistent style refinement while leveraging
 * LLM capabilities only for creative lyrics work.
 *
 * @module ai/refinement/refinement
 */

import { createLogger } from '@bun/logger';
import { traceDecision } from '@bun/trace';
import { ValidationError } from '@shared/errors';

import { isDirectModeRefinement } from './helpers';
import {
  refineStyleOnly,
  refineLyricsOnly,
  refineWithDeterministicStyle,
  refinePromptDirectMode,
} from './strategies';

import type { RefinePromptOptions } from './types';
import type { TraceRuntime } from '@bun/ai/generation/types';
import type { GenerationResult, RefinementConfig } from '@bun/ai/types';
import type { TraceCollector } from '@bun/trace';

const log = createLogger('Refinement');

type NormalizedRefinementType = Exclude<RefinePromptOptions['refinementType'], undefined>;

type StyleChanges = RefinePromptOptions['styleChanges'];

type DirectModeResult = GenerationResult | null;

function resolveRefinementType(
  refinementType: RefinePromptOptions['refinementType']
): NormalizedRefinementType {
  return refinementType ?? 'combined';
}

function traceRefinementRouting(
  trace: TraceCollector | undefined,
  type: NormalizedRefinementType,
  hasStyleChanges: boolean,
  hasFeedback: boolean
): void {
  log.info('refinePrompt:routing', {
    refinementType: type,
    hasStyleChanges,
    hasFeedback,
  });

  traceDecision(trace, {
    domain: 'other',
    key: 'refinement.routing',
    branchTaken: type,
    why: `refinementType=${type} hasStyleChanges=${hasStyleChanges} hasFeedback=${hasFeedback}`,
  });
}

function traceStyleChanges(trace: TraceCollector | undefined, styleChanges: StyleChanges): void {
  if (!styleChanges) return;

  const { seedGenres, sunoStyles: changedSunoStyles, ...otherChanges } = styleChanges;

  if (seedGenres !== undefined) {
    traceDecision(trace, {
      domain: 'genre',
      key: 'refinement.genre.changed',
      branchTaken: seedGenres.length > 0 ? seedGenres.join(', ') : 'cleared',
      why: `New genre selection: ${seedGenres.length} genre(s)`,
    });
  }

  if (changedSunoStyles !== undefined) {
    traceDecision(trace, {
      domain: 'styleTags',
      key: 'refinement.sunoStyles.changed',
      branchTaken: changedSunoStyles.length > 0 ? changedSunoStyles.join(', ') : 'cleared',
      why: `New Suno V5 styles: ${changedSunoStyles.length} selected`,
    });
  }

  const otherChangedFields = Object.entries(otherChanges)
    .filter(([, v]) => v !== undefined)
    .map(([k]) => k);

  if (otherChangedFields.length > 0) {
    traceDecision(trace, {
      domain: 'styleTags',
      key: 'refinement.styleChanges.other',
      branchTaken: otherChangedFields.join(', '),
      why: `Additional fields changed: ${otherChangedFields.join(', ')}`,
    });
  }
}

async function handleDirectModeRefinement(
  options: RefinePromptOptions,
  config: RefinementConfig,
  runtime?: TraceRuntime
): Promise<DirectModeResult> {
  if (!isDirectModeRefinement(options.sunoStyles)) return null;

  traceDecision(runtime?.trace, {
    domain: 'other',
    key: 'refinement.routing',
    branchTaken: 'directMode',
    why: `Suno V5 styles detected (${options.sunoStyles.length} styles), using Direct Mode enrichment`,
  });

  if (options.styleChanges?.sunoStyles) {
    traceDecision(runtime?.trace, {
      domain: 'styleTags',
      key: 'refinement.sunoStyles.changed',
      branchTaken: options.styleChanges.sunoStyles.join(', ') || 'cleared',
      why: `New Suno V5 styles: ${options.styleChanges.sunoStyles.length} selected`,
    });
  }

  return refinePromptDirectMode({ ...options, sunoStyles: options.sunoStyles }, config, runtime);
}

async function refineByType(
  type: NormalizedRefinementType,
  options: RefinePromptOptions,
  config: RefinementConfig,
  runtime?: TraceRuntime
): Promise<GenerationResult> {
  switch (type) {
    case 'style':
      return refineStyleOnly(options, config, runtime);

    case 'lyrics':
      return refineLyricsOnly(options, config, runtime);

    case 'combined': {
      const isOffline = config.isUseLocalLLM();
      const ollamaEndpoint = isOffline ? config.getOllamaEndpoint() : undefined;
      return refineWithDeterministicStyle(options, config, ollamaEndpoint, runtime);
    }

    default:
      throw new ValidationError(`Invalid refinement type: ${type as string}`, 'refinementType');
  }
}

/**
 * Refine an existing prompt based on user feedback.
 *
 * Uses unified refinement strategy for ALL providers (cloud and offline):
 * - Direct Mode (sunoStyles): Uses shared enrichment (same as generation)
 * - Style refinement: Always deterministic (no LLM calls, <50ms)
 * - Lyrics refinement: Uses LLM (cloud or Ollama based on settings)
 *
 * Supports three refinement types (auto-detected by frontend):
 * - 'style': Only style fields changed, no LLM calls needed
 * - 'lyrics': Only feedback text provided, refine lyrics with LLM
 * - 'combined': Both style changes AND feedback, do both (default)
 *
 * This architecture ensures fast, consistent style refinement while
 * leveraging LLM capabilities only for creative lyrics work.
 *
 * @param options - Options for refinement
 * @param config - Configuration with dependencies
 * @returns Refined prompt, title, and optionally lyrics
 *
 * @throws {ValidationError} When refinementType is invalid
 * @throws {ValidationError} When lyrics refinement requested without existing lyrics
 * @throws {ValidationError} When lyrics refinement requested without feedback
 * @throws {OllamaUnavailableError} When offline mode is on but Ollama is not running
 * @throws {OllamaModelMissingError} When offline mode is on but Gemma model is missing
 */
export async function refinePrompt(
  options: RefinePromptOptions,
  config: RefinementConfig,
  runtime?: TraceRuntime
): Promise<GenerationResult> {
  const directModeResult = await handleDirectModeRefinement(options, config, runtime);
  if (directModeResult) return directModeResult;

  const type = resolveRefinementType(options.refinementType);
  traceRefinementRouting(runtime?.trace, type, !!options.styleChanges, !!options.feedback?.trim());
  traceStyleChanges(runtime?.trace, options.styleChanges);

  return refineByType(type, options, config, runtime);
}

// Re-export types for convenience
export type { RefinePromptOptions } from './types';
