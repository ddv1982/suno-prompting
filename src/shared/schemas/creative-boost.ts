import { z } from 'zod';

import { APP_CONSTANTS, VALID_CREATIVITY_LEVELS } from '@shared/constants';
import { SeedGenresSchema, SunoStylesSchema } from '@shared/schemas/common';

const CreativityLevelSchema = z.number().refine(
  (val): val is typeof VALID_CREATIVITY_LEVELS[number] =>
    VALID_CREATIVITY_LEVELS.includes(val as typeof VALID_CREATIVITY_LEVELS[number]),
  { message: 'Invalid creativity level. Must be 0, 25, 50, 75, or 100' }
);

const genreStylesMutualExclusivity = (data: { seedGenres: string[]; sunoStyles: string[] }): boolean =>
  !(data.seedGenres.length > 0 && data.sunoStyles.length > 0);

export const GenerateCreativeBoostSchema = z.object({
  creativityLevel: CreativityLevelSchema,
  seedGenres: SeedGenresSchema,
  sunoStyles: SunoStylesSchema,
  description: z.string().max(APP_CONSTANTS.CREATIVE_BOOST_MAX_DESCRIPTION_CHARS),
  lyricsTopic: z.string().max(APP_CONSTANTS.CREATIVE_BOOST_MAX_LYRICS_TOPIC_CHARS),
  withWordlessVocals: z.boolean(),
  maxMode: z.boolean(),
  withLyrics: z.boolean(),
}).refine(genreStylesMutualExclusivity, {
  message: 'Cannot use both Seed Genres and Suno V5 Styles. Please select only one.',
  path: ['sunoStyles'],
});

export const RefineCreativeBoostSchema = z.object({
  currentPrompt: z.string().min(1, 'Current prompt is required for refinement'),
  currentTitle: z.string().min(1, 'Current title is required'),
  currentLyrics: z.string().optional(),
  feedback: z.string(), // Empty feedback is allowed - triggers regeneration with current settings
  lyricsTopic: z.string().max(APP_CONSTANTS.CREATIVE_BOOST_MAX_LYRICS_TOPIC_CHARS),
  description: z.string().max(APP_CONSTANTS.CREATIVE_BOOST_MAX_DESCRIPTION_CHARS),
  seedGenres: SeedGenresSchema,
  sunoStyles: SunoStylesSchema,
  withWordlessVocals: z.boolean(),
  maxMode: z.boolean(),
  withLyrics: z.boolean(),
  targetGenreCount: z.number().int().min(0).max(4).optional(), // 0 means "no enforcement" (preserve LLM output)
}).refine(genreStylesMutualExclusivity, {
  message: 'Cannot use both Seed Genres and Suno V5 Styles. Please select only one.',
  path: ['sunoStyles'],
});

export type GenerateCreativeBoostInput = z.infer<typeof GenerateCreativeBoostSchema>;
export type RefineCreativeBoostInput = z.infer<typeof RefineCreativeBoostSchema>;
