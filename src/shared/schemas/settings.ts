import { z } from 'zod';

import { getErrorMessage, validateOllamaEndpoint } from '@shared/errors';

const ProviderSchema = z.enum(['groq', 'openai', 'anthropic']);
export const PromptModeSchema = z.enum(['full', 'quickVibes', 'creativeBoost']);
export const CreativeBoostModeSchema = z.enum(['simple', 'advanced']);

export const SetApiKeySchema = z.object({
  apiKey: z.string().trim().min(1).nullable(),
});

export const SetModelSchema = z.object({
  model: z.string().trim().min(1),
});

export const SetUseLocalLLMSchema = z.object({
  useLocalLLM: z.boolean(),
});

export const SetPromptModeSchema = z.object({
  promptMode: PromptModeSchema,
});

export const SetCreativeBoostModeSchema = z.object({
  creativeBoostMode: CreativeBoostModeSchema,
});

const OllamaConfigSchema = z
  .object({
    endpoint: z.string().regex(/^http:\/\/.+/, 'Endpoint must be a valid http URL'),
    temperature: z.number().min(0, 'Temperature must be at least 0').max(1),
    maxTokens: z.number().int('Max tokens must be an integer').min(500).max(4000),
    contextLength: z.number().int('Context length must be an integer').min(2048).max(8192),
  })
  .superRefine((data, ctx) => {
    try {
      validateOllamaEndpoint(data.endpoint);
    } catch (error) {
      ctx.addIssue({
        code: 'custom',
        message: getErrorMessage(error),
        path: ['endpoint'],
      });
      return z.NEVER;
    }
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
  promptMode: PromptModeSchema.optional(),
  creativeBoostMode: CreativeBoostModeSchema.optional(),
  ollamaConfig: OllamaConfigSchema.optional(),
  ollamaModel: z.string().trim().min(1).optional(),
});

export type SetUseLocalLLMInput = z.infer<typeof SetUseLocalLLMSchema>;
export type SaveAllSettingsInput = z.infer<typeof SaveAllSettingsSchema>;
export type SetApiKeyInput = z.infer<typeof SetApiKeySchema>;
export type SetModelInput = z.infer<typeof SetModelSchema>;
export type SetPromptModeInput = z.infer<typeof SetPromptModeSchema>;
export type SetCreativeBoostModeInput = z.infer<typeof SetCreativeBoostModeSchema>;
