import { z } from 'zod';

import { APP_CONSTANTS } from '@shared/constants';
import { QuickVibesCategorySchema, SunoStylesSchema } from '@shared/schemas/common';

// Re-export for convenience
export { QuickVibesCategorySchema } from '@shared/schemas/common';

export const GenerateQuickVibesSchema = z.object({
  category: QuickVibesCategorySchema,
  customDescription: z.string().max(APP_CONSTANTS.QUICK_VIBES_MAX_CHARS),
  withWordlessVocals: z.boolean(),
  sunoStyles: SunoStylesSchema,
}).superRefine((data, ctx) => {
  // Category and Suno Styles are mutually exclusive
  if (data.category !== null && data.sunoStyles.length > 0) {
    ctx.addIssue({
      code: 'custom',
      message: 'Cannot use both Category and Suno V5 Styles. Please select only one.',
      path: ['sunoStyles'],
    });
  }
});

export const RefineQuickVibesSchema = z.object({
  currentPrompt: z.string().min(1, 'Current prompt is required'),
  currentTitle: z.string().optional(),
  description: z.string().optional(),
  feedback: z.string(),
  withWordlessVocals: z.boolean(),
  category: QuickVibesCategorySchema.optional(),
  sunoStyles: SunoStylesSchema.optional().default([]),
}).superRefine((data, ctx) => {
  // Category and Suno Styles are mutually exclusive
  if (data.category !== null && data.category !== undefined && (data.sunoStyles?.length ?? 0) > 0) {
    ctx.addIssue({
      code: 'custom',
      message: 'Cannot use both Category and Suno V5 Styles. Please select only one.',
      path: ['sunoStyles'],
    });
  }
});

export type GenerateQuickVibesInput = z.infer<typeof GenerateQuickVibesSchema>;
export type RefineQuickVibesInput = z.infer<typeof RefineQuickVibesSchema>;
