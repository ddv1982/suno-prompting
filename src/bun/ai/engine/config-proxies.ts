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

/**
 * Create configuration proxy methods bound to an AIConfig instance.
 *
 * Note: When useLocalLLM is true, getModel() still returns the cloud model.
 * Local LLM routing is handled by passing ollamaEndpoint to callLLM(),
 * which uses the direct HTTP client (ollama-client.ts) instead of AI SDK.
 */
export function createConfigProxies(config: AIConfig): {
  setProvider: OmitThisParameter<typeof config.setProvider>;
  setApiKey: OmitThisParameter<typeof config.setApiKey>;
  setModel: OmitThisParameter<typeof config.setModel>;
  setUseSunoTags: OmitThisParameter<typeof config.setUseSunoTags>;
  setDebugMode: OmitThisParameter<typeof config.setDebugMode>;
  setMaxMode: OmitThisParameter<typeof config.setMaxMode>;
  setLyricsMode: OmitThisParameter<typeof config.setLyricsMode>;
  setStoryMode: OmitThisParameter<typeof config.setStoryMode>;
  setUseLocalLLM: OmitThisParameter<typeof config.setUseLocalLLM>;
  initialize: OmitThisParameter<typeof config.initialize>;
  isDebugMode: OmitThisParameter<typeof config.isDebugMode>;
  isUseLocalLLM: OmitThisParameter<typeof config.isUseLocalLLM>;
  setOllamaEndpoint: OmitThisParameter<typeof config.setOllamaEndpoint>;
  setOllamaTemperature: OmitThisParameter<typeof config.setOllamaTemperature>;
  setOllamaMaxTokens: OmitThisParameter<typeof config.setOllamaMaxTokens>;
  setOllamaContextLength: OmitThisParameter<typeof config.setOllamaContextLength>;
  getOllamaConfig: OmitThisParameter<typeof config.getOllamaConfig>;
  getModel: () => LanguageModel;
} {
  return {
    // Provider configuration
    setProvider: config.setProvider.bind(config),
    setApiKey: config.setApiKey.bind(config),
    setModel: config.setModel.bind(config),
    setUseSunoTags: config.setUseSunoTags.bind(config),
    setDebugMode: config.setDebugMode.bind(config),
    setMaxMode: config.setMaxMode.bind(config),
    setLyricsMode: config.setLyricsMode.bind(config),
    setStoryMode: config.setStoryMode.bind(config),
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
     * Get the cloud language model.
     * Note: When useLocalLLM is true, callers should pass ollamaEndpoint
     * to callLLM() which routes to the direct HTTP client instead.
     */
    getModel: config.getModel.bind(config),
  };
}

export type ConfigProxies = ReturnType<typeof createConfigProxies>;
