/**
 * Quick Vibes Engine - Generation Logic
 *
 * Handles Quick Vibes prompt generation based on category or custom description.
 * Refinement logic is in refinement.ts.
 *
 * @module ai/quick-vibes/engine
 */

import { isDirectMode, generateDirectModeResult } from '@bun/ai/direct-mode';
import {
  extractStructuredDataForStory,
  generateStoryNarrativeWithTimeout,
  prependMaxHeaders,
} from '@bun/ai/story-generator';
import { createLogger } from '@bun/logger';
import {
  buildDeterministicQuickVibes,
} from '@bun/prompt/quick-vibes';
import {
  applyQuickVibesMaxMode,
} from '@bun/prompt/quick-vibes-builder';
import { traceDecision } from '@bun/trace';
import { ValidationError } from '@shared/errors';


import type { GenerateQuickVibesOptions } from './types';
import type { TraceRuntime } from '@bun/ai/generation/types';
import type { GenerationResult, EngineConfig } from '@bun/ai/types';

const log = createLogger('QuickVibesEngine');

/** Extended config for Quick Vibes with Story Mode support */
export interface QuickVibesEngineConfig extends EngineConfig {
  isMaxMode: () => boolean;
  isStoryMode?: () => boolean;
  isLLMAvailable?: () => boolean;
  getOllamaEndpointIfLocal?: () => string | undefined;
}

/**
 * Apply Story Mode transformation to deterministic result.
 * Returns the transformed result if Story Mode succeeds, null if fallback is needed.
 */
async function applyStoryModeTransformation(
  deterministicResult: string,
  title: string,
  customDescription: string,
  config: QuickVibesEngineConfig,
  runtime?: TraceRuntime
): Promise<GenerationResult | null> {
  const storyMode = config.isStoryMode?.() ?? false;
  const llmAvailable = config.isLLMAvailable?.() ?? false;

  if (!storyMode || !llmAvailable) {
    return null;
  }

  log.info('applyStoryModeTransformation:start', { hasLLM: true });

  traceDecision(runtime?.trace, {
    domain: 'other',
    key: 'quickVibes.storyMode.attempt',
    branchTaken: 'narrative',
    why: 'Story Mode enabled, attempting narrative generation',
  });

  const storyInput = extractStructuredDataForStory(deterministicResult, null, { description: customDescription });

  const storyResult = await generateStoryNarrativeWithTimeout({
    input: storyInput,
    getModel: config.getModel,
    ollamaEndpoint: config.getOllamaEndpointIfLocal?.(),
    trace: runtime?.trace,
  });

  if (storyResult.success) {
    const finalText = config.isMaxMode()
      ? prependMaxHeaders(storyResult.narrative)
      : storyResult.narrative;

    return { text: finalText, title, debugTrace: undefined };
  }

  // Story Mode fallback
  const errorMessage = storyResult.error ?? 'Unknown error';
  log.warn('applyStoryModeTransformation:fallback', { error: errorMessage });

  traceDecision(runtime?.trace, {
    domain: 'other',
    key: 'quickVibes.storyMode.fallback',
    branchTaken: 'deterministic',
    why: `Story generation failed: ${errorMessage}`,
  });

  return { text: deterministicResult, title, debugTrace: undefined, storyModeFallback: true };
}

/**
 * Generates a Quick Vibes prompt based on category or custom description.
 *
 * Generation paths:
 * - Direct Mode: Suno styles passed through as-is
 * - Category Mode: Fully deterministic (no LLM) - uses pre-defined templates
 * - Custom Mode: Custom description used as style
 *
 * @param options - Generation options including category and description
 * @param config - Engine configuration with model and debug settings
 * @returns Generated prompt with text and title
 *
 * @example
 * ```typescript
 * const result = await generateQuickVibes(
 *   { category: 'lofi-study', customDescription: '', withWordlessVocals: false, sunoStyles: [] },
 *   { getModel, isMaxMode: () => true, isDebugMode: () => false }
 * );
 * console.log(result.text); // "Genre: \"lo-fi\"\nMood: \"relaxed\"..."
 * ```
 */
export async function generateQuickVibes(
  options: GenerateQuickVibesOptions,
  config: QuickVibesEngineConfig,
  runtime?: TraceRuntime
): Promise<GenerationResult> {
  const { category, customDescription, withWordlessVocals, sunoStyles } = options;
  const rng = runtime?.rng ?? Math.random;

  // Validate input (styles limit + mutual exclusivity with category)
  if (sunoStyles.length > 4) {
    throw new ValidationError('Maximum 4 Suno V5 styles allowed', 'sunoStyles');
  }
  if (category !== null && sunoStyles.length > 0) {
    throw new ValidationError('Cannot use both Category and Suno V5 Styles. Please select only one.', 'category');
  }

  // Direct Mode: styles preserved as-is, prompt enriched
  if (isDirectMode(sunoStyles)) {
    log.info('generateQuickVibes:directMode', { stylesCount: sunoStyles.length, hasDescription: !!customDescription, maxMode: config.isMaxMode() });
    return generateDirectModeResult(
      { sunoStyles, description: customDescription, maxMode: config.isMaxMode() },
      config,
      { trace: runtime?.trace, rng }
    );
  }

  // Category-based generation: fully deterministic (no LLM)
  if (category) {
    log.info('generateQuickVibes:deterministic', { category, withWordlessVocals });
    const { text, title } = buildDeterministicQuickVibes(
      category,
      withWordlessVocals,
      config.isMaxMode(),
      { withWordlessVocals, maxMode: config.isMaxMode(), rng, trace: runtime?.trace }
    );

    const deterministicResult = applyQuickVibesMaxMode(text, config.isMaxMode());

    // Try Story Mode transformation (returns null if not applicable)
    const storyResult = await applyStoryModeTransformation(
      deterministicResult, title, customDescription, config, runtime
    );
    if (storyResult) {
      return storyResult;
    }

    return { text: deterministicResult, title, debugTrace: undefined };
  }

  // Custom description without category: use custom description as style
  log.info('generateQuickVibes:customDescription', { description: customDescription });
  const result = applyQuickVibesMaxMode(customDescription, config.isMaxMode());

  return {
    text: result,
    debugTrace: undefined,
  };
}
