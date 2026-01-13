/**
 * Quick Vibes Engine - Generation Logic
 *
 * Handles Quick Vibes prompt generation based on category or custom description.
 * Refinement logic is in refinement.ts.
 *
 * @module ai/quick-vibes/engine
 */

import { createLogger } from '@bun/logger';
import {
  buildDeterministicQuickVibes,
} from '@bun/prompt/quick-vibes';
import {
  applyQuickVibesMaxMode,
} from '@bun/prompt/quick-vibes-builder';
import { ValidationError } from '@shared/errors';

import { isDirectMode, generateDirectModeResult } from '../direct-mode';

import type { GenerationResult, EngineConfig } from '../types';
import type { GenerateQuickVibesOptions } from './types';
import type { TraceCollector } from '@bun/trace';

const log = createLogger('QuickVibesEngine');

type TraceRuntime = {
  readonly trace?: TraceCollector;
  readonly rng?: () => number;
};

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
  config: EngineConfig & { isMaxMode: () => boolean },
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
      rng
    );

    const result = applyQuickVibesMaxMode(text, config.isMaxMode());

    return {
      text: result,
      title,
      debugTrace: undefined,
    };
  }

  // Custom description without category: use custom description as style
  log.info('generateQuickVibes:customDescription', { description: customDescription });
  const result = applyQuickVibesMaxMode(customDescription, config.isMaxMode());

  return {
    text: result,
    debugTrace: undefined,
  };
}
