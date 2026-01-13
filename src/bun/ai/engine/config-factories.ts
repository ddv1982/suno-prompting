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
    const ollamaEndpoint = config.isUseLocalLLM() ? config.getOllamaEndpoint() : undefined;
    return postProcess(text, getModel, ollamaEndpoint);
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
    return {
      getModel: proxies.getModel,
      getOllamaModel: proxies.getOllamaModel,
      isDebugMode: config.isDebugMode.bind(config),
      isMaxMode: config.isMaxMode.bind(config),
      isLyricsMode: config.isLyricsMode.bind(config),
      isUseLocalLLM: config.isUseLocalLLM.bind(config),
      getUseSunoTags: config.getUseSunoTags.bind(config),
      getModelName: config.getModelName.bind(config),
      getProvider: config.getProvider.bind(config),
      getOllamaEndpoint: config.getOllamaEndpoint.bind(config),
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
