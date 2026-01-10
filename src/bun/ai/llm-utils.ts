import { generateText } from 'ai';

import { generateWithOllama } from '@bun/ai/ollama-client';
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
  /** Optional Ollama endpoint - when provided, uses direct Ollama client to bypass Bun fetch bug */
  ollamaEndpoint?: string;
  /** Optional timeout in ms (defaults to OLLAMA.GENERATION_TIMEOUT_MS for Ollama, AI.TIMEOUT_MS for cloud) */
  timeoutMs?: number;
  /** Optional max retries for cloud providers (defaults to AI.MAX_RETRIES) */
  maxRetries?: number;
};

/**
 * Shared helper for making LLM calls with consistent error handling.
 * Supports both cloud providers (via AI SDK) and local Ollama (via direct HTTP client).
 * 
 * When ollamaEndpoint is provided, uses direct Ollama client to bypass Bun fetch
 * empty body bug (#6932).
 */
export async function callLLM(options: CallLLMOptions): Promise<string> {
  const { getModel, systemPrompt, userPrompt, errorContext, ollamaEndpoint, timeoutMs, maxRetries } = options;

  try {
    let rawResponse: string;

    if (ollamaEndpoint) {
      // Use direct Ollama client to bypass Bun fetch empty body bug
      const timeout = timeoutMs ?? APP_CONSTANTS.OLLAMA.GENERATION_TIMEOUT_MS;
      log.info('callLLM:ollama', { errorContext, endpoint: ollamaEndpoint, timeout });
      rawResponse = await generateWithOllama(
        ollamaEndpoint,
        systemPrompt,
        userPrompt,
        timeout
      );
    } else {
      // Use AI SDK for cloud providers
      const timeout = timeoutMs ?? APP_CONSTANTS.AI.TIMEOUT_MS;
      const retries = maxRetries ?? APP_CONSTANTS.AI.MAX_RETRIES;
      log.info('callLLM:cloud', { errorContext, timeout, retries });
      const { text } = await generateText({
        model: getModel(),
        system: systemPrompt,
        prompt: userPrompt,
        maxRetries: retries,
        abortSignal: AbortSignal.timeout(timeout),
      });
      rawResponse = text;
    }

    if (!rawResponse?.trim()) {
      throw new AIGenerationError(`Empty response from AI model (${errorContext})`);
    }

    return rawResponse;
  } catch (error: unknown) {
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
  } catch (error: unknown) {
    log.warn('generateDirectModeTitle:failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    return 'Untitled';
  }
}
