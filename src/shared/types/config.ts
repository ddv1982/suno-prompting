// AI Provider and Configuration types

export type AIProvider = 'groq' | 'openai' | 'anthropic';

export type APIKeys = {
  groq: string | null;
  openai: string | null;
  anthropic: string | null;
};

export const DEFAULT_API_KEYS: APIKeys = {
  groq: null,
  openai: null,
  anthropic: null,
};

import type { PromptMode, CreativeBoostMode } from '@shared/types/domain';

export type AppConfig = {
  provider: AIProvider;
  apiKeys: APIKeys;
  model: string;
  useSunoTags: boolean;
  debugMode: boolean;
  maxMode: boolean;
  lyricsMode: boolean;
  promptMode: PromptMode;
  creativeBoostMode: CreativeBoostMode;
};
