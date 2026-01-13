/**
 * Quick Vibes Refinement Logic
 *
 * Contains refinement functions and helpers for Quick Vibes prompts.
 * Extracted from quick-vibes-engine.ts for better separation of concerns.
 *
 * @module ai/quick-vibes/refinement
 */

import { createLogger } from '@bun/logger';
import {
  getQuickVibesTemplate,
  generateQuickVibesTitle,
  type QuickVibesTemplate,
} from '@bun/prompt/quick-vibes';
import {
  applyQuickVibesMaxMode,
  stripMaxModeHeader,
  buildQuickVibesRefineSystemPrompt,
  buildQuickVibesRefineUserPrompt,
  postProcessQuickVibes,
} from '@bun/prompt/quick-vibes-builder';
import { InvariantError } from '@shared/errors';

import { isDirectMode, generateDirectModeResult } from '../direct-mode';
import { callLLM } from '../llm-utils';

import type { GenerationResult, EngineConfig } from '../types';
import type { RefineQuickVibesOptions } from './types';
import type { TraceCollector } from '@bun/trace';

const log = createLogger('QuickVibesRefinement');

type TraceRuntime = {
  readonly trace?: TraceCollector;
};

/**
 * Simple hash function for feedback string to seed RNG.
 */
export function hashFeedback(feedback: string): number {
  let hash = 0;
  for (let i = 0; i < feedback.length; i++) {
    const char = feedback.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash) || 1; // Ensure non-zero
}

/**
 * Create a seeded pseudo-random number generator.
 */
export function createSeededRng(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
}

/**
 * Build Quick Vibes prompt from template with custom RNG.
 */
export function buildDeterministicQuickVibesFromTemplate(
  template: QuickVibesTemplate,
  withWordlessVocals: boolean,
  maxMode: boolean,
  rng: () => number
): { text: string; title: string } {
  const selectRandom = <T>(items: readonly T[]): T => {
    if (items.length === 0) {
      throw new InvariantError('selectRandom called with empty array');
    }
    const idx = Math.floor(rng() * items.length);
    return items[idx] as T;
  };

  const genre = selectRandom(template.genres);
  const instruments = selectRandom(template.instruments);
  const mood = selectRandom(template.moods);
  const title = generateQuickVibesTitle(template, rng);

  // Build instrument list
  const instrumentList = [...instruments];
  if (withWordlessVocals) {
    instrumentList.push('wordless vocals');
  }

  // Build the prompt based on mode
  if (maxMode) {
    const lines = [
      `Genre: "${genre}"`,
      `Mood: "${mood}"`,
      `Instruments: "${instrumentList.join(', ')}"`,
    ];
    return { text: lines.join('\n'), title };
  }

  // Standard mode - simpler format
  const lines = [
    `${mood} ${genre}`,
    `Instruments: ${instrumentList.join(', ')}`,
  ];
  return { text: lines.join('\n'), title };
}

/**
 * Apply deterministic refinement to Quick Vibes when category is set.
 * Uses feedback keywords to guide variations from the template.
 */
export function refineDeterministicQuickVibes(
  options: RefineQuickVibesOptions,
  config: EngineConfig & { isMaxMode: () => boolean }
): GenerationResult {
  const { feedback, withWordlessVocals, category } = options;

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
  config: EngineConfig & { isMaxMode: () => boolean },
  runtime?: TraceRuntime
): Promise<GenerationResult> {
  const { currentPrompt, description, feedback, withWordlessVocals, category, sunoStyles } = options;

  // Direct Mode: styles preserved as-is, prompt enriched
  if (isDirectMode(sunoStyles)) {
    log.info('refineQuickVibes:directMode', { stylesCount: sunoStyles.length, hasDescription: !!description, maxMode: config.isMaxMode() });
    const titleSource = (description?.trim() || feedback.trim() || '').trim();
    return generateDirectModeResult(
      { sunoStyles, description: titleSource, maxMode: config.isMaxMode(), debugLabel: 'DIRECT_MODE_REFINE: Styles preserved, prompt enriched.' },
      config,
      { trace: runtime?.trace }
    );
  }

  // Category-based refinement: use deterministic path (no LLM)
  if (category) {
    log.info('refineQuickVibes:deterministic', { category, feedback: feedback.slice(0, 50) });
    return refineDeterministicQuickVibes(options, config);
  }

  // No category: use LLM refinement
  log.info('refineQuickVibes:llm', { hasCategory: !!category, hasFeedback: !!feedback });
  const cleanPrompt = stripMaxModeHeader(currentPrompt);
  const systemPrompt = buildQuickVibesRefineSystemPrompt(config.isMaxMode(), withWordlessVocals);
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

  let result = postProcessQuickVibes(rawResponse);
  result = applyQuickVibesMaxMode(result, config.isMaxMode());

  return {
    text: result,
    debugTrace: undefined,
  };
}
