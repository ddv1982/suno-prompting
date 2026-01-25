// API Request/Response types

import type { MoodCategory } from '@bun/mood';
import type { AIProvider, APIKeys } from '@shared/types/config';
import type { PromptSession, PromptMode, QuickVibesCategory, CreativeBoostMode } from '@shared/types/domain';
import type { TraceRun } from '@shared/types/trace';
import type { ValidationResult } from '@shared/validation';

// Generation endpoints
export interface GenerateInitialParams { 
  description: string; 
  lockedPhrase?: string; 
  lyricsTopic?: string;
  genreOverride?: string;
  /** Suno V5 styles for Direct Mode (mutually exclusive with genreOverride) */
  sunoStyles?: string[];
}
export interface GenerateInitialResponse { 
  prompt: string;
  title?: string;
  lyrics?: string;
  versionId: string; 
  validation: ValidationResult; 
  debugTrace?: TraceRun;
  /** Flag indicating Story Mode fell back to deterministic output */
  storyModeFallback?: boolean;
}

export interface RefinePromptParams { 
  currentPrompt: string; 
  /** Feedback text for lyrics refinement (optional for style-only refinement) */
  feedback?: string; 
  lockedPhrase?: string; 
  currentTitle?: string; 
  currentLyrics?: string;
  lyricsTopic?: string;
  genreOverride?: string;
  /** Suno V5 styles for Direct Mode (mutually exclusive with genreOverride) */
  sunoStyles?: string[];
  /** Type of refinement to perform (auto-detected by frontend, defaults to 'combined') */
  refinementType?: 'style' | 'lyrics' | 'combined';
  /** Style changes to apply (for 'style' or 'combined' refinement types) */
  styleChanges?: {
    seedGenres?: string[];
    sunoStyles?: string[];
    bpm?: number;
    instruments?: string[];
    mood?: string[];
    /** Changed harmonic style */
    harmonicStyle?: string | null;
    /** Changed harmonic combination */
    harmonicCombination?: string | null;
    /** Changed polyrhythm combination */
    polyrhythmCombination?: string | null;
    /** Changed time signature */
    timeSignature?: string | null;
    /** Changed time signature journey */
    timeSignatureJourney?: string | null;
    /** Changed mood category */
    moodCategory?: string | null;
  };
}
export interface RefinePromptResponse { 
  prompt: string; 
  title?: string; 
  lyrics?: string; 
  versionId: string; 
  validation: ValidationResult; 
  debugTrace?: TraceRun;
}

// Remix endpoints
export interface RemixInstrumentsParams { currentPrompt: string; originalInput: string }
export interface RemixInstrumentsResponse { prompt: string; versionId: string; validation: ValidationResult; debugTrace?: TraceRun }

export interface RemixGenreParams { currentPrompt: string }
export interface RemixGenreResponse { prompt: string; versionId: string; validation: ValidationResult; debugTrace?: TraceRun }

export interface RemixMoodParams { currentPrompt: string }
export interface RemixMoodResponse { prompt: string; versionId: string; validation: ValidationResult; debugTrace?: TraceRun }

export interface RemixStyleTagsParams { currentPrompt: string }
export interface RemixStyleTagsResponse { prompt: string; versionId: string; validation: ValidationResult; debugTrace?: TraceRun }

export interface RemixRecordingParams { currentPrompt: string }
export interface RemixRecordingResponse { prompt: string; versionId: string; validation: ValidationResult; debugTrace?: TraceRun }

export interface RemixTitleParams { currentPrompt: string; originalInput: string; currentLyrics?: string }
export interface RemixTitleResponse { title: string; debugTrace?: TraceRun }

export interface RemixLyricsParams { currentPrompt: string; originalInput: string; lyricsTopic?: string }
export interface RemixLyricsResponse { lyrics: string }

// Settings endpoints
export interface SetDebugModeParams { debugMode: boolean }

export interface SaveAllSettingsParams {
  provider: AIProvider;
  apiKeys: APIKeys;
  model: string;
  useSunoTags: boolean;
  debugMode: boolean;
  maxMode: boolean;
  lyricsMode: boolean;
  storyMode: boolean;
  useLocalLLM?: boolean; // Optional for backwards compatibility
}

export interface GetAllSettingsResponse {
  provider: AIProvider;
  apiKeys: APIKeys;
  model: string;
  useSunoTags: boolean;
  debugMode: boolean;
  maxMode: boolean;
  lyricsMode: boolean;
  storyMode: boolean;
  useLocalLLM: boolean;
}

// Session endpoints
export interface GetHistoryResponse { sessions: PromptSession[] }
export interface SaveSessionParams { session: PromptSession }
export interface DeleteSessionParams { id: string }

