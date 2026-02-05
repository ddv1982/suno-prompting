/**
 * Quick Vibes Refinement Logic
 *
 * Contains refinement functions and helpers for Quick Vibes prompts.
 * Extracted from quick-vibes-engine.ts for better separation of concerns.
 *
 * @module ai/quick-vibes/refinement
 */

import { isDirectMode, generateDirectModeResult } from '@bun/ai/direct-mode';
import { callLLM } from '@bun/ai/llm-utils';
import {
  extractStructuredDataForStory,
  generateStoryNarrativeWithTimeout,
  prependMaxHeaders,
} from '@bun/ai/story-generator';
import { createLogger } from '@bun/logger';
import {
  getQuickVibesTemplate,
  generateQuickVibesTitle,
  type QuickVibesTemplate,
} from '@bun/prompt/quick-vibes';
import {
  applyQuickVibesMaxMode,
  buildQuickVibesRefineSystemPrompt,
  buildQuickVibesRefineUserPrompt,
  postProcessQuickVibes,
} from '@bun/prompt/quick-vibes-builder';
import { traceDecision } from '@bun/trace';
import { InvariantError } from '@shared/errors';
import { stripMaxModeHeader } from '@shared/prompt-utils';
import { createSeededRng, selectRandom } from '@shared/utils/random';

import type { QuickVibesEngineConfig } from './engine';
import type { RefineQuickVibesOptions } from './types';
import type { TraceRuntime } from '@bun/ai/generation/types';
import type { GenerationResult } from '@bun/ai/types';

const log = createLogger('QuickVibesRefinement');

/**
 * Apply Story Mode transformation to refinement result.
 * Returns the transformed result if Story Mode succeeds, null if fallback is needed.
 */
async function applyStoryModeToRefinement(
  result: GenerationResult,
  customDescription: string,
  config: QuickVibesEngineConfig,
  runtime?: TraceRuntime
): Promise<GenerationResult | null> {
  const storyMode = config.isStoryMode?.() ?? false;
  const llmAvailable = config.isLLMAvailable?.() ?? false;

  if (!storyMode || !llmAvailable) {
    return null;
  }

  log.info('applyStoryModeToRefinement:start', { hasLLM: true });

  traceDecision(runtime?.trace, {
    domain: 'other',
    key: 'quickVibes.refine.storyMode.attempt',
    branchTaken: 'narrative',
    why: 'Story Mode enabled, attempting narrative generation for refinement',
  });

  const storyInput = extractStructuredDataForStory(result.text, null, {
    description: customDescription,
  });

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

    return { text: finalText, title: result.title, debugTrace: undefined };
  }

  // Story Mode fallback
  const errorMessage = storyResult.error ?? 'Unknown error';
  log.warn('applyStoryModeToRefinement:fallback', { error: errorMessage });

  traceDecision(runtime?.trace, {
    domain: 'other',
    key: 'quickVibes.refine.storyMode.fallback',
    branchTaken: 'deterministic',
    why: `Story generation failed: ${errorMessage}`,
  });

  return { text: result.text, title: result.title, debugTrace: undefined, storyModeFallback: true };
}

/**
 * Simple hash function for feedback string to seed RNG.
 */
function hashFeedback(feedback: string): number {
  let hash = 0;
  for (let i = 0; i < feedback.length; i++) {
    const char = feedback.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash) || 1; // Ensure non-zero
}

/**
 * Build Quick Vibes prompt from template with custom RNG.
 */
function buildDeterministicQuickVibesFromTemplate(
  template: QuickVibesTemplate,
  maxMode: boolean,
  rng: () => number
): { text: string; title: string } {
  const genre = selectRandom(template.genres, rng);
  const instruments = selectRandom(template.instruments, rng);
  const mood = selectRandom(template.moods, rng);
  const title = generateQuickVibesTitle(template, rng);

  // Build the prompt based on mode
  if (maxMode) {
    const lines = [
      `Genre: "${genre}"`,
      `Mood: "${mood}"`,
      `Instruments: "${instruments.join(', ')}"`,
    ];
    return { text: lines.join('\n'), title };
  }

  // Standard mode - simpler format
  const lines = [`${mood} ${genre}`, `Instruments: ${instruments.join(', ')}`];
  return { text: lines.join('\n'), title };
}

