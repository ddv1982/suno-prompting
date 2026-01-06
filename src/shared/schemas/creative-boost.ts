import { z } from 'zod';

import { APP_CONSTANTS, VALID_CREATIVITY_LEVELS } from '@shared/constants';

const MAX_SUNO_STYLES = 4;
const MAX_SEED_GENRES = 4;

const CreativityLevelSchema = z.number().refine(
  (val): val is typeof VALID_CREATIVITY_LEVELS[number] => 
    VALID_CREATIVITY_LEVELS.includes(val as typeof VALID_CREATIVITY_LEVELS[number]),
  { message: 'Invalid creativity level. Must be 0, 25, 50, 75, or 100' }
);

const SeedGenresSchema = z.array(z.string()).max(MAX_SEED_GENRES, `Maximum ${MAX_SEED_GENRES} seed genres allowed`);
const SunoStylesSchema = z.array(z.string()).max(MAX_SUNO_STYLES, `Maximum ${MAX_SUNO_STYLES} Suno V5 styles allowed`);

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
  feedback: z.string(), // Empty feedback is allowed - triggers regeneration with current settings
  lyricsTopic: z.string().max(APP_CONSTANTS.CREATIVE_BOOST_MAX_LYRICS_TOPIC_CHARS),
  description: z.string().max(APP_CONSTANTS.CREATIVE_BOOST_MAX_DESCRIPTION_CHARS),
  seedGenres: SeedGenresSchema,
  sunoStyles: SunoStylesSchema,
  withWordlessVocals: z.boolean(),
  maxMode: z.boolean(),
  withLyrics: z.boolean(),
}).refine(genreStylesMutualExclusivity, {
  message: 'Cannot use both Seed Genres and Suno V5 Styles. Please select only one.',
  path: ['sunoStyles'],
});

export type GenerateCreativeBoostInput = z.infer<typeof GenerateCreativeBoostSchema>;
export type RefineCreativeBoostInput = z.infer<typeof RefineCreativeBoostSchema>;
