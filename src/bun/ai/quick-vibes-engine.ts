import { createLogger } from '@bun/logger';
import {
  applyQuickVibesMaxMode,
  stripMaxModeHeader,
  buildQuickVibesRefineSystemPrompt,
  buildQuickVibesRefineUserPrompt,
} from '@bun/prompt/quick-vibes-builder';
import { postProcessQuickVibes } from '@bun/prompt/quick-vibes-builder';
import {
  buildDeterministicQuickVibes,
  getQuickVibesTemplate,
  generateQuickVibesTitle,
  type QuickVibesTemplate,
} from '@bun/prompt/quick-vibes-templates';

import { isDirectMode, generateDirectModeResult } from './direct-mode';
import { callLLM } from './llm-utils';

import type { GenerationResult, EngineConfig } from './types';
import type { QuickVibesCategory } from '@shared/types';

const log = createLogger('QuickVibesEngine');

export type GenerateQuickVibesOptions = {
  category: QuickVibesCategory | null;
  customDescription: string;
  withWordlessVocals: boolean;
  sunoStyles: string[];
};

export type RefineQuickVibesOptions = {
  currentPrompt: string;
  currentTitle?: string;
  description?: string;
  feedback: string;
  withWordlessVocals: boolean;
  category?: QuickVibesCategory | null;
  sunoStyles: string[];
};

export async function generateQuickVibes(
  options: GenerateQuickVibesOptions,
  config: EngineConfig & { isMaxMode: () => boolean }
): Promise<GenerationResult> {
  const { category, customDescription, withWordlessVocals, sunoStyles } = options;

  // Direct Mode: styles passed through as-is
  if (isDirectMode(sunoStyles)) {
    log.info('generateQuickVibes:directMode', { stylesCount: sunoStyles.length, hasDescription: !!customDescription });
    return generateDirectModeResult({ sunoStyles, description: customDescription }, config);
  }

  // Category-based generation: fully deterministic (no LLM)
  if (category) {
    log.info('generateQuickVibes:deterministic', { category, withWordlessVocals });
    const { text, title } = buildDeterministicQuickVibes(
      category,
      withWordlessVocals,
      config.isMaxMode()
    );

    const result = applyQuickVibesMaxMode(text, config.isMaxMode());

    return {
      text: result,
      title,
      debugInfo: config.isDebugMode()
        ? config.buildDebugInfo('DETERMINISTIC', `Category: ${category}`, text)
        : undefined,
    };
  }

  // Custom description without category: use custom description as style
  log.info('generateQuickVibes:customDescription', { description: customDescription });
  const result = applyQuickVibesMaxMode(customDescription, config.isMaxMode());

  return {
    text: result,
    debugInfo: config.isDebugMode()
      ? config.buildDebugInfo('PASSTHROUGH', 'Custom description', customDescription)
      : undefined,
  };
}

/**
 * Apply deterministic refinement to Quick Vibes when category is set.
 * Uses feedback keywords to guide variations from the template.
 */
function refineDeterministicQuickVibes(
  options: RefineQuickVibesOptions,
  config: EngineConfig & { isMaxMode: () => boolean }
): GenerationResult {
  const { feedback, withWordlessVocals, category } = options;

  // Get template for the category
  const template = getQuickVibesTemplate(category!);

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
    debugInfo: config.isDebugMode()
      ? config.buildDebugInfo('DETERMINISTIC_REFINE', `Category: ${String(category)}, Feedback: ${feedback}`, text)
      : undefined,
  };
}

/**
 * Simple hash function for feedback string to seed RNG.
 */
function hashFeedback(feedback: string): number {
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
function createSeededRng(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
}

/**
 * Build Quick Vibes prompt from template with custom RNG.
 */
function buildDeterministicQuickVibesFromTemplate(
  template: QuickVibesTemplate,
  withWordlessVocals: boolean,
  maxMode: boolean,
  rng: () => number
): { text: string; title: string } {
  const selectRandom = <T>(items: readonly T[]): T => {
    if (items.length === 0) {
      throw new Error('selectRandom called with empty array');
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

export async function refineQuickVibes(
  options: RefineQuickVibesOptions,
  config: EngineConfig & { isMaxMode: () => boolean }
): Promise<GenerationResult> {
  const { currentPrompt, description, feedback, withWordlessVocals, category, sunoStyles } = options;

  // Direct Mode: styles updated, title regenerated
  if (isDirectMode(sunoStyles)) {
    log.info('refineQuickVibes:directMode', { stylesCount: sunoStyles.length, hasDescription: !!description });
    const titleSource = (description?.trim() || feedback.trim() || '').trim();
    return generateDirectModeResult(
      { sunoStyles, description: titleSource, debugLabel: 'DIRECT_MODE_REFINE: Styles updated, title regenerated.' },
      config
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

  const rawResponse = await callLLM({
    getModel: config.getModel,
    systemPrompt,
    userPrompt,
    errorContext: 'refine Quick Vibes',
  });

  let result = postProcessQuickVibes(rawResponse);
  result = applyQuickVibesMaxMode(result, config.isMaxMode());

  return {
    text: result,
    debugInfo: config.isDebugMode()
      ? config.buildDebugInfo(systemPrompt, userPrompt, rawResponse)
      : undefined,
  };
}
