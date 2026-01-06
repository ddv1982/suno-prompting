import { createLogger } from '@bun/logger';
import {
  applyQuickVibesMaxMode,
  stripMaxModeHeader,
  buildQuickVibesRefineSystemPrompt,
  buildQuickVibesRefineUserPrompt,
} from '@bun/prompt/quick-vibes-builder';
import { postProcessQuickVibes } from '@bun/prompt/quick-vibes-builder';
import { buildDeterministicQuickVibes } from '@bun/prompt/quick-vibes-templates';

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
