/**
 * Thematic Context Extraction Helper
 *
 * Handles LLM-based extraction of themes, moods, and scene from descriptions.
 * Falls back gracefully when LLM is unavailable or extraction fails.
 *
 * @module ai/generation/helpers/thematic-context
 */

import { extractThematicContext } from '@bun/ai/thematic-context';
import { createLogger } from '@bun/logger';
import { traceDecision } from '@bun/trace';

import { THEMATIC_EXTRACTION_TIMEOUT_MS } from '../constants';

import type { GenerationConfig } from '@bun/ai/types';
import type { TraceCollector } from '@bun/trace';
import type { ThematicContext } from '@shared/schemas/thematic-context';

const log = createLogger('Generation');

/**
 * Attempts to extract thematic context from description using LLM.
 * Returns null if LLM unavailable or extraction fails (graceful fallback).
 *
 * Uses AbortController for proper timeout cancellation - when timeout fires,
 * the LLM request is actually aborted (not just ignored) to save resources.
 */
export async function extractThematicContextIfAvailable(
  description: string | undefined,
  config: GenerationConfig,
  trace?: TraceCollector
): Promise<ThematicContext | null> {
  // Skip if no LLM available or no description
  if (!config.isLLMAvailable() || !description?.trim()) {
    traceDecision(trace, {
      domain: 'other',
      key: 'generation.thematic.skip',
      branchTaken: !config.isLLMAvailable() ? 'llm-unavailable' : 'no-description',
      why: !config.isLLMAvailable()
        ? 'LLM unavailable; skipping thematic extraction'
        : 'No description provided; skipping thematic extraction',
    });
    return null;
  }

  // Use AbortController for proper timeout cancellation
  const controller = new AbortController();
  const timeoutId = setTimeout(() => { controller.abort(); }, THEMATIC_EXTRACTION_TIMEOUT_MS);

  try {
    const thematicContext = await extractThematicContext({
      description,
      getModel: config.getModel,
      ollamaEndpoint: config.getOllamaEndpointIfLocal(),
      trace,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (thematicContext) {
      traceDecision(trace, {
        domain: 'other',
        key: 'generation.thematic.result',
        branchTaken: 'extracted',
        why: `Thematic context extracted: ${thematicContext.themes.length} themes, ${thematicContext.moods.length} moods`,
        selection: {
          method: 'index',
          chosenIndex: 0,
          candidates: thematicContext.themes,
        },
      });
    }

    return thematicContext;
  } catch (error: unknown) {
    clearTimeout(timeoutId);

    // Log but don't throw - graceful fallback to deterministic
    const message = error instanceof Error ? error.message : 'Unknown error';
    const isAbort = error instanceof Error && error.name === 'AbortError';

    if (isAbort) {
      traceDecision(trace, {
        domain: 'other',
        key: 'generation.thematic.fallback',
        branchTaken: 'timeout',
        why: `Thematic extraction timed out after ${THEMATIC_EXTRACTION_TIMEOUT_MS}ms; using pure deterministic`,
      });
    } else {
      log.warn('extractThematicContextIfAvailable:failed', { error: message });

      traceDecision(trace, {
        domain: 'other',
        key: 'generation.thematic.fallback',
        branchTaken: 'extraction-error',
        why: `Thematic extraction failed: ${message}; using pure deterministic`,
      });
    }

    return null;
  }
}
