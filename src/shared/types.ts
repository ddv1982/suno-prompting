import { type RPCSchema } from 'electrobun';
import { type ValidationResult } from '@shared/validation';

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
    timestamp: string;
};

export type PromptSession = {
    id: string;
    originalInput: string;
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
    timestamp: string;
    requestBody: string;
    // Lyrics mode additional debug info
    titleGeneration?: {
        systemPrompt: string;
        userPrompt: string;
    };
    lyricsGeneration?: {
        systemPrompt: string;
        userPrompt: string;
    };
};

// Request/Response type definitions for RPC
export type GenerateInitialParams = { description: string; lockedPhrase?: string };
export type GenerateInitialResponse = { 
    prompt: string;
    title?: string;
    lyrics?: string;
    versionId: string; 
    validation: ValidationResult; 
    debugInfo?: DebugInfo;
};

export type RefinePromptParams = { currentPrompt: string; feedback: string; lockedPhrase?: string };
export type RefinePromptResponse = { prompt: string; versionId: string; validation: ValidationResult; debugInfo?: DebugInfo };

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

export type SetDebugModeParams = { debugMode: boolean };

export type SaveAllSettingsParams = {
    apiKey: string;
    model: string;
    useSunoTags: boolean;
    debugMode: boolean;
    maxMode: boolean;
    lyricsMode: boolean;
};

export type GetAllSettingsResponse = {
    apiKey: string | null;
    model: string;
    useSunoTags: boolean;
    debugMode: boolean;
    maxMode: boolean;
    lyricsMode: boolean;
};

export type GetHistoryResponse = { sessions: PromptSession[] };
export type SaveSessionParams = { session: PromptSession };
export type DeleteSessionParams = { id: string };
export type SetApiKeyParams = { apiKey: string };
export type SetModelParams = { model: string };
export type SetSunoTagsParams = { useSunoTags: boolean };
export type SetMaxModeParams = { maxMode: boolean };
export type SetLyricsModeParams = { lyricsMode: boolean };

export type AppConfig = {
    apiKey: string | null;
    model: string;
    useSunoTags: boolean;
    debugMode: boolean;
    maxMode: boolean;
    lyricsMode: boolean;
};

// Handler function types for backend implementation
export type RPCHandlers = {
    generateInitial: (params: GenerateInitialParams) => Promise<GenerateInitialResponse>;
    refinePrompt: (params: RefinePromptParams) => Promise<RefinePromptResponse>;
    remixInstruments: (params: RemixInstrumentsParams) => Promise<RemixInstrumentsResponse>;
    remixGenre: (params: RemixGenreParams) => Promise<RemixGenreResponse>;
    remixMood: (params: RemixMoodParams) => Promise<RemixMoodResponse>;
    remixStyleTags: (params: RemixStyleTagsParams) => Promise<RemixStyleTagsResponse>;
    remixRecording: (params: RemixRecordingParams) => Promise<RemixRecordingResponse>;
    getHistory: (params: Record<string, never>) => Promise<GetHistoryResponse>;
    saveSession: (params: SaveSessionParams) => Promise<{ success: boolean }>;
    deleteSession: (params: DeleteSessionParams) => Promise<{ success: boolean }>;
    getApiKey: (params: Record<string, never>) => Promise<{ apiKey: string | null }>;
    setApiKey: (params: SetApiKeyParams) => Promise<{ success: boolean }>;
    getModel: (params: Record<string, never>) => Promise<{ model: string }>;
    setModel: (params: SetModelParams) => Promise<{ success: boolean }>;
    getSunoTags: (params: Record<string, never>) => Promise<{ useSunoTags: boolean }>;
    setSunoTags: (params: SetSunoTagsParams) => Promise<{ success: boolean }>;
    getDebugMode: (params: Record<string, never>) => Promise<{ debugMode: boolean }>;
    setDebugMode: (params: SetDebugModeParams) => Promise<{ success: boolean }>;
    getMaxMode: (params: Record<string, never>) => Promise<{ maxMode: boolean }>;
    setMaxMode: (params: SetMaxModeParams) => Promise<{ success: boolean }>;
    getLyricsMode: (params: Record<string, never>) => Promise<{ lyricsMode: boolean }>;
    setLyricsMode: (params: SetLyricsModeParams) => Promise<{ success: boolean }>;
    getAllSettings: (params: Record<string, never>) => Promise<GetAllSettingsResponse>;
    saveAllSettings: (params: SaveAllSettingsParams) => Promise<{ success: boolean }>;
};

export type SunoRPCSchema = {
    bun: RPCSchema<{
        requests: {
            generateInitial: {
                params: GenerateInitialParams;
                response: GenerateInitialResponse;
            };
            refinePrompt: {
                params: RefinePromptParams;
                response: RefinePromptResponse;
            };
            remixInstruments: {
                params: RemixInstrumentsParams;
                response: RemixInstrumentsResponse;
            };
            remixGenre: {
                params: RemixGenreParams;
                response: RemixGenreResponse;
            };
            remixMood: {
                params: RemixMoodParams;
                response: RemixMoodResponse;
            };
            remixStyleTags: {
                params: RemixStyleTagsParams;
                response: RemixStyleTagsResponse;
            };
            remixRecording: {
                params: RemixRecordingParams;
                response: RemixRecordingResponse;
            };
            getHistory: {
                params: Record<string, never>;
                response: GetHistoryResponse;
            };
            saveSession: {
                params: SaveSessionParams;
                response: { success: boolean };
            };
            deleteSession: {
                params: DeleteSessionParams;
                response: { success: boolean };
            };
            getApiKey: {
                params: Record<string, never>;
                response: { apiKey: string | null };
            };
            setApiKey: {
                params: SetApiKeyParams;
                response: { success: boolean };
            };
            getModel: {
                params: Record<string, never>;
                response: { model: string };
            };
            setModel: {
                params: SetModelParams;
                response: { success: boolean };
            };
            getSunoTags: {
                params: Record<string, never>;
                response: { useSunoTags: boolean };
            };
            setSunoTags: {
                params: SetSunoTagsParams;
                response: { success: boolean };
            };
            getDebugMode: {
                params: Record<string, never>;
                response: { debugMode: boolean };
            };
            setDebugMode: {
                params: SetDebugModeParams;
                response: { success: boolean };
            };
            getMaxMode: {
                params: Record<string, never>;
                response: { maxMode: boolean };
            };
            setMaxMode: {
                params: SetMaxModeParams;
                response: { success: boolean };
            };
            getLyricsMode: {
                params: Record<string, never>;
                response: { lyricsMode: boolean };
            };
            setLyricsMode: {
                params: SetLyricsModeParams;
                response: { success: boolean };
            };
            getAllSettings: {
                params: Record<string, never>;
                response: GetAllSettingsResponse;
            };
            saveAllSettings: {
                params: SaveAllSettingsParams;
                response: { success: boolean };
            };
        };
        messages: Record<string, never>;
    }>;
    webview: RPCSchema<{
        requests: Record<string, never>;
        messages: Record<string, never>;
    }>;
};
