// Domain types - core business entities

import type { AIProvider } from '@shared/types/config';

// Editor mode types
export type EditorMode = 'simple' | 'advanced';

export type AdvancedSelection = {
  harmonicStyle: string | null;
  harmonicCombination: string | null;
  polyrhythmCombination: string | null;
  timeSignature: string | null;
  timeSignatureJourney: string | null;
};

export const EMPTY_ADVANCED_SELECTION: AdvancedSelection = {
  harmonicStyle: null,
  harmonicCombination: null,
  polyrhythmCombination: null,
  timeSignature: null,
  timeSignatureJourney: null,
};

export type PromptVersion = {
  id: string;
  content: string;
  title?: string;
  lyrics?: string;
  feedback?: string;
  lockedPhrase?: string;
  timestamp: string;
};

export type PromptSession = {
  id: string;
  originalInput: string;
  lyricsTopic?: string;
  currentPrompt: string;
  currentTitle?: string;
  currentLyrics?: string;
  versionHistory: PromptVersion[];
  createdAt: string;
  updatedAt: string;
};

export type DebugInfo = {
  systemPrompt: string;
  userPrompt: string;
  model: string;
  provider: AIProvider;
  timestamp: string;
  requestBody: string;
  responseBody: string;
  titleGeneration?: {
    systemPrompt: string;
    userPrompt: string;
  };
  lyricsGeneration?: {
    systemPrompt: string;
    userPrompt: string;
  };
};
