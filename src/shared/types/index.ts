// Barrel file - re-exports all types for backwards compatibility

// Result types
export type { Result } from '@shared/types/result';
export { Ok, Err, ok, err, isOk, isErr, unwrap, unwrapOr, map, mapErr, tryCatch, tryCatchAsync } from '@shared/types/result';

// Config types
export type { AIProvider, APIKeys, AppConfig, OllamaConfig } from '@shared/types/config';
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
  CreativeBoostMode,
  AdvancedSelection, 
  PromptVersion, 
  PromptSession, 
  ConversionOptions,
} from '@shared/types/domain';
export { EMPTY_ADVANCED_SELECTION, EMPTY_CREATIVE_BOOST_INPUT } from '@shared/types/domain';

// Trace types
export type {
  TraceVersion,
  TraceRunAction,
  TraceRun,
  TraceEvent,
  TraceBaseEvent,
  TraceRunEvent,
  TraceDecisionDomain,
  TraceDecisionEvent,
  TraceProviderInfo,
  TraceLLMCallEvent,
  TraceErrorType,
  TraceErrorEvent,
} from '@shared/types/trace';

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
  SetUseLocalLLMParams,
  GetPromptModeResponse,
  SetPromptModeParams,
  SetPromptModeResponse,
  GetCreativeBoostModeResponse,
  SetCreativeBoostModeParams,
  SetCreativeBoostModeResponse,
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

// RPC types
export type { RPCHandlers, SunoRPCSchema } from '@shared/types/rpc';

// Refinement types
export type {
  RefinementType,
  StyleChanges,
  RefinementContext,
  OriginalAdvancedSelection,
} from '@shared/types/refinement';
