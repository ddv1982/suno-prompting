import { z } from 'zod';

/**
 * Schema for setting Ollama configuration.
 * All fields are optional - only provided fields will be updated.
 */
export const SetOllamaSettingsSchema = z.object({
  /** Ollama server endpoint URL */
  endpoint: z.string().regex(/^https?:\/\/.+/, 'Endpoint must be a valid URL').optional(),
  /** Temperature for generation (0-1) */
  temperature: z
    .number()
    .min(0, 'Temperature must be at least 0')
    .max(1, 'Temperature must be at most 1')
    .optional(),
  /** Maximum tokens to generate (500-4000) */
  maxTokens: z
    .number()
    .int('Max tokens must be an integer')
    .min(500, 'Max tokens must be at least 500')
    .max(4000, 'Max tokens must be at most 4000')
    .optional(),
  /** Context window length (2048-8192) */
  contextLength: z
    .number()
    .int('Context length must be an integer')
    .min(2048, 'Context length must be at least 2048')
    .max(8192, 'Context length must be at most 8192')
    .optional(),
});

export type SetOllamaSettingsInput = z.infer<typeof SetOllamaSettingsSchema>;
