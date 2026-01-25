import { createAnthropic } from '@ai-sdk/anthropic';
import { createGroq } from '@ai-sdk/groq';
import { createOpenAI } from '@ai-sdk/openai';
import { createProviderRegistry, type LanguageModel } from 'ai';

import { APP_CONSTANTS } from '@shared/constants';

import { DEFAULT_OLLAMA_CONFIG } from './ollama-provider';

import type { AppConfig, AIProvider, APIKeys, OllamaConfig } from '@shared/types';

type ProviderRegistry = ReturnType<typeof createProviderRegistry>;

export class AIConfig {
  private provider: AIProvider = APP_CONSTANTS.AI.DEFAULT_PROVIDER;
  private apiKeys: APIKeys = { groq: null, openai: null, anthropic: null };
  private model: string = APP_CONSTANTS.AI.DEFAULT_MODEL;
  private useSunoTags: boolean = APP_CONSTANTS.AI.DEFAULT_USE_SUNO_TAGS;
  private debugMode: boolean = APP_CONSTANTS.AI.DEFAULT_DEBUG_MODE;
  private maxMode: boolean = APP_CONSTANTS.AI.DEFAULT_MAX_MODE;
  private lyricsMode: boolean = APP_CONSTANTS.AI.DEFAULT_LYRICS_MODE;
  private storyMode: boolean = APP_CONSTANTS.AI.DEFAULT_STORY_MODE;
  private useLocalLLM = false; // Default to false, will be set to true if no API keys
  private registry: ProviderRegistry | null = null;
  private ollamaConfig: OllamaConfig = { ...DEFAULT_OLLAMA_CONFIG };

  private buildRegistry(): ProviderRegistry {
    this.registry = createProviderRegistry({
      openai: createOpenAI({ apiKey: this.apiKeys.openai ?? '' }),
      anthropic: createAnthropic({ apiKey: this.apiKeys.anthropic ?? '' }),
      groq: createGroq({ apiKey: this.apiKeys.groq ?? '' }),
    });
    return this.registry;
  }

  private invalidateRegistry(): void {
    this.registry = null;
  }

  setProvider(provider: AIProvider): void {
    this.provider = provider;
  }

  setApiKey(provider: AIProvider, key: string): void {
    this.apiKeys[provider] = key;
    this.invalidateRegistry();
  }

  setModel(model: string): void {
    this.model = model;
  }

  setUseSunoTags(value: boolean): void {
    this.useSunoTags = value;
  }

  setDebugMode(value: boolean): void {
    this.debugMode = value;
  }

  setMaxMode(value: boolean): void {
    this.maxMode = value;
  }

  setLyricsMode(value: boolean): void {
    this.lyricsMode = value;
  }

  setStoryMode(value: boolean): void {
    this.storyMode = value;
  }

  setUseLocalLLM(value: boolean): void {
    this.useLocalLLM = value;
  }

  // Ollama configuration setters
  setOllamaEndpoint(endpoint: string): void {
    this.ollamaConfig.endpoint = endpoint;
  }

  setOllamaTemperature(temperature: number): void {
    this.ollamaConfig.temperature = temperature;
  }

  setOllamaMaxTokens(maxTokens: number): void {
    this.ollamaConfig.maxTokens = maxTokens;
  }

  setOllamaContextLength(contextLength: number): void {
    this.ollamaConfig.contextLength = contextLength;
  }

  initialize(config: Partial<AppConfig>): void {
    if (config.provider) this.provider = config.provider;
    if (config.apiKeys) {
      this.apiKeys = { ...this.apiKeys, ...config.apiKeys };
      this.invalidateRegistry();
    }
    if (config.model) this.model = config.model;
    if (config.useSunoTags !== undefined) this.useSunoTags = config.useSunoTags;
    if (config.debugMode !== undefined) this.debugMode = config.debugMode;
    if (config.maxMode !== undefined) this.maxMode = config.maxMode;
    if (config.lyricsMode !== undefined) this.lyricsMode = config.lyricsMode;
    if (config.storyMode !== undefined) this.storyMode = config.storyMode;
    
    // Smart default: use local LLM if no API keys are configured
    if (config.useLocalLLM !== undefined) {
      this.useLocalLLM = config.useLocalLLM;
    } else {
      // Auto-enable local LLM if no API keys exist
      const apiKeyValues = Object.values(this.apiKeys) as (string | null)[];
      const hasAnyKey = apiKeyValues.some((key): key is string => key !== null && key.trim() !== '');
      this.useLocalLLM = !hasAnyKey;
    }
    
    if (config.ollamaConfig) {
      this.ollamaConfig = { ...this.ollamaConfig, ...config.ollamaConfig };
    }
  }

  getProvider(): AIProvider {
    return this.provider;
  }

  getModel(): LanguageModel {
    const registry = this.registry ?? this.buildRegistry();
    return registry.languageModel(`${this.provider}:${this.model}`);
  }

  getModelName(): string {
    return this.model;
  }

  isDebugMode(): boolean {
    return this.debugMode;
  }

  isMaxMode(): boolean {
    return this.maxMode;
  }

  isLyricsMode(): boolean {
    return this.lyricsMode;
  }

  isStoryMode(): boolean {
    return this.storyMode;
  }

  isUseLocalLLM(): boolean {
    return this.useLocalLLM;
  }

  getOllamaEndpoint(): string {
    return this.ollamaConfig.endpoint;
  }

  getUseSunoTags(): boolean {
    return this.useSunoTags;
  }

  getOllamaConfig(): OllamaConfig {
    return { ...this.ollamaConfig };
  }

  /**
   * Check if any LLM is available for generation.
   * Returns true if local LLM is enabled OR at least one cloud API key is configured.
   */
  isLLMAvailable(): boolean {
    if (this.useLocalLLM) return true;
    const apiKeyValues = Object.values(this.apiKeys) as (string | null)[];
    return apiKeyValues.some((key): key is string => key !== null && key.trim() !== '');
  }

  /**
   * Get Ollama endpoint for LLM calls, or undefined if using cloud provider.
   * Centralizes the common pattern: useLocalLLM ? endpoint : undefined
   */
  getOllamaEndpointIfLocal(): string | undefined {
    return this.useLocalLLM ? this.ollamaConfig.endpoint : undefined;
  }
}
