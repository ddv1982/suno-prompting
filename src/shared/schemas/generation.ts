import { z } from 'zod';

import { APP_CONSTANTS } from '@shared/constants';

export const GenerateInitialSchema = z.object({
  description: z.string().max(APP_CONSTANTS.MAX_PROMPT_CHARS),
  lockedPhrase: z.string().max(APP_CONSTANTS.MAX_LOCKED_PHRASE_CHARS).optional(),
  lyricsTopic: z.string().max(APP_CONSTANTS.MAX_LYRICS_TOPIC_CHARS).optional(),
  genreOverride: z.string().max(100).optional(),
  /** Suno V5 styles for Direct Mode (mutually exclusive with genreOverride in validation) */
  sunoStyles: z.array(z.string()).max(4).optional(),
});

export const RefinePromptSchema = z.object({
  currentPrompt: z.string().min(1, 'Current prompt is required'),
  feedback: z.string().min(1, 'Feedback is required'),
  lockedPhrase: z.string().max(APP_CONSTANTS.MAX_LOCKED_PHRASE_CHARS).optional(),
  currentTitle: z.string().optional(),
  currentLyrics: z.string().optional(),
  lyricsTopic: z.string().max(APP_CONSTANTS.MAX_LYRICS_TOPIC_CHARS).optional(),
  genreOverride: z.string().max(100).optional(),
  /** Suno V5 styles for Direct Mode (mutually exclusive with genreOverride in validation) */
  sunoStyles: z.array(z.string()).max(4).optional(),
});

export type GenerateInitialInput = z.infer<typeof GenerateInitialSchema>;
export type RefinePromptInput = z.infer<typeof RefinePromptSchema>;
