import { z } from 'zod';

const ProviderSchema = z.enum(['groq', 'openai', 'anthropic']);
const PromptModeSchema = z.enum(['full', 'quickVibes', 'creativeBoost']);
const CreativeBoostModeSchema = z.enum(['simple', 'advanced']);

export const SetApiKeySchema = z.object({
  apiKey: z.string().nullable(),
});

export const SetModelSchema = z.object({
  model: z.string().min(1, 'Model is required'),
});

export const SetSunoTagsSchema = z.object({
  useSunoTags: z.boolean(),
});

export const SetDebugModeSchema = z.object({
  debugMode: z.boolean(),
});

export const SetMaxModeSchema = z.object({
  maxMode: z.boolean(),
});

export const SetLyricsModeSchema = z.object({
  lyricsMode: z.boolean(),
});

export const SetPromptModeSchema = z.object({
  promptMode: PromptModeSchema,
});

export const SetCreativeBoostModeSchema = z.object({
  creativeBoostMode: CreativeBoostModeSchema,
});

export const SaveAllSettingsSchema = z.object({
  provider: ProviderSchema,
  apiKeys: z.object({
    groq: z.string().nullable(),
    openai: z.string().nullable(),
    anthropic: z.string().nullable(),
  }),
  model: z.string().min(1),
  useSunoTags: z.boolean(),
  debugMode: z.boolean(),
  maxMode: z.boolean(),
  lyricsMode: z.boolean(),
});

export type SetApiKeyInput = z.infer<typeof SetApiKeySchema>;
export type SetModelInput = z.infer<typeof SetModelSchema>;
export type SaveAllSettingsInput = z.infer<typeof SaveAllSettingsSchema>;
