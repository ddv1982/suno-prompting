import { createAnthropic } from '@ai-sdk/anthropic';
import { createGroq } from '@ai-sdk/groq';
import { createOpenAI } from '@ai-sdk/openai';
import { createProviderRegistry, type LanguageModel } from 'ai';

import { APP_CONSTANTS } from '@shared/constants';

import type { AppConfig, AIProvider, APIKeys } from '@shared/types';

type ProviderRegistry = ReturnType<typeof createProviderRegistry>;

export class AIConfig {
  private provider: AIProvider = APP_CONSTANTS.AI.DEFAULT_PROVIDER;
  private apiKeys: APIKeys = { groq: null, openai: null, anthropic: null };
  private model: string = APP_CONSTANTS.AI.DEFAULT_MODEL;
  private useSunoTags: boolean = APP_CONSTANTS.AI.DEFAULT_USE_SUNO_TAGS;
  private debugMode: boolean = APP_CONSTANTS.AI.DEFAULT_DEBUG_MODE;
  private maxMode: boolean = APP_CONSTANTS.AI.DEFAULT_MAX_MODE;
  private lyricsMode: boolean = APP_CONSTANTS.AI.DEFAULT_LYRICS_MODE;
  private registry: ProviderRegistry | null = null;

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

  getUseSunoTags(): boolean {
    return this.useSunoTags;
  }
}
