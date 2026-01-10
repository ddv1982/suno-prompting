/**
 * Ollama Provider Module
 *
 * Provides Ollama local LLM integration using the ollama-ai-provider-v2 package.
 * Uses Gemma 3 4B as the default model for offline AI capabilities.
 *
 * @module ai/ollama-provider
 */

import { createOllama } from 'ollama-ai-provider-v2';

import { APP_CONSTANTS } from '@shared/constants';

import type { OllamaConfig } from '@shared/types';
import type { LanguageModel } from 'ai';

/** Default Ollama configuration */
export const DEFAULT_OLLAMA_CONFIG: OllamaConfig = {
  endpoint: APP_CONSTANTS.OLLAMA.DEFAULT_ENDPOINT,
  temperature: APP_CONSTANTS.OLLAMA.DEFAULT_TEMPERATURE,
  maxTokens: APP_CONSTANTS.OLLAMA.DEFAULT_MAX_TOKENS,
  contextLength: APP_CONSTANTS.OLLAMA.DEFAULT_CONTEXT_LENGTH,
} as const;

/** The Ollama model to use for local generation */
const OLLAMA_MODEL = 'gemma3:4b';

/**
 * Create an Ollama provider instance with the given configuration.
 *
 * @param config - Ollama configuration with endpoint
 * @returns Ollama provider instance
 */
export function createOllamaProvider(config: OllamaConfig): ReturnType<typeof createOllama> {
  return createOllama({
    baseURL: config.endpoint,
  });
}

/**
 * Get the Ollama language model for Gemma 3 4B.
 *
 * @param config - Ollama configuration
 * @returns Language model instance for use with AI SDK
 */
export function getOllamaModel(config: OllamaConfig): LanguageModel {
  const provider = createOllamaProvider(config);
  return provider(OLLAMA_MODEL);
}