/**
 * Apply deterministic refinement to Quick Vibes when category is set.
 * Uses feedback keywords to guide variations from the template.
 */
async function refineDeterministicQuickVibes(
  options: RefineQuickVibesOptions,
  config: QuickVibesEngineConfig,
  runtime?: TraceRuntime
): Promise<GenerationResult> {
  const { feedback, category, description } = options;

  // Category must be set when this function is called
  if (!category) {
    throw new InvariantError('refineDeterministicQuickVibes called without category');
  }

  // Get template for the category
  const template = getQuickVibesTemplate(category);

  // Use feedback to seed the RNG for deterministic but varied output
  const feedbackHash = hashFeedback(feedback);
  const rng = createSeededRng(feedbackHash);

  // Build new prompt from template with seeded randomness
  const { text, title } = buildDeterministicQuickVibesFromTemplate(
    template,
    config.isMaxMode(),
    rng
  );

  const deterministicResult = applyQuickVibesMaxMode(text, config.isMaxMode());

  const result: GenerationResult = {
    text: deterministicResult,
    title,
    debugTrace: undefined,
  };

  // Try Story Mode transformation
  const storyResult = await applyStoryModeToRefinement(result, description ?? '', config, runtime);
  if (storyResult) return storyResult;

  return result;
}

/**
 * Refines an existing Quick Vibes prompt based on user feedback.
 *
 * Refinement paths:
 * - Direct Mode: Styles updated, title regenerated
 * - Category Mode: Deterministic refinement (no LLM) - uses feedback to seed variations
 * - Custom Mode: LLM-based refinement for non-category prompts
 *
 * @param options - Refinement options including current prompt, feedback, and category
 * @param config - Engine configuration with model and debug settings
 * @returns Refined prompt with text and title
 */
export async function refineQuickVibes(
  options: RefineQuickVibesOptions,
  config: QuickVibesEngineConfig,
  runtime?: TraceRuntime
): Promise<GenerationResult> {
  const { currentPrompt, description, feedback, category, sunoStyles } = options;

  // Direct Mode: styles preserved as-is, prompt enriched
  if (isDirectMode(sunoStyles)) {
    log.info('refineQuickVibes:directMode', {
      stylesCount: sunoStyles.length,
      hasDescription: !!description,
      maxMode: config.isMaxMode(),
    });
    const titleSource = (description?.trim() || feedback.trim() || '').trim();
    return generateDirectModeResult(
      {
        sunoStyles,
        description: titleSource,
        maxMode: config.isMaxMode(),
        debugLabel: 'DIRECT_MODE_REFINE: Styles preserved, prompt enriched.',
      },
      config,
      { trace: runtime?.trace }
    );
  }

  // Category-based refinement: use deterministic path (no LLM)
  if (category) {
    log.info('refineQuickVibes:deterministic', { category, feedback: feedback.slice(0, 50) });
    return refineDeterministicQuickVibes(options, config, runtime);
  }

  // No category: use LLM refinement
  log.info('refineQuickVibes:llm', { hasCategory: !!category, hasFeedback: !!feedback });
  const cleanPrompt = stripMaxModeHeader(currentPrompt);
  const systemPrompt = buildQuickVibesRefineSystemPrompt();
  const userPrompt = buildQuickVibesRefineUserPrompt(cleanPrompt, feedback, category);

  // Get Ollama endpoint for local LLM mode (bypasses Bun fetch bug)
  const ollamaEndpoint = config.getOllamaEndpoint?.();

  const rawResponse = await callLLM({
    getModel: config.getModel,
    systemPrompt,
    userPrompt,
    errorContext: 'refine Quick Vibes',
    ollamaEndpoint,
    trace: runtime?.trace,
    traceLabel: 'quickVibes.refine',
  });

  let resultText = postProcessQuickVibes(rawResponse);
  resultText = applyQuickVibesMaxMode(resultText, config.isMaxMode());

  const result: GenerationResult = {
    text: resultText,
    debugTrace: undefined,
  };

  // Try Story Mode transformation for LLM refinement path too
  const storyResult = await applyStoryModeToRefinement(result, description ?? '', config, runtime);
  if (storyResult) return storyResult;

  return result;
}
