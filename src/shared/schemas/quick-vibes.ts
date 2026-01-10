import { z } from 'zod';

import { APP_CONSTANTS } from '@shared/constants';

const MAX_SUNO_STYLES = 4;

const QuickVibesCategorySchema = z.enum([
  'lofi-study',
  'cafe-coffeeshop',
  'ambient-focus',
  'latenight-chill',
  'cozy-rainy',
  'lofi-chill',
]).nullable();

const SunoStylesSchema = z.array(z.string()).max(MAX_SUNO_STYLES, `Maximum ${MAX_SUNO_STYLES} Suno V5 styles allowed`);

export const GenerateQuickVibesSchema = z.object({
  category: QuickVibesCategorySchema,
  customDescription: z.string().max(APP_CONSTANTS.QUICK_VIBES_MAX_CHARS),
  withWordlessVocals: z.boolean(),
  sunoStyles: SunoStylesSchema,
}).refine(
  (data) => !(data.category !== null && data.sunoStyles.length > 0),
  { message: 'Cannot use both Category and Suno V5 Styles. Please select only one.', path: ['sunoStyles'] }
);

export const RefineQuickVibesSchema = z.object({
  currentPrompt: z.string().min(1, 'Current prompt is required'),
  currentTitle: z.string().optional(),
  description: z.string().optional(),
  feedback: z.string(),
  withWordlessVocals: z.boolean(),
  category: QuickVibesCategorySchema.optional(),
  sunoStyles: SunoStylesSchema.optional().default([]),
}).refine(
  (data) => !(data.category !== null && data.category !== undefined && (data.sunoStyles?.length ?? 0) > 0),
  { message: 'Cannot use both Category and Suno V5 Styles. Please select only one.', path: ['sunoStyles'] }
);

export type GenerateQuickVibesInput = z.infer<typeof GenerateQuickVibesSchema>;
export type RefineQuickVibesInput = z.infer<typeof RefineQuickVibesSchema>;
