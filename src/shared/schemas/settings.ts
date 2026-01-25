import { z } from 'zod';

const ProviderSchema = z.enum(['groq', 'openai', 'anthropic']);

export const SetUseLocalLLMSchema = z.object({
  useLocalLLM: z.boolean(),
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
  storyMode: z.boolean(),
  useLocalLLM: z.boolean(),
});

export type SetUseLocalLLMInput = z.infer<typeof SetUseLocalLLMSchema>;
export type SaveAllSettingsInput = z.infer<typeof SaveAllSettingsSchema>;
