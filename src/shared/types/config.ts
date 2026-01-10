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

/** Ollama local LLM configuration */
export type OllamaConfig = {
  /** Ollama server endpoint URL */
  endpoint: string;
  /** Temperature for generation (0-1) */
  temperature: number;
  /** Maximum tokens to generate */
  maxTokens: number;
  /** Context window length */
  contextLength: number;
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
  /** Whether to use Ollama local LLM instead of cloud providers */
  useLocalLLM: boolean;
  promptMode: PromptMode;
  creativeBoostMode: CreativeBoostMode;
  /** Optional Ollama configuration for local LLM */
  ollamaConfig?: OllamaConfig;
  /** Ollama model name for local LLM (e.g., 'gemma3:4b') */
  ollamaModel?: string;
};
