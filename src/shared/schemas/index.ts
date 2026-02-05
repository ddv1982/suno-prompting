// Common schemas - shared across features
export {
  MAX_SEED_GENRES,
  MAX_SUNO_STYLES,
  QUICK_VIBES_CATEGORY_VALUES,
  QuickVibesCategorySchema,
  QuickVibesCategoryValueSchema,
  SeedGenresSchema,
  SunoStylesSchema,
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
  SetUseLocalLLMSchema,
  SaveAllSettingsSchema,
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

// Thematic context schemas
export { ThematicContextSchema, type ThematicContext } from './thematic-context';
