/**
 * AI Engine Configuration Proxies
 *
 * Provides configuration proxy methods that delegate to AIConfig.
 * Used by AIEngine to expose configuration setters and getters.
 *
 * @module ai/engine/config-proxies
 */

import { type LanguageModel } from 'ai';

import { AIConfig } from '@bun/ai/config';
import { getOllamaModel } from '@bun/ai/ollama-provider';

/**
 * Create configuration proxy methods bound to an AIConfig instance.
 */
export function createConfigProxies(config: AIConfig) {
  const proxies = {
    // Provider configuration
    setProvider: config.setProvider.bind(config),
    setApiKey: config.setApiKey.bind(config),
    setModel: config.setModel.bind(config),
    setUseSunoTags: config.setUseSunoTags.bind(config),
    setDebugMode: config.setDebugMode.bind(config),
    setMaxMode: config.setMaxMode.bind(config),
    setLyricsMode: config.setLyricsMode.bind(config),
    setUseLocalLLM: config.setUseLocalLLM.bind(config),
    initialize: config.initialize.bind(config),
    isDebugMode: config.isDebugMode.bind(config),
    isUseLocalLLM: config.isUseLocalLLM.bind(config),

    // Ollama configuration
    setOllamaEndpoint: config.setOllamaEndpoint.bind(config),
    setOllamaTemperature: config.setOllamaTemperature.bind(config),
    setOllamaMaxTokens: config.setOllamaMaxTokens.bind(config),
    setOllamaContextLength: config.setOllamaContextLength.bind(config),
    getOllamaConfig: config.getOllamaConfig.bind(config),

    /**
     * Get the Ollama language model with current configuration.
     */
    getOllamaModel: (): LanguageModel => getOllamaModel(config.getOllamaConfig()),
  };

  /**
   * Get the appropriate language model based on useLocalLLM setting.
   * Returns Ollama model if useLocalLLM is true, otherwise cloud provider model.
   */
  const getModel = (): LanguageModel => {
    if (config.isUseLocalLLM()) {
      return proxies.getOllamaModel();
    }
    return config.getModel();
  };

  return {
    ...proxies,
    getModel,
  };
}

export type ConfigProxies = ReturnType<typeof createConfigProxies>;
