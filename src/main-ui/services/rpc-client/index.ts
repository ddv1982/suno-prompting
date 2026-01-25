import { request } from './client';

import type { RpcError } from './errors';
import type {
  CheckOllamaStatusResponse,
  ConvertToMaxFormatParams,
  ConvertToMaxFormatResponse,
  DeleteSessionParams,
  GenerateCreativeBoostParams,
  GenerateCreativeBoostResponse,
  GenerateInitialParams,
  GenerateInitialResponse,
  GenerateQuickVibesParams,
  GenerateQuickVibesResponse,
  GetAllSettingsResponse,
  GetCreativeBoostModeResponse,
  GetHistoryResponse,
  GetPromptModeResponse,
  OllamaSettingsResponse,
  RefineCreativeBoostParams,
  RefineCreativeBoostResponse,
  RefinePromptParams,
  RefinePromptResponse,
  RefineQuickVibesParams,
  RefineQuickVibesResponse,
  RemixGenreParams,
  RemixGenreResponse,
  RemixInstrumentsParams,
  RemixInstrumentsResponse,
  RemixLyricsParams,
  RemixLyricsResponse,
  RemixMoodParams,
  RemixMoodResponse,
  RemixRecordingParams,
  RemixRecordingResponse,
  RemixStyleTagsParams,
  RemixStyleTagsResponse,
  RemixTitleParams,
  RemixTitleResponse,
  SaveAllSettingsParams,
  SaveSessionParams,
  SetApiKeyParams,
  SetCreativeBoostModeParams,
  SetLyricsModeParams,
  SetMaxModeParams,
  SetModelParams,
  SetStoryModeParams,
  SetPromptModeParams,
  SetSunoTagsParams,
  SetUseLocalLLMParams,
  SetDebugModeParams,
  SetOllamaSettingsParams,
  SetPromptModeResponse,
  SetCreativeBoostModeResponse,
} from '@shared/types/api';
import type { Result } from '@shared/types/result';


export { type RpcError, type RpcErrorCode, mapToRpcError, redactAndTruncateText } from './errors';
export { request } from './client';
export { RpcClientError, unwrapOrThrowResult } from '@/services/rpc-shim-error';

/** Type alias for RPC methods that take no parameters. */
export type EmptyParams = Record<string, never>;

