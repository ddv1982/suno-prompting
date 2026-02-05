import { z } from 'zod';

import { APP_CONSTANTS, VALID_CREATIVITY_LEVELS } from '@shared/constants';
import { SeedGenresSchema, SunoStylesSchema } from '@shared/schemas/common';

const CreativityLevelSchema = z.number().superRefine((val, ctx) => {
  if (!VALID_CREATIVITY_LEVELS.includes(val as (typeof VALID_CREATIVITY_LEVELS)[number])) {
    ctx.addIssue({
      code: 'custom',
      message: `Invalid creativity level: ${val}. Must be one of: ${VALID_CREATIVITY_LEVELS.join(', ')}`,
    });
  }
});

/** Validates that seed genres and Suno styles are not both provided */
function validateGenreStyleExclusivity(
  data: { seedGenres: string[]; sunoStyles: string[] },
  ctx: z.RefinementCtx
): void {
  if (data.seedGenres.length > 0 && data.sunoStyles.length > 0) {
    ctx.addIssue({
      code: 'custom',
      message: 'Cannot use both Seed Genres and Suno V5 Styles. Please select only one.',
      path: ['sunoStyles'],
    });
  }
}

export const GenerateCreativeBoostSchema = z
  .object({
    creativityLevel: CreativityLevelSchema,
    seedGenres: SeedGenresSchema,
    sunoStyles: SunoStylesSchema,
    description: z.string().max(APP_CONSTANTS.CREATIVE_BOOST_MAX_DESCRIPTION_CHARS),
    lyricsTopic: z.string().max(APP_CONSTANTS.CREATIVE_BOOST_MAX_LYRICS_TOPIC_CHARS),
    maxMode: z.boolean(),
    withLyrics: z.boolean(),
  })
  .superRefine(validateGenreStyleExclusivity);

export const RefineCreativeBoostSchema = z
  .object({
    currentPrompt: z.string().min(1, 'Current prompt is required for refinement'),
    currentTitle: z.string().min(1, 'Current title is required'),
    currentLyrics: z.string().optional(),
    feedback: z.string(), // Empty feedback is allowed - triggers regeneration with current settings
    lyricsTopic: z.string().max(APP_CONSTANTS.CREATIVE_BOOST_MAX_LYRICS_TOPIC_CHARS),
    description: z.string().max(APP_CONSTANTS.CREATIVE_BOOST_MAX_DESCRIPTION_CHARS),
    seedGenres: SeedGenresSchema,
    sunoStyles: SunoStylesSchema,
    maxMode: z.boolean(),
    withLyrics: z.boolean(),
    targetGenreCount: z.number().int().min(0).max(4).optional(), // 0 means "no enforcement" (preserve LLM output)
  })
  .superRefine(validateGenreStyleExclusivity);

export type GenerateCreativeBoostInput = z.infer<typeof GenerateCreativeBoostSchema>;
export type RefineCreativeBoostInput = z.infer<typeof RefineCreativeBoostSchema>;
