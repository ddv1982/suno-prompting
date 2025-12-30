import { createGroq } from '@ai-sdk/groq';
import { createOpenAI } from '@ai-sdk/openai';
import { createAnthropic } from '@ai-sdk/anthropic';
import { type LanguageModel } from 'ai';
import { APP_CONSTANTS } from '@shared/constants';
import type { AppConfig, AIProvider, APIKeys } from '@shared/types';

export class AIConfig {
  private provider: AIProvider = APP_CONSTANTS.AI.DEFAULT_PROVIDER;
  private apiKeys: APIKeys = { groq: null, openai: null, anthropic: null };
  private model: string = APP_CONSTANTS.AI.DEFAULT_MODEL;
  private useSunoTags: boolean = APP_CONSTANTS.AI.DEFAULT_USE_SUNO_TAGS;
  private debugMode: boolean = APP_CONSTANTS.AI.DEFAULT_DEBUG_MODE;
  private maxMode: boolean = APP_CONSTANTS.AI.DEFAULT_MAX_MODE;
  private lyricsMode: boolean = APP_CONSTANTS.AI.DEFAULT_LYRICS_MODE;

  setProvider(provider: AIProvider) {
    this.provider = provider;
  }

  setApiKey(provider: AIProvider, key: string) {
    this.apiKeys[provider] = key;
  }

  setModel(model: string) {
    this.model = model;
  }

  setUseSunoTags(value: boolean) {
    this.useSunoTags = value;
  }

  setDebugMode(value: boolean) {
    this.debugMode = value;
  }

  setMaxMode(value: boolean) {
    this.maxMode = value;
  }

  setLyricsMode(value: boolean) {
    this.lyricsMode = value;
  }

  initialize(config: Partial<AppConfig>) {
    if (config.provider) this.provider = config.provider;
    if (config.apiKeys) this.apiKeys = { ...this.apiKeys, ...config.apiKeys };
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
    switch (this.provider) {
      case 'openai':
        return createOpenAI({ apiKey: this.apiKeys.openai || process.env.OPENAI_API_KEY })(this.model) as unknown as LanguageModel;
      case 'anthropic':
        return createAnthropic({ apiKey: this.apiKeys.anthropic || process.env.ANTHROPIC_API_KEY })(this.model) as unknown as LanguageModel;
      case 'groq':
      default:
        return createGroq({ apiKey: this.apiKeys.groq || process.env.GROQ_API_KEY })(this.model) as LanguageModel;
    }
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
