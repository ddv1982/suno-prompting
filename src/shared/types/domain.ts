// Domain types - core business entities

import type { AIProvider } from '@shared/types/config';

// Prompt generation mode
export type PromptMode = 'full' | 'quickVibes' | 'creativeBoost';

// Creativity level for Creative Boost slider
export type CreativityLevel = 'low' | 'safe' | 'normal' | 'adventurous' | 'high';

// Valid slider positions for creativity (5 discrete values)
export type CreativitySliderValue = 0 | 25 | 50 | 75 | 100;

// Quick Vibes category presets
export type QuickVibesCategory = 
  | 'lofi-study'
  | 'cafe-coffeeshop'
  | 'ambient-focus'
  | 'latenight-chill'
  | 'cozy-rainy'
  | 'lofi-chill';

// Quick Vibes input state
export type QuickVibesInput = {
  category: QuickVibesCategory | null;
  customDescription: string;
  withWordlessVocals: boolean;
  /** 0-4 Suno V5 style keys (mutually exclusive with category) */
  sunoStyles: string[];
};

// Creative Boost input state
// Note: maxMode and lyricsMode are handled by global SettingsContext (same as Quick Vibes)
export type CreativeBoostInput = {
  creativityLevel: CreativitySliderValue;  // 5 discrete positions: 0, 25, 50, 75, 100
  seedGenres: string[];                    // 0-4 genre keys (from registry or combinations)
  /** 0-4 Suno V5 style keys (mutually exclusive with seedGenres) */
  sunoStyles: string[];
  description: string;                     // Optional text description
  lyricsTopic: string;                     // Topic for lyrics (when lyrics enabled)
  withWordlessVocals: boolean;             // Humming, oohs
};

export const EMPTY_CREATIVE_BOOST_INPUT: CreativeBoostInput = {
  creativityLevel: 50,
  seedGenres: [],
  sunoStyles: [],
  description: '',
  lyricsTopic: '',
  withWordlessVocals: false,
};

// Editor mode types
export type EditorMode = 'simple' | 'advanced';

export type AdvancedSelection = {
  harmonicStyle: string | null;
  harmonicCombination: string | null;
  polyrhythmCombination: string | null;
  timeSignature: string | null;
  timeSignatureJourney: string | null;
  singleGenre: string | null;
  genreCombination: string | null;
};

export const EMPTY_ADVANCED_SELECTION: AdvancedSelection = {
  harmonicStyle: null,
  harmonicCombination: null,
  polyrhythmCombination: null,
  timeSignature: null,
  timeSignatureJourney: null,
  singleGenre: null,
  genreCombination: null,
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
  // Mode-specific fields
  promptMode?: PromptMode;
  quickVibesInput?: QuickVibesInput;
  creativeBoostInput?: CreativeBoostInput;
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
  maxConversion?: {
    systemPrompt?: string;
    userPrompt?: string;
    timestamp?: string;
  };
};
