// Generation schemas
export {
  GenerateInitialSchema,
  RefinePromptSchema,
  type GenerateInitialInput,
  type RefinePromptInput,
} from './generation';

// Remix schemas
export {
  RemixInstrumentsSchema,
  RemixGenreSchema,
  RemixMoodSchema,
  RemixStyleTagsSchema,
  RemixRecordingSchema,
  RemixTitleSchema,
  RemixLyricsSchema,
  type RemixInstrumentsInput,
  type RemixGenreInput,
  type RemixMoodInput,
  type RemixStyleTagsInput,
  type RemixRecordingInput,
  type RemixTitleInput,
  type RemixLyricsInput,
} from './remix';

// Settings schemas
export {
  SetApiKeySchema,
  SetModelSchema,
  SetSunoTagsSchema,
  SetDebugModeSchema,
  SetMaxModeSchema,
  SetLyricsModeSchema,
  SetUseLocalLLMSchema,
  SetPromptModeSchema,
  SetCreativeBoostModeSchema,
  SaveAllSettingsSchema,
  type SetApiKeyInput,
  type SetModelInput,
  type SetUseLocalLLMInput,
  type SaveAllSettingsInput,
} from './settings';

// Quick Vibes schemas
export {
  GenerateQuickVibesSchema,
  RefineQuickVibesSchema,
  type GenerateQuickVibesInput,
  type RefineQuickVibesInput,
} from './quick-vibes';

// Creative Boost schemas
export {
  GenerateCreativeBoostSchema,
  RefineCreativeBoostSchema,
  type GenerateCreativeBoostInput,
  type RefineCreativeBoostInput,
} from './creative-boost';

// Ollama schemas
export {
  SetOllamaSettingsSchema,
  OLLAMA_DEFAULTS,
  type SetOllamaSettingsInput,
} from './ollama';
