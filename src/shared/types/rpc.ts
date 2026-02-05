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
  SetStoryModeParams,
  SetUseLocalLLMParams,
  SetPromptModeParams,
  SetCreativeBoostModeParams,
  GenerateQuickVibesParams,
  GenerateQuickVibesResponse,
  RefineQuickVibesParams,
  RefineQuickVibesResponse,
  ConvertToMaxFormatParams,
  ConvertToMaxFormatResponse,
  GenerateCreativeBoostParams,
  GenerateCreativeBoostResponse,
  RefineCreativeBoostParams,
  RefineCreativeBoostResponse,
  CheckOllamaStatusResponse,
  OllamaSettingsResponse,
  SetOllamaSettingsParams,
} from '@shared/types/api';
import type { PromptMode, CreativeBoostMode } from '@shared/types/domain';

// Handler function types for backend implementation
export interface RPCHandlers {
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
  getStoryMode: (params: Record<string, never>) => Promise<{ storyMode: boolean }>;
  setStoryMode: (params: SetStoryModeParams) => Promise<{ success: boolean }>;
  getUseLocalLLM: (params: Record<string, never>) => Promise<{ useLocalLLM: boolean }>;
  setUseLocalLLM: (params: SetUseLocalLLMParams) => Promise<{ success: boolean }>;
  getAllSettings: (params: Record<string, never>) => Promise<GetAllSettingsResponse>;
  saveAllSettings: (params: SaveAllSettingsParams) => Promise<{ success: boolean }>;
  getPromptMode: (params: Record<string, never>) => Promise<{ promptMode: PromptMode }>;
  setPromptMode: (params: SetPromptModeParams) => Promise<{ success: boolean }>;
  getCreativeBoostMode: (
    params: Record<string, never>
  ) => Promise<{ creativeBoostMode: CreativeBoostMode }>;
  setCreativeBoostMode: (params: SetCreativeBoostModeParams) => Promise<{ success: boolean }>;
  generateQuickVibes: (params: GenerateQuickVibesParams) => Promise<GenerateQuickVibesResponse>;
  refineQuickVibes: (params: RefineQuickVibesParams) => Promise<RefineQuickVibesResponse>;
  convertToMaxFormat: (params: ConvertToMaxFormatParams) => Promise<ConvertToMaxFormatResponse>;
  generateCreativeBoost: (
    params: GenerateCreativeBoostParams
  ) => Promise<GenerateCreativeBoostResponse>;
  refineCreativeBoost: (params: RefineCreativeBoostParams) => Promise<RefineCreativeBoostResponse>;
  // Ollama handlers
  checkOllamaStatus: (params: Record<string, never>) => Promise<CheckOllamaStatusResponse>;
  getOllamaSettings: (params: Record<string, never>) => Promise<OllamaSettingsResponse>;
  setOllamaSettings: (params: SetOllamaSettingsParams) => Promise<{ success: boolean }>;
}

export interface SunoRPCSchema {
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
      getStoryMode: {
        params: Record<string, never>;
        response: { storyMode: boolean };
      };
      setStoryMode: {
        params: SetStoryModeParams;
        response: { success: boolean };
      };
      getUseLocalLLM: {
        params: Record<string, never>;
        response: { useLocalLLM: boolean };
      };
      setUseLocalLLM: {
        params: SetUseLocalLLMParams;
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
      getCreativeBoostMode: {
        params: Record<string, never>;
        response: { creativeBoostMode: CreativeBoostMode };
      };
      setCreativeBoostMode: {
        params: SetCreativeBoostModeParams;
        response: { success: boolean };
      };
      generateQuickVibes: {
        params: GenerateQuickVibesParams;
        response: GenerateQuickVibesResponse;
      };
      refineQuickVibes: {
        params: RefineQuickVibesParams;
        response: RefineQuickVibesResponse;
      };
      convertToMaxFormat: {
        params: ConvertToMaxFormatParams;
        response: ConvertToMaxFormatResponse;
      };
      generateCreativeBoost: {
        params: GenerateCreativeBoostParams;
        response: GenerateCreativeBoostResponse;
      };
      refineCreativeBoost: {
        params: RefineCreativeBoostParams;
        response: RefineCreativeBoostResponse;
      };
      // Ollama handlers
      checkOllamaStatus: {
        params: Record<string, never>;
        response: CheckOllamaStatusResponse;
      };
      getOllamaSettings: {
        params: Record<string, never>;
        response: OllamaSettingsResponse;
      };
      setOllamaSettings: {
        params: SetOllamaSettingsParams;
        response: { success: boolean };
      };
    };
    messages: Record<string, never>;
  }>;
  webview: RPCSchema<{
    requests: Record<string, never>;
    messages: Record<string, never>;
  }>;
}
