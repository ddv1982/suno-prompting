/**
 * AI Engine Configuration Factories
 *
 * Creates configuration objects for generation and refinement modules.
 *
 * @module ai/engine/config-factories
 */

import { type LanguageModel } from 'ai';

import { AIConfig } from '@bun/ai/config';
import { postProcess } from '@bun/ai/utils';

import type { ConfigProxies } from './config-proxies';
import type { GenerationConfig, RefinementConfig } from '@bun/ai/types';

/**
 * Post-process generated text (condense, dedupe, remove meta).
 * Wraps the standalone utility to inject model getter and ollama endpoint.
 */
function createPostProcess(
  config: AIConfig,
  getModel: () => LanguageModel
): (text: string) => Promise<string> {
  return async (text: string): Promise<string> => {
    return postProcess(text, getModel, config.getOllamaEndpointIfLocal());
  };
}

/**
 * Create configuration factories for generation and refinement modules.
 */
export function createConfigFactories(
  config: AIConfig,
  proxies: ConfigProxies
): {
  postProcess: (text: string) => Promise<string>;
  getGenerationConfig: () => GenerationConfig;
  getRefinementConfig: () => RefinementConfig;
} {
  const postProcessFn = createPostProcess(config, proxies.getModel);

  /**
   * Get configuration for generation module.
   */
  function getGenerationConfig(): GenerationConfig {
    const requestConfig = config.getRequestConfig();

    return {
      getModel: requestConfig.getModel,
      isDebugMode: requestConfig.isDebugMode,
      isMaxMode: requestConfig.isMaxMode,
      isLyricsMode: requestConfig.isLyricsMode,
      isStoryMode: requestConfig.isStoryMode,
      isUseLocalLLM: requestConfig.isUseLocalLLM,
      isLLMAvailable: requestConfig.isLLMAvailable,
      getUseSunoTags: requestConfig.getUseSunoTags,
      getModelName: requestConfig.getModelName,
      getProvider: requestConfig.getProvider,
      getOllamaEndpoint: requestConfig.getOllamaEndpoint,
      getOllamaEndpointIfLocal: requestConfig.getOllamaEndpointIfLocal,
    };
  }

  /**
   * Get configuration for refinement module.
   */
  function getRefinementConfig(): RefinementConfig {
    return {
      ...getGenerationConfig(),
      postProcess: postProcessFn,
    };
  }

  return {
    postProcess: postProcessFn,
    getGenerationConfig,
    getRefinementConfig,
  };
}

export type ConfigFactories = ReturnType<typeof createConfigFactories>;
