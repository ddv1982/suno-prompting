import { generateText } from 'ai';

import { createLogger } from '@bun/logger';
import { APP_CONSTANTS } from '@shared/constants';
import { AIGenerationError } from '@shared/errors';

import type { LanguageModel } from 'ai';

const log = createLogger('LLMUtils');

export type CallLLMOptions = {
  getModel: () => LanguageModel;
  systemPrompt: string;
  userPrompt: string;
  errorContext: string;
};

/**
 * Shared helper for making LLM calls with consistent error handling
 */
export async function callLLM(options: CallLLMOptions): Promise<string> {
  const { getModel, systemPrompt, userPrompt, errorContext } = options;

  try {
    const { text: rawResponse } = await generateText({
      model: getModel(),
      system: systemPrompt,
      prompt: userPrompt,
      maxRetries: APP_CONSTANTS.AI.MAX_RETRIES,
      abortSignal: AbortSignal.timeout(APP_CONSTANTS.AI.TIMEOUT_MS),
    });

    if (!rawResponse?.trim()) {
      throw new AIGenerationError(`Empty response from AI model (${errorContext})`);
    }

    return rawResponse;
  } catch (error) {
    if (error instanceof AIGenerationError) throw error;
    throw new AIGenerationError(
      `Failed to ${errorContext}: ${error instanceof Error ? error.message : 'Unknown error'}`,
      error instanceof Error ? error : undefined
    );
  }
}

/**
 * Generate a title for Direct Mode (Suno V5 Styles)
 * Used by both Quick Vibes and Creative Boost engines
 */
export async function generateDirectModeTitle(
  description: string,
  styles: string[],
  getModel: () => LanguageModel
): Promise<string> {
  try {
    const { generateTitle } = await import('./content-generator');

    const cleanDescription = description.trim();
    const styleText = styles.join(', ');
    const titleDescription = cleanDescription
      ? `${cleanDescription}\nSuno V5 styles: ${styleText}`
      : `Suno V5 styles: ${styleText}`;

    const genre = styles[0] || 'music';
    const result = await generateTitle(titleDescription, genre, 'creative', getModel);
    return result.title;
  } catch (error) {
    log.warn('generateDirectModeTitle:failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    return 'Untitled';
  }
}
