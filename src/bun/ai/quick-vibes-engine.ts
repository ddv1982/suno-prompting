import { generateText } from 'ai';
import type { LanguageModel } from 'ai';
import { AIGenerationError } from '@shared/errors';
import { APP_CONSTANTS } from '@shared/constants';
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
import type { GenerationResult, DebugInfoBuilder } from './types';

const log = createLogger('QuickVibesEngine');

export type QuickVibesEngineConfig = {
  getModel: () => LanguageModel;
  isMaxMode: () => boolean;
  isDebugMode: () => boolean;
  buildDebugInfo: DebugInfoBuilder;
};

export async function generateQuickVibes(
  category: QuickVibesCategory | null,
  customDescription: string,
  withWordlessVocals: boolean,
  sunoStyles: string[],
  config: QuickVibesEngineConfig
): Promise<GenerationResult> {
  // ============ DIRECT MODE BYPASS ============
  // When Suno V5 Styles are selected, bypass LLM generation
  // Output is exactly the selected styles, no transformation
  if (sunoStyles.length > 0) {
    const styleResult = sunoStyles.join(', ');
    log.info('generateQuickVibes:directMode', { stylesCount: sunoStyles.length });
    return {
      text: styleResult,
      debugInfo: config.isDebugMode()
        ? config.buildDebugInfo(
            'DIRECT_MODE: No system prompt - styles passed through as-is',
            `Suno V5 Styles: ${sunoStyles.join(', ')}`,
            styleResult
          )
        : undefined,
    };
  }
  // ============ END DIRECT MODE BYPASS ============

  const systemPrompt = buildQuickVibesSystemPrompt(config.isMaxMode(), withWordlessVocals);
  const userPrompt = buildQuickVibesUserPrompt(category, customDescription);

  try {
    const { text: rawResponse } = await generateText({
      model: config.getModel(),
      system: systemPrompt,
      prompt: userPrompt,
      maxRetries: APP_CONSTANTS.AI.MAX_RETRIES,
      abortSignal: AbortSignal.timeout(APP_CONSTANTS.AI.TIMEOUT_MS),
    });

    if (!rawResponse?.trim()) {
      throw new AIGenerationError('Empty response from AI model (Quick Vibes)');
    }

    let result = postProcessQuickVibes(rawResponse);
    result = applyQuickVibesMaxMode(result, config.isMaxMode());

    return {
      text: result,
      debugInfo: config.isDebugMode()
        ? config.buildDebugInfo(systemPrompt, userPrompt, rawResponse)
        : undefined,
    };
  } catch (error) {
    if (error instanceof AIGenerationError) throw error;
    throw new AIGenerationError(
      `Failed to generate Quick Vibes: ${error instanceof Error ? error.message : 'Unknown error'}`,
      error instanceof Error ? error : undefined
    );
  }
}

export async function refineQuickVibes(
  currentPrompt: string,
  feedback: string,
  withWordlessVocals: boolean,
  category: QuickVibesCategory | null | undefined,
  sunoStyles: string[],
  config: QuickVibesEngineConfig
): Promise<GenerationResult> {
  // ============ DIRECT MODE REFINE ============
  // When Suno V5 Styles are selected, styles remain unchanged
  // User must change style selection to get different styles
  if (sunoStyles.length > 0) {
    log.info('refineQuickVibes:directMode', { stylesCount: sunoStyles.length });
    return {
      text: currentPrompt, // Keep styles unchanged
      debugInfo: config.isDebugMode()
        ? config.buildDebugInfo(
            'DIRECT_MODE_REFINE: Styles unchanged - select different styles to change',
            `Current styles: ${currentPrompt}`,
            currentPrompt
          )
        : undefined,
    };
  }
  // ============ END DIRECT MODE REFINE ============

  const cleanPrompt = stripMaxModeHeader(currentPrompt);
  const systemPrompt = buildQuickVibesRefineSystemPrompt(config.isMaxMode(), withWordlessVocals);
  const userPrompt = buildQuickVibesRefineUserPrompt(cleanPrompt, feedback, category);

  try {
    const { text: rawResponse } = await generateText({
      model: config.getModel(),
      system: systemPrompt,
      prompt: userPrompt,
      maxRetries: APP_CONSTANTS.AI.MAX_RETRIES,
      abortSignal: AbortSignal.timeout(APP_CONSTANTS.AI.TIMEOUT_MS),
    });

    if (!rawResponse?.trim()) {
      throw new AIGenerationError('Empty response from AI model (Quick Vibes refine)');
    }

    let result = postProcessQuickVibes(rawResponse);
    result = applyQuickVibesMaxMode(result, config.isMaxMode());

    return {
      text: result,
      debugInfo: config.isDebugMode()
        ? config.buildDebugInfo(systemPrompt, userPrompt, rawResponse)
        : undefined,
    };
  } catch (error) {
    if (error instanceof AIGenerationError) throw error;
    throw new AIGenerationError(
      `Failed to refine Quick Vibes: ${error instanceof Error ? error.message : 'Unknown error'}`,
      error instanceof Error ? error : undefined
    );
  }
}
