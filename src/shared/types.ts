import { type RPCSchema } from 'electrobun';
import { type ValidationResult } from './validation';

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

// Request/Response type definitions for RPC
export type GenerateInitialParams = { description: string };
export type GenerateInitialResponse = { prompt: string; versionId: string; validation: ValidationResult };

export type RefinePromptParams = { currentPrompt: string; feedback: string };
export type RefinePromptResponse = { prompt: string; versionId: string; validation: ValidationResult };

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
};

// Handler function types for backend implementation
export type RPCHandlers = {
    generateInitial: (params: GenerateInitialParams) => Promise<GenerateInitialResponse>;
    refinePrompt: (params: RefinePromptParams) => Promise<RefinePromptResponse>;
    getHistory: (params: Record<string, never>) => Promise<GetHistoryResponse>;
    saveSession: (params: SaveSessionParams) => Promise<{ success: boolean }>;
    deleteSession: (params: DeleteSessionParams) => Promise<{ success: boolean }>;
    getApiKey: (params: Record<string, never>) => Promise<{ apiKey: string | null }>;
    setApiKey: (params: SetApiKeyParams) => Promise<{ success: boolean }>;
    getModel: (params: Record<string, never>) => Promise<{ model: string }>;
    setModel: (params: SetModelParams) => Promise<{ success: boolean }>;
    getSunoTags: (params: Record<string, never>) => Promise<{ useSunoTags: boolean }>;
    setSunoTags: (params: SetSunoTagsParams) => Promise<{ success: boolean }>;
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
        };
        messages: Record<string, never>;
    }>;
    webview: RPCSchema<{
        requests: Record<string, never>;
        messages: {
            onStreamChunk: { chunk: string };
            onCondensing: { status: 'start' | 'done' };
        };
    }>;
};
