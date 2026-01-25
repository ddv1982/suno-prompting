/**
 * Ollama Provider Module
 *
 * Provides default Ollama configuration for local LLM integration.
 * Note: Actual Ollama calls are handled by ollama-client.ts using node:http
 * to bypass Bun fetch issues with empty response bodies.
 *
 * @module ai/ollama-provider
 */

import { APP_CONSTANTS } from '@shared/constants';

import type { OllamaConfig } from '@shared/types';

/** Default Ollama configuration */
export const DEFAULT_OLLAMA_CONFIG: OllamaConfig = {
  endpoint: APP_CONSTANTS.OLLAMA.DEFAULT_ENDPOINT,
  temperature: APP_CONSTANTS.OLLAMA.DEFAULT_TEMPERATURE,
  maxTokens: APP_CONSTANTS.OLLAMA.DEFAULT_MAX_TOKENS,
  contextLength: APP_CONSTANTS.OLLAMA.DEFAULT_CONTEXT_LENGTH,
} as const;
