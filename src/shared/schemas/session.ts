import { z } from 'zod';

import {
  MoodCategorySchema,
  QuickVibesCategorySchema,
  SeedGenresSchema,
  SunoStylesSchema,
} from './common';
import { PromptModeSchema } from './settings';
import { TraceRunSchema } from './trace';

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export const DeleteSessionSchema = z.object({
  id: z.string().regex(UUID_PATTERN, 'Session ID must be a valid UUID'),
});

export const PromptVersionSchema = z.object({
  id: z.string().regex(UUID_PATTERN, 'Version ID must be a valid UUID'),
  content: z.string(),
  title: z.string().optional(),
  lyrics: z.string().optional(),
  feedback: z.string().optional(),
  lockedPhrase: z.string().optional(),
  timestamp: z.string(),
  debugTrace: TraceRunSchema.optional(),
});

export const QuickVibesInputSchema = z.object({
  category: QuickVibesCategorySchema,
  customDescription: z.string(),
  sunoStyles: SunoStylesSchema,
  moodCategory: MoodCategorySchema,
});

export const CreativeBoostInputSchema = z.object({
  creativityLevel: z.union([
    z.literal(0),
    z.literal(25),
    z.literal(50),
    z.literal(75),
    z.literal(100),
  ]),
  seedGenres: SeedGenresSchema,
  sunoStyles: SunoStylesSchema,
  description: z.string(),
  lyricsTopic: z.string(),
  moodCategory: MoodCategorySchema,
});

export const SaveSessionSchema = z.object({
  session: z.object({
    id: z.string().regex(UUID_PATTERN, 'Session ID must be a valid UUID'),
    originalInput: z.string(),
    lyricsTopic: z.string().optional(),
    currentPrompt: z.string(),
    currentTitle: z.string().optional(),
    currentLyrics: z.string().optional(),
    versionHistory: z.array(PromptVersionSchema),
    createdAt: z.string(),
    updatedAt: z.string(),
    promptMode: PromptModeSchema.optional(),
    quickVibesInput: QuickVibesInputSchema.optional(),
    creativeBoostInput: CreativeBoostInputSchema.optional(),
  }),
});

export type DeleteSessionInput = z.infer<typeof DeleteSessionSchema>;
export type SaveSessionInput = z.infer<typeof SaveSessionSchema>;
