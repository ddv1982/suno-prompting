import type { AIProvider, AppConfig, OllamaConfig } from '@shared/types';
import type { LanguageModel } from 'ai';

export interface AIRequestConfig {
  readonly provider: AIProvider;
  readonly model: string;
  readonly useSunoTags: boolean;
  readonly debugMode: boolean;
  readonly maxMode: boolean;
  readonly lyricsMode: boolean;
  readonly storyMode: boolean;
  readonly useLocalLLM: boolean;
  readonly ollamaConfig: OllamaConfig;
  readonly apiKeys: AppConfig['apiKeys'];
}

export interface GenerationPolicySnapshot {
  readonly canUseCloud: boolean;
  readonly canUseLocal: boolean;
  readonly llmAvailable: boolean;
  readonly ollamaEndpoint?: string;
}

export interface GenerationRequestConfig extends AIRequestConfig {
  readonly policy: GenerationPolicySnapshot;
  readonly getModel: () => LanguageModel;
  readonly getModelName: () => string;
  readonly getProvider: () => AIProvider;
  readonly isDebugMode: () => boolean;
  readonly isMaxMode: () => boolean;
  readonly isLyricsMode: () => boolean;
  readonly isStoryMode: () => boolean;
  readonly isUseLocalLLM: () => boolean;
  readonly isLLMAvailable: () => boolean;
  readonly getUseSunoTags: () => boolean;
  readonly getOllamaEndpoint: () => string;
  readonly getOllamaEndpointIfLocal: () => string | undefined;
}
