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
    feedback?: string;
    timestamp: string;
};

export type PromptSession = {
    id: string;
    originalInput: string;
    currentPrompt: string;
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
};

// Request/Response type definitions for RPC
export type GenerateInitialParams = { description: string; lockedPhrase?: string };
export type GenerateInitialResponse = { prompt: string; versionId: string; validation: ValidationResult; debugInfo?: DebugInfo };

export type RefinePromptParams = { currentPrompt: string; feedback: string; lockedPhrase?: string };
export type RefinePromptResponse = { prompt: string; versionId: string; validation: ValidationResult; debugInfo?: DebugInfo };

export type RemixInstrumentsParams = { currentPrompt: string; originalInput: string };
export type RemixInstrumentsResponse = { prompt: string; versionId: string; validation: ValidationResult };

export type RemixGenreParams = { currentPrompt: string };
export type RemixGenreResponse = { prompt: string; versionId: string; validation: ValidationResult };

export type RemixMoodParams = { currentPrompt: string };
export type RemixMoodResponse = { prompt: string; versionId: string; validation: ValidationResult };

export type SetDebugModeParams = { debugMode: boolean };

export type SaveAllSettingsParams = {
    apiKey: string;
    model: string;
    useSunoTags: boolean;
    debugMode: boolean;
};

export type GetAllSettingsResponse = {
    apiKey: string | null;
    model: string;
    useSunoTags: boolean;
    debugMode: boolean;
};

export type GetHistoryResponse = { sessions: PromptSession[] };
export type SaveSessionParams = { session: PromptSession };
export type DeleteSessionParams = { id: string };
export type SetApiKeyParams = { apiKey: string };
export type SetModelParams = { model: string };
export type SetSunoTagsParams = { useSunoTags: boolean };

export type AppConfig = {
    apiKey: string | null;
    model: string;
    useSunoTags: boolean;
    debugMode: boolean;
};

// Handler function types for backend implementation
export type RPCHandlers = {
    generateInitial: (params: GenerateInitialParams) => Promise<GenerateInitialResponse>;
    refinePrompt: (params: RefinePromptParams) => Promise<RefinePromptResponse>;
    remixInstruments: (params: RemixInstrumentsParams) => Promise<RemixInstrumentsResponse>;
    remixGenre: (params: RemixGenreParams) => Promise<RemixGenreResponse>;
    remixMood: (params: RemixMoodParams) => Promise<RemixMoodResponse>;
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
