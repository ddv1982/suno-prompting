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
import { generateTitle } from './content-generator';

const log = createLogger('QuickVibesEngine');

export type QuickVibesEngineConfig = {
  getModel: () => LanguageModel;
  isMaxMode: () => boolean;
  isDebugMode: () => boolean;
  buildDebugInfo: DebugInfoBuilder;
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

async function generateDirectModeTitle(
  description: string,
  styles: string[],
  getModel: () => LanguageModel
): Promise<string> {
  try {
    const titleSource = description || styles.join(', ');
    const genre = styles[0] || 'music';
    const result = await generateTitle(titleSource, genre, 'creative', getModel);
    return result.title;
  } catch (error) {
    log.warn('generateDirectModeTitle:failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    return 'Untitled';
  }
}

export async function generateQuickVibes(
  category: QuickVibesCategory | null,
  customDescription: string,
  withWordlessVocals: boolean,
  sunoStyles: string[],
  config: QuickVibesEngineConfig
): Promise<GenerationResult> {
  // ============ DIRECT MODE BYPASS ============
  // When Suno V5 Styles are selected, bypass LLM for styles
  // Styles are returned exactly as-is, title is generated via LLM
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
  options: RefineQuickVibesOptions,
  config: QuickVibesEngineConfig
): Promise<GenerationResult> {
  const { currentPrompt, currentTitle, description, feedback, withWordlessVocals, category, sunoStyles } = options;

  // ============ DIRECT MODE REFINE ============
  // When Suno V5 Styles are selected, styles remain unchanged
  // Title is regenerated using updated description
  if (sunoStyles.length > 0) {
    log.info('refineQuickVibes:directMode', { stylesCount: sunoStyles.length, hasDescription: !!description });

    // Use description if provided, otherwise use feedback as title source
    const titleSource = description || feedback;
    const title = await generateDirectModeTitle(titleSource, sunoStyles, config.getModel);

    return {
      text: currentPrompt,
      title,
      debugInfo: config.isDebugMode()
        ? config.buildDebugInfo(
            'DIRECT_MODE_REFINE: Styles unchanged, title regenerated.',
            `Current styles: ${currentPrompt}\nDescription: ${description || '(none)'}`,
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
