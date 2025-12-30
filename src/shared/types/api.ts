// API Request/Response types

import type { ValidationResult } from '@shared/validation';
import type { AIProvider, APIKeys } from '@shared/types/config';
import type { PromptSession, DebugInfo, PromptMode, QuickVibesCategory } from '@shared/types/domain';

// Generation endpoints
export type GenerateInitialParams = { description: string; lockedPhrase?: string; lyricsTopic?: string };
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

export type GenerateQuickVibesParams = {
  category: QuickVibesCategory | null;
  customDescription: string;
  withWordlessVocals: boolean;
};

export type GenerateQuickVibesResponse = {
  prompt: string;
  versionId: string;
  debugInfo?: DebugInfo;
};

export type RefineQuickVibesParams = {
  currentPrompt: string;
  feedback: string;
  withWordlessVocals: boolean;
  category?: QuickVibesCategory | null;
};

export type RefineQuickVibesResponse = {
  prompt: string;
  versionId: string;
  debugInfo?: DebugInfo;
};
