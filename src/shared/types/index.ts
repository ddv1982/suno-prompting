// Barrel file - re-exports all types for backwards compatibility

// Config types
export type { AIProvider, APIKeys, AppConfig } from '@shared/types/config';
export { DEFAULT_API_KEYS } from '@shared/types/config';

// Domain types
export type { 
  PromptMode,
  QuickVibesCategory,
  QuickVibesInput,
  CreativeBoostInput,
  CreativityLevel,
  CreativitySliderValue,
  EditorMode, 
  AdvancedSelection, 
  PromptVersion, 
  PromptSession, 
  DebugInfo 
} from '@shared/types/domain';
export { EMPTY_ADVANCED_SELECTION, EMPTY_CREATIVE_BOOST_INPUT } from '@shared/types/domain';

// API types
export type {
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
  GetPromptModeResponse,
  SetPromptModeParams,
  SetPromptModeResponse,
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
} from '@shared/types/api';

// RPC types
export type { RPCHandlers, SunoRPCSchema } from '@shared/types/rpc';
