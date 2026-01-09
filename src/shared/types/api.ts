// API Request/Response types

import type { AIProvider, APIKeys } from '@shared/types/config';
import type { PromptSession, DebugInfo, PromptMode, QuickVibesCategory, CreativeBoostMode } from '@shared/types/domain';
import type { ValidationResult } from '@shared/validation';

// Generation endpoints
export type GenerateInitialParams = { 
  description: string; 
  lockedPhrase?: string; 
  lyricsTopic?: string;
  genreOverride?: string;
};
export type GenerateInitialResponse = { 
  prompt: string;
  title?: string;
  lyrics?: string;
  versionId: string; 
  validation: ValidationResult; 
  debugInfo?: DebugInfo;
};

export type RefinePromptParams = { 
  currentPrompt: string; 
  feedback: string; 
  lockedPhrase?: string; 
  currentTitle?: string; 
  currentLyrics?: string;
  lyricsTopic?: string;
  genreOverride?: string;
};
export type RefinePromptResponse = { 
  prompt: string; 
  title?: string; 
  lyrics?: string; 
  versionId: string; 
  validation: ValidationResult; 
  debugInfo?: DebugInfo;
};

// Remix endpoints
export type RemixInstrumentsParams = { currentPrompt: string; originalInput: string };
export type RemixInstrumentsResponse = { prompt: string; versionId: string; validation: ValidationResult };

export type RemixGenreParams = { currentPrompt: string };
export type RemixGenreResponse = { prompt: string; versionId: string; validation: ValidationResult };

export type RemixMoodParams = { currentPrompt: string };
export type RemixMoodResponse = { prompt: string; versionId: string; validation: ValidationResult };

export type RemixStyleTagsParams = { currentPrompt: string };
export type RemixStyleTagsResponse = { prompt: string; versionId: string; validation: ValidationResult };

export type RemixRecordingParams = { currentPrompt: string };
export type RemixRecordingResponse = { prompt: string; versionId: string; validation: ValidationResult };

export type RemixTitleParams = { currentPrompt: string; originalInput: string };
export type RemixTitleResponse = { title: string };

export type RemixLyricsParams = { currentPrompt: string; originalInput: string; lyricsTopic?: string };
export type RemixLyricsResponse = { lyrics: string };

// Settings endpoints
export type SetDebugModeParams = { debugMode: boolean };

export type SaveAllSettingsParams = {
  provider: AIProvider;
  apiKeys: APIKeys;
  model: string;
  useSunoTags: boolean;
  debugMode: boolean;
  maxMode: boolean;
  lyricsMode: boolean;
};

export type GetAllSettingsResponse = {
  provider: AIProvider;
  apiKeys: APIKeys;
  model: string;
  useSunoTags: boolean;
  debugMode: boolean;
  maxMode: boolean;
  lyricsMode: boolean;
};

// Session endpoints
export type GetHistoryResponse = { sessions: PromptSession[] };
export type SaveSessionParams = { session: PromptSession };
export type DeleteSessionParams = { id: string };

// Simple settings endpoints
export type SetApiKeyParams = { apiKey: string };
export type SetModelParams = { model: string };
export type SetSunoTagsParams = { useSunoTags: boolean };
export type SetMaxModeParams = { maxMode: boolean };
export type SetLyricsModeParams = { lyricsMode: boolean };

// Quick Vibes endpoints
export type GetPromptModeResponse = { promptMode: PromptMode };
export type SetPromptModeParams = { promptMode: PromptMode };
export type SetPromptModeResponse = { success: boolean };

// Creative Boost Mode endpoints
export type GetCreativeBoostModeResponse = { creativeBoostMode: CreativeBoostMode };
export type SetCreativeBoostModeParams = { creativeBoostMode: CreativeBoostMode };
export type SetCreativeBoostModeResponse = { success: boolean };

export type GenerateQuickVibesParams = {
  category: QuickVibesCategory | null;
  customDescription: string;
  withWordlessVocals: boolean;
  /** Suno V5 styles (0-4 selections, mutually exclusive with category) */
  sunoStyles: string[];
};

export type GenerateQuickVibesResponse = {
  prompt: string;
  title?: string;
  versionId: string;
  debugInfo?: DebugInfo;
};

export type RefineQuickVibesParams = {
  currentPrompt: string;
  currentTitle?: string;
  description?: string;
  feedback: string;
  withWordlessVocals: boolean;
  category?: QuickVibesCategory | null;
  /** Suno V5 styles (0-4 selections, mutually exclusive with category) */
  sunoStyles?: string[];
};

export type RefineQuickVibesResponse = {
  prompt: string;
  title?: string;
  versionId: string;
  debugInfo?: DebugInfo;
};

// Max Mode Format Conversion
export type ConvertToMaxFormatParams = { text: string };
export type ConvertToMaxFormatResponse = {
  convertedPrompt: string;
  wasConverted: boolean;
  versionId: string;
  debugInfo?: Partial<DebugInfo>;
};

// Creative Boost endpoints
export type GenerateCreativeBoostParams = {
  creativityLevel: number;
  seedGenres: string[];
  /** Suno V5 styles (0-4 selections, mutually exclusive with seedGenres) */
  sunoStyles: string[];
  description: string;
  lyricsTopic: string;
  withWordlessVocals: boolean;
  maxMode: boolean;
  withLyrics: boolean;
};

export type GenerateCreativeBoostResponse = {
  prompt: string;              // Full style/genre description
  title: string;               // Generated title
  lyrics?: string;             // Generated lyrics (when withLyrics: true)
  versionId: string;
  debugInfo?: DebugInfo;
};

export type RefineCreativeBoostParams = {
  currentPrompt: string;
  currentTitle: string;
  feedback: string;
  lyricsTopic: string;
  description: string;
  seedGenres: string[];
  /** Suno V5 styles (0-4 selections, mutually exclusive with seedGenres) */
  sunoStyles: string[];
  withWordlessVocals: boolean;
  maxMode: boolean;
  withLyrics: boolean;
};

export type RefineCreativeBoostResponse = {
  prompt: string;
  title: string;
  lyrics?: string;
  versionId: string;
  debugInfo?: DebugInfo;
};

// Ollama endpoints
/** Response from checking Ollama server status */
export type CheckOllamaStatusResponse = {
  /** Whether Ollama server is reachable */
  available: boolean;
  /** Whether Gemma 3 4B model is installed */
  hasGemma: boolean;
  /** Current Ollama endpoint URL */
  endpoint: string;
};

/** Response from getting Ollama settings */
export type OllamaSettingsResponse = {
  endpoint: string;
  temperature: number;
  maxTokens: number;
  contextLength: number;
};

/** Parameters for setting Ollama configuration */
export type SetOllamaSettingsParams = {
  endpoint?: string;
  temperature?: number;
  maxTokens?: number;
  contextLength?: number;
};
