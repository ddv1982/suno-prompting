import { APP_CONSTANTS } from '@shared/constants';
import { DEFAULT_API_KEYS, type AppConfig } from '@shared/types';

import { buildGenerationPolicy } from './policy';

import type { GenerationRequestConfig } from './request-config';
import type { LanguageModel } from 'ai';

type ModelResolver = () => LanguageModel;

export function createGenerationRequestConfig(
  config: AppConfig,
  getModel: ModelResolver
): GenerationRequestConfig {
  const defaultOllamaConfig = {
    endpoint: APP_CONSTANTS.OLLAMA.DEFAULT_ENDPOINT,
    temperature: APP_CONSTANTS.OLLAMA.DEFAULT_TEMPERATURE,
    maxTokens: APP_CONSTANTS.OLLAMA.DEFAULT_MAX_TOKENS,
    contextLength: APP_CONSTANTS.OLLAMA.DEFAULT_CONTEXT_LENGTH,
  };

  const requestConfig = {
    provider: config.provider,
    model: config.model,
    useSunoTags: config.useSunoTags,
    debugMode: config.debugMode,
    maxMode: config.maxMode,
    lyricsMode: config.lyricsMode,
    storyMode: config.storyMode,
    useLocalLLM: config.useLocalLLM,
    ollamaConfig: { ...defaultOllamaConfig, ...config.ollamaConfig },
    apiKeys: { ...DEFAULT_API_KEYS, ...config.apiKeys },
  };

  const policy = buildGenerationPolicy(requestConfig);

  return {
    ...requestConfig,
    policy,
    getModel,
    getModelName: () => requestConfig.model,
    getProvider: () => requestConfig.provider,
    isDebugMode: () => requestConfig.debugMode,
    isMaxMode: () => requestConfig.maxMode,
    isLyricsMode: () => requestConfig.lyricsMode,
    isStoryMode: () => requestConfig.storyMode,
    isUseLocalLLM: () => requestConfig.useLocalLLM,
    isLLMAvailable: () => policy.llmAvailable,
    getUseSunoTags: () => requestConfig.useSunoTags,
    getOllamaEndpoint: () => requestConfig.ollamaConfig.endpoint,
    getOllamaEndpointIfLocal: () => policy.ollamaEndpoint,
  };
}
