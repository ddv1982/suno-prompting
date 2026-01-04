import type { QuickVibesCategory } from '@shared/types';
import {
  buildQuickVibesSystemPrompt,
  buildQuickVibesUserPrompt,
  postProcessQuickVibes,
  applyQuickVibesMaxMode,
  stripMaxModeHeader,
  buildQuickVibesRefineSystemPrompt,
  buildQuickVibesRefineUserPrompt,
} from '@bun/prompt/quick-vibes-builder';
import { createLogger } from '@bun/logger';
import type { GenerationResult, EngineConfig } from './types';
import { callLLM, generateDirectModeTitle } from './llm-utils';

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

  // ============ DIRECT MODE BYPASS ============
  if (sunoStyles.length > 0) {
    const styleResult = sunoStyles.join(', ');
    log.info('generateQuickVibes:directMode', { stylesCount: sunoStyles.length, hasDescription: !!customDescription });

    const title = await generateDirectModeTitle(customDescription, sunoStyles, config.getModel);

    return {
      text: styleResult,
      title,
      debugInfo: config.isDebugMode()
        ? config.buildDebugInfo(
            'DIRECT_MODE: Styles passed through as-is. Title generated via LLM.',
            `Suno V5 Styles: ${styleResult}\nDescription: ${customDescription || '(none)'}`,
            styleResult
          )
        : undefined,
    };
  }
  // ============ END DIRECT MODE BYPASS ============

  const systemPrompt = buildQuickVibesSystemPrompt(config.isMaxMode(), withWordlessVocals);
  const userPrompt = buildQuickVibesUserPrompt(category, customDescription);

  const rawResponse = await callLLM({
    getModel: config.getModel,
    systemPrompt,
    userPrompt,
    errorContext: 'generate Quick Vibes',
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

export async function refineQuickVibes(
  options: RefineQuickVibesOptions,
  config: EngineConfig & { isMaxMode: () => boolean }
): Promise<GenerationResult> {
  const { currentPrompt, description, feedback, withWordlessVocals, category, sunoStyles } = options;

  // ============ DIRECT MODE REFINE ============
  if (sunoStyles.length > 0) {
    const styleResult = sunoStyles.join(', ');
    log.info('refineQuickVibes:directMode', { stylesCount: sunoStyles.length, hasDescription: !!description });

    const titleSource = description || feedback;
    const title = await generateDirectModeTitle(titleSource, sunoStyles, config.getModel);

    return {
      text: styleResult,
      title,
      debugInfo: config.isDebugMode()
        ? config.buildDebugInfo(
            'DIRECT_MODE_REFINE: Styles updated, title regenerated.',
            `New styles: ${styleResult}\nDescription: ${description || '(none)'}`,
            styleResult
          )
        : undefined,
    };
  }
  // ============ END DIRECT MODE REFINE ============

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
