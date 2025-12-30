// RPC Schema and Handler types

import { type RPCSchema } from 'electrobun';
import type {
  GenerateInitialParams,
  GenerateInitialResponse,
  RefinePromptParams,
  RefinePromptResponse,
  RemixInstrumentsParams,
  RemixInstrumentsResponse,
  RemixGenreParams,
  RemixGenreResponse,
  RemixMoodParams,
  RemixMoodResponse,
  RemixStyleTagsParams,
  RemixStyleTagsResponse,
  RemixRecordingParams,
  RemixRecordingResponse,
  RemixTitleParams,
  RemixTitleResponse,
  RemixLyricsParams,
  RemixLyricsResponse,
  SetDebugModeParams,
  SaveAllSettingsParams,
  GetAllSettingsResponse,
  GetHistoryResponse,
  SaveSessionParams,
  DeleteSessionParams,
  SetApiKeyParams,
  SetModelParams,
  SetSunoTagsParams,
  SetMaxModeParams,
  SetLyricsModeParams,
  SetPromptModeParams,
  GenerateQuickVibesParams,
  GenerateQuickVibesResponse,
} from '@shared/types/api';
import type { PromptMode } from '@shared/types/domain';

// Handler function types for backend implementation
export type RPCHandlers = {
  generateInitial: (params: GenerateInitialParams) => Promise<GenerateInitialResponse>;
  refinePrompt: (params: RefinePromptParams) => Promise<RefinePromptResponse>;
  remixInstruments: (params: RemixInstrumentsParams) => Promise<RemixInstrumentsResponse>;
  remixGenre: (params: RemixGenreParams) => Promise<RemixGenreResponse>;
  remixMood: (params: RemixMoodParams) => Promise<RemixMoodResponse>;
  remixStyleTags: (params: RemixStyleTagsParams) => Promise<RemixStyleTagsResponse>;
  remixRecording: (params: RemixRecordingParams) => Promise<RemixRecordingResponse>;
  remixTitle: (params: RemixTitleParams) => Promise<RemixTitleResponse>;
  remixLyrics: (params: RemixLyricsParams) => Promise<RemixLyricsResponse>;
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
  getPromptMode: (params: Record<string, never>) => Promise<{ promptMode: PromptMode }>;
  setPromptMode: (params: SetPromptModeParams) => Promise<{ success: boolean }>;
  generateQuickVibes: (params: GenerateQuickVibesParams) => Promise<GenerateQuickVibesResponse>;
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
      remixTitle: {
        params: RemixTitleParams;
        response: RemixTitleResponse;
      };
      remixLyrics: {
        params: RemixLyricsParams;
        response: RemixLyricsResponse;
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
      getPromptMode: {
        params: Record<string, never>;
        response: { promptMode: PromptMode };
      };
      setPromptMode: {
        params: SetPromptModeParams;
        response: { success: boolean };
      };
      generateQuickVibes: {
        params: GenerateQuickVibesParams;
        response: GenerateQuickVibesResponse;
      };
    };
    messages: Record<string, never>;
  }>;
  webview: RPCSchema<{
    requests: Record<string, never>;
    messages: Record<string, never>;
  }>;
};
