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

/**
 * Schema for style changes in refinement.
 * Contains optional fields for all style properties that can be changed.
 */
export const StyleChangesSchema = z.object({
  /** Changed seed genres (0-4 genre keys) */
  seedGenres: z.array(z.string()).max(4).optional(),
  /** Changed Suno V5 style keys (0-4) */
  sunoStyles: z.array(z.string()).max(4).optional(),
  /** Changed BPM value */
  bpm: z.number().int().min(40).max(300).optional(),
  /** Changed instruments list */
  instruments: z.array(z.string()).optional(),
  /** Changed mood categories */
  mood: z.array(z.string()).optional(),
  /** Changed harmonic style */
  harmonicStyle: z.string().nullable().optional(),
  /** Changed harmonic combination */
  harmonicCombination: z.string().nullable().optional(),
  /** Changed polyrhythm combination */
  polyrhythmCombination: z.string().nullable().optional(),
  /** Changed time signature */
  timeSignature: z.string().nullable().optional(),
  /** Changed time signature journey */
  timeSignatureJourney: z.string().nullable().optional(),
  /** Changed mood category */
  moodCategory: z.string().nullable().optional(),
});

/**
 * Refinement type enum for auto-detection.
 * - 'style': Only style fields changed (no feedback text required)
 * - 'lyrics': Only feedback text provided (requires lyrics mode ON)
 * - 'combined': Both style changes AND feedback text present
 */
export const RefinementTypeSchema = z.enum(['style', 'lyrics', 'combined']);

export const RefinePromptSchema = z.object({
  currentPrompt: z.string().min(1, 'Current prompt is required'),
  /** Feedback text for lyrics refinement (now optional - not required for style-only refinement) */
  feedback: z.string().optional(),
  lockedPhrase: z.string().max(APP_CONSTANTS.MAX_LOCKED_PHRASE_CHARS).optional(),
  currentTitle: z.string().optional(),
  currentLyrics: z.string().optional(),
  lyricsTopic: z.string().max(APP_CONSTANTS.MAX_LYRICS_TOPIC_CHARS).optional(),
  genreOverride: z.string().max(100).optional(),
  /** Suno V5 styles for Direct Mode (mutually exclusive with genreOverride in validation) */
  sunoStyles: z.array(z.string()).max(4).optional(),
  /** The type of refinement to perform (auto-detected by frontend, defaults to 'combined' for backwards compatibility) */
  refinementType: RefinementTypeSchema.default('combined'),
  /** Style changes to apply (for 'style' or 'combined' refinement types) */
  styleChanges: StyleChangesSchema.optional(),
});

export type GenerateInitialInput = z.infer<typeof GenerateInitialSchema>;
export type RefinePromptInput = z.infer<typeof RefinePromptSchema>;
export type StyleChangesInput = z.infer<typeof StyleChangesSchema>;
export type RefinementTypeInput = z.infer<typeof RefinementTypeSchema>;
