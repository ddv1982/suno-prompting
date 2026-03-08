// Common schemas - shared across features
export {
  MAX_SEED_GENRES,
  MAX_SUNO_STYLES,
  MOOD_CATEGORY_VALUES,
  QUICK_VIBES_CATEGORY_VALUES,
  MoodCategorySchema,
  MoodCategoryValueSchema,
  QuickVibesCategorySchema,
  QuickVibesCategoryValueSchema,
  SeedGenresSchema,
  SunoStylesSchema,
  type MoodCategory,
  type MoodCategoryNullable,
  type QuickVibesCategory,
  type QuickVibesCategoryNullable,
} from './common';

// Generation schemas
export {
  GenerateInitialSchema,
  RefinePromptSchema,
  StyleChangesSchema,
  RefinementTypeSchema,
  type GenerateInitialInput,
  type RefinePromptInput,
  type StyleChangesInput,
  type RefinementTypeInput,
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
  PromptModeSchema,
  CreativeBoostModeSchema,
  SetPromptModeSchema,
  SetCreativeBoostModeSchema,
  SetUseLocalLLMSchema,
  SaveAllSettingsSchema,
  type SetApiKeyInput,
  type SetModelInput,
  type SetPromptModeInput,
  type SetCreativeBoostModeInput,
  type SetUseLocalLLMInput,
  type SaveAllSettingsInput,
} from './settings';

// Quick Vibes schemas
export {
  GenerateQuickVibesSchema,
  RefineQuickVibesSchema,
  QuickVibesCategorySchema as QuickVibesSchema,
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
export { SetOllamaSettingsSchema, type SetOllamaSettingsInput } from './ollama';

// Trace schemas
export { TraceRunSchema } from './trace';

// Session schemas
export {
  DeleteSessionSchema,
  PromptVersionSchema,
  QuickVibesInputSchema,
  CreativeBoostInputSchema,
  SaveSessionSchema,
  type DeleteSessionInput,
  type SaveSessionInput,
} from './session';

// Thematic context schemas
export { ThematicContextSchema, type ThematicContext } from './thematic-context';
