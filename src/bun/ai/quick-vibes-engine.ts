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
import type { GenerationResult, DebugInfoBuilder } from './types';

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
  config: QuickVibesEngineConfig
): Promise<GenerationResult> {
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
  config: QuickVibesEngineConfig
): Promise<GenerationResult> {
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
