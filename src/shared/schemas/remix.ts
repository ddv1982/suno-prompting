import { z } from 'zod';

import { APP_CONSTANTS } from '@shared/constants';

const CurrentPromptSchema = z.string().min(1, 'Current prompt is required');

export const RemixInstrumentsSchema = z.object({
  currentPrompt: CurrentPromptSchema,
  originalInput: z.string(),
});

export const RemixGenreSchema = z.object({
  currentPrompt: CurrentPromptSchema,
  targetGenreCount: z.number().int().min(1).max(4).optional(),
});

export const RemixMoodSchema = z.object({
  currentPrompt: CurrentPromptSchema,
});

export const RemixStyleTagsSchema = z.object({
  currentPrompt: CurrentPromptSchema,
});

export const RemixRecordingSchema = z.object({
  currentPrompt: CurrentPromptSchema,
});

export const RemixTitleSchema = z.object({
  currentPrompt: CurrentPromptSchema,
  originalInput: z.string(),
});

export const RemixLyricsSchema = z.object({
  currentPrompt: CurrentPromptSchema,
  originalInput: z.string(),
  lyricsTopic: z.string().max(APP_CONSTANTS.MAX_LYRICS_TOPIC_CHARS).optional(),
});

export type RemixInstrumentsInput = z.infer<typeof RemixInstrumentsSchema>;
export type RemixGenreInput = z.infer<typeof RemixGenreSchema>;
export type RemixMoodInput = z.infer<typeof RemixMoodSchema>;
export type RemixStyleTagsInput = z.infer<typeof RemixStyleTagsSchema>;
export type RemixRecordingInput = z.infer<typeof RemixRecordingSchema>;
export type RemixTitleInput = z.infer<typeof RemixTitleSchema>;
export type RemixLyricsInput = z.infer<typeof RemixLyricsSchema>;