export const rpcClient = {
  getHistory: (params: EmptyParams): Promise<Result<GetHistoryResponse, RpcError>> => request('getHistory', params),
  saveSession: (params: SaveSessionParams): Promise<Result<{ success: boolean }, RpcError>> => request('saveSession', params),
  deleteSession: (params: DeleteSessionParams): Promise<Result<{ success: boolean }, RpcError>> => request('deleteSession', params),

  generateInitial: (params: GenerateInitialParams): Promise<Result<GenerateInitialResponse, RpcError>> => request('generateInitial', params),
  refinePrompt: (params: RefinePromptParams): Promise<Result<RefinePromptResponse, RpcError>> => request('refinePrompt', params),

  remixInstruments: (params: RemixInstrumentsParams): Promise<Result<RemixInstrumentsResponse, RpcError>> => request('remixInstruments', params),
  remixGenre: (params: RemixGenreParams): Promise<Result<RemixGenreResponse, RpcError>> => request('remixGenre', params),
  remixMood: (params: RemixMoodParams): Promise<Result<RemixMoodResponse, RpcError>> => request('remixMood', params),
  remixStyleTags: (params: RemixStyleTagsParams): Promise<Result<RemixStyleTagsResponse, RpcError>> => request('remixStyleTags', params),
  remixRecording: (params: RemixRecordingParams): Promise<Result<RemixRecordingResponse, RpcError>> => request('remixRecording', params),
  remixTitle: (params: RemixTitleParams): Promise<Result<RemixTitleResponse, RpcError>> => request('remixTitle', params),
  remixLyrics: (params: RemixLyricsParams): Promise<Result<RemixLyricsResponse, RpcError>> => request('remixLyrics', params),

  getApiKey: (params: EmptyParams): Promise<Result<{ apiKey: string | null }, RpcError>> => request('getApiKey', params),
  setApiKey: (params: SetApiKeyParams): Promise<Result<{ success: boolean }, RpcError>> => request('setApiKey', params),
  getModel: (params: EmptyParams): Promise<Result<{ model: string }, RpcError>> => request('getModel', params),
  setModel: (params: SetModelParams): Promise<Result<{ success: boolean }, RpcError>> => request('setModel', params),
  getSunoTags: (params: EmptyParams): Promise<Result<{ useSunoTags: boolean }, RpcError>> => request('getSunoTags', params),
  setSunoTags: (params: SetSunoTagsParams): Promise<Result<{ success: boolean }, RpcError>> => request('setSunoTags', params),
  getDebugMode: (params: EmptyParams): Promise<Result<{ debugMode: boolean }, RpcError>> => request('getDebugMode', params),
  setDebugMode: (params: SetDebugModeParams): Promise<Result<{ success: boolean }, RpcError>> => request('setDebugMode', params),
  getAllSettings: (params: EmptyParams): Promise<Result<GetAllSettingsResponse, RpcError>> => request('getAllSettings', params),
  saveAllSettings: (params: SaveAllSettingsParams): Promise<Result<{ success: boolean }, RpcError>> => request('saveAllSettings', params),
  getMaxMode: (params: EmptyParams): Promise<Result<{ maxMode: boolean }, RpcError>> => request('getMaxMode', params),
  setMaxMode: (params: SetMaxModeParams): Promise<Result<{ success: boolean }, RpcError>> => request('setMaxMode', params),
  getLyricsMode: (params: EmptyParams): Promise<Result<{ lyricsMode: boolean }, RpcError>> => request('getLyricsMode', params),
  setLyricsMode: (params: SetLyricsModeParams): Promise<Result<{ success: boolean }, RpcError>> => request('setLyricsMode', params),
  getStoryMode: (params: EmptyParams): Promise<Result<{ storyMode: boolean }, RpcError>> => request('getStoryMode', params),
  setStoryMode: (params: SetStoryModeParams): Promise<Result<{ success: boolean }, RpcError>> => request('setStoryMode', params),
  getUseLocalLLM: (params: EmptyParams): Promise<Result<{ useLocalLLM: boolean }, RpcError>> => request('getUseLocalLLM', params),
  setUseLocalLLM: (params: SetUseLocalLLMParams): Promise<Result<{ success: boolean }, RpcError>> => request('setUseLocalLLM', params),

  getPromptMode: (params: EmptyParams): Promise<Result<GetPromptModeResponse, RpcError>> => request('getPromptMode', params),
  setPromptMode: (params: SetPromptModeParams): Promise<Result<SetPromptModeResponse, RpcError>> => request('setPromptMode', params),
  getCreativeBoostMode: (params: EmptyParams): Promise<Result<GetCreativeBoostModeResponse, RpcError>> => request('getCreativeBoostMode', params),
  setCreativeBoostMode: (params: SetCreativeBoostModeParams): Promise<Result<SetCreativeBoostModeResponse, RpcError>> => request('setCreativeBoostMode', params),

  generateQuickVibes: (params: GenerateQuickVibesParams): Promise<Result<GenerateQuickVibesResponse, RpcError>> => request('generateQuickVibes', params),
  refineQuickVibes: (params: RefineQuickVibesParams): Promise<Result<RefineQuickVibesResponse, RpcError>> => request('refineQuickVibes', params),

  convertToMaxFormat: (params: ConvertToMaxFormatParams): Promise<Result<ConvertToMaxFormatResponse, RpcError>> => request('convertToMaxFormat', params),

  generateCreativeBoost: (params: GenerateCreativeBoostParams): Promise<Result<GenerateCreativeBoostResponse, RpcError>> => request('generateCreativeBoost', params),
  refineCreativeBoost: (params: RefineCreativeBoostParams): Promise<Result<RefineCreativeBoostResponse, RpcError>> => request('refineCreativeBoost', params),

  checkOllamaStatus: (params: EmptyParams): Promise<Result<CheckOllamaStatusResponse, RpcError>> => request('checkOllamaStatus', params),
  getOllamaSettings: (params: EmptyParams): Promise<Result<OllamaSettingsResponse, RpcError>> => request('getOllamaSettings', params),
  setOllamaSettings: (params: SetOllamaSettingsParams): Promise<Result<{ success: boolean }, RpcError>> => request('setOllamaSettings', params),
};