// Simple settings endpoints
export interface SetApiKeyParams { apiKey: string }
export interface SetModelParams { model: string }
export interface SetSunoTagsParams { useSunoTags: boolean }
export interface SetMaxModeParams { maxMode: boolean }
export interface SetLyricsModeParams { lyricsMode: boolean }
export interface SetStoryModeParams { storyMode: boolean }
export interface SetUseLocalLLMParams { useLocalLLM: boolean }

// Quick Vibes endpoints
export interface GetPromptModeResponse { promptMode: PromptMode }
export interface SetPromptModeParams { promptMode: PromptMode }
export interface SetPromptModeResponse { success: boolean }

// Creative Boost Mode endpoints
export interface GetCreativeBoostModeResponse { creativeBoostMode: CreativeBoostMode }
export interface SetCreativeBoostModeParams { creativeBoostMode: CreativeBoostMode }
export interface SetCreativeBoostModeResponse { success: boolean }

export interface GenerateQuickVibesParams {
  category: QuickVibesCategory | null;
  customDescription: string;
  withWordlessVocals: boolean;
  /** Suno V5 styles (0-4 selections, mutually exclusive with category) */
  sunoStyles: string[];
  /** Optional mood category to influence prompt generation */
  moodCategory?: MoodCategory | null;
}

export interface GenerateQuickVibesResponse {
  prompt: string;
  title?: string;
  versionId: string;
  debugTrace?: TraceRun;
  /** Flag indicating Story Mode fell back to deterministic output */
  storyModeFallback?: boolean;
}

export interface RefineQuickVibesParams {
  currentPrompt: string;
  currentTitle?: string;
  description?: string;
  feedback: string;
  withWordlessVocals: boolean;
  category?: QuickVibesCategory | null;
  /** Suno V5 styles (0-4 selections, mutually exclusive with category) */
  sunoStyles?: string[];
}

export interface RefineQuickVibesResponse {
  prompt: string;
  title?: string;
  versionId: string;
  debugTrace?: TraceRun;
}

// Max Mode Format Conversion
export interface ConvertToMaxFormatParams { text: string }
export interface ConvertToMaxFormatResponse {
  convertedPrompt: string;
  wasConverted: boolean;
  versionId: string;
  debugTrace?: TraceRun;
}

// Creative Boost endpoints
export interface GenerateCreativeBoostParams {
  creativityLevel: number;
  seedGenres: string[];
  /** Suno V5 styles (0-4 selections, mutually exclusive with seedGenres) */
  sunoStyles: string[];
  description: string;
  lyricsTopic: string;
  withWordlessVocals: boolean;
  maxMode: boolean;
  withLyrics: boolean;
}

export interface GenerateCreativeBoostResponse {
  prompt: string;              // Full style/genre description
  title: string;               // Generated title
  lyrics?: string;             // Generated lyrics (when withLyrics: true)
  versionId: string;
  debugTrace?: TraceRun;
  /** Flag indicating Story Mode fell back to deterministic output */
  storyModeFallback?: boolean;
}

export interface RefineCreativeBoostParams {
  currentPrompt: string;
  currentTitle: string;
  currentLyrics?: string;
  feedback: string;
  lyricsTopic: string;
  description: string;
  seedGenres: string[];
  /** Suno V5 styles (0-4 selections, mutually exclusive with seedGenres) */
  sunoStyles: string[];
  withWordlessVocals: boolean;
  maxMode: boolean;
  withLyrics: boolean;
  /** Optional genre count enforcement for non-Direct Mode refinement. */
  targetGenreCount?: number;
}

export interface RefineCreativeBoostResponse {
  prompt: string;
  title: string;
  lyrics?: string;
  versionId: string;
  debugTrace?: TraceRun;
}

// Ollama endpoints
/** Response from checking Ollama server status */
export interface CheckOllamaStatusResponse {
  /** Whether Ollama server is reachable */
  available: boolean;
  /** Whether Gemma 3 4B model is installed */
  hasGemma: boolean;
  /** Current Ollama endpoint URL */
  endpoint: string;
}

/** Response from getting Ollama settings */
export interface OllamaSettingsResponse {
  endpoint: string;
  temperature: number;
  maxTokens: number;
  contextLength: number;
}

/** Parameters for setting Ollama configuration */
export interface SetOllamaSettingsParams {
  endpoint?: string;
  temperature?: number;
  maxTokens?: number;
  contextLength?: number;
}

/** Response from checking LLM availability */
export interface CheckLLMAvailabilityResponse {
  /** Whether the LLM is available for generation */
  available: boolean;
  /** Reason why LLM is unavailable (null when available) */
  reason: 'no_api_key' | 'ollama_offline' | 'model_missing' | null;
}
