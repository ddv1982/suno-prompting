/**
 * Zod schemas for submit validation across all prompt modes.
 * Single source of truth for determining when Generate/Refine buttons are enabled.
 * Replaces imperative validation functions with declarative Zod schemas.
 *
 * @module @shared/schemas/submit-validation
 */
import { z } from 'zod';

import { SunoStylesSchema, SeedGenresSchema } from '@shared/schemas/common';

// ============================================
// Full Prompt Mode
// ============================================

/**
 * Schema for Full Prompt submit validation.
 * User can submit with ANY of: description, advanced selections, song topic, or suno styles.
 */
export const FullPromptSubmitSchema = z
  .object({
    description: z.string(),
    lyricsTopic: z.string(),
    lyricsMode: z.boolean(),
    hasAdvancedSelection: z.boolean(),
    sunoStyles: SunoStylesSchema,
  })
  .superRefine((data, ctx) => {
    const hasDescription = !!data.description.trim();
    const hasLyricsTopic = data.lyricsMode && !!data.lyricsTopic.trim();
    const hasSunoStyles = data.sunoStyles.length > 0;

    // Must have at least one input source
    if (!hasDescription && !data.hasAdvancedSelection && !hasLyricsTopic && !hasSunoStyles) {
      ctx.addIssue({
        code: 'custom',
        message: 'Provide a description, advanced selection, song topic, or Suno styles',
        path: ['description'],
      });
    }
  });

/**
 * Schema for Full Prompt refine validation.
 * User can refine with ANY of: style changes OR feedback text.
 */
export const FullPromptRefineSchema = z
  .object({
    feedbackText: z.string(),
    styleChanges: z.record(z.string(), z.unknown()).optional(),
    lyricsMode: z.boolean(),
  })
  .superRefine((data, ctx) => {
    const hasFeedback = !!data.feedbackText.trim();
    const hasStyleChanges = data.styleChanges !== undefined;

    // Must have feedback or style changes to refine
    if (!hasFeedback && !hasStyleChanges) {
      ctx.addIssue({
        code: 'custom',
        message: 'Provide feedback or make style changes to refine',
        path: ['feedbackText'],
      });
    }
  });

// ============================================
// Quick Vibes Mode
// ============================================

/**
 * Schema for Quick Vibes submit validation.
 * User can submit with ANY of: category, description, or suno styles.
 * Note: Uses z.string().nullable() for backward compatibility instead of strict
 * QuickVibesCategorySchema to allow any string category value.
 */
export const QuickVibesSubmitSchema = z
  .object({
    category: z.string().nullable(),
    customDescription: z.string(),
    sunoStyles: SunoStylesSchema,
  })
  .superRefine((data, ctx) => {
    const hasCategory = data.category !== null;
    const hasDescription = !!data.customDescription.trim();
    const hasSunoStyles = data.sunoStyles.length > 0;

    // Must have at least one input
    if (!hasCategory && !hasDescription && !hasSunoStyles) {
      ctx.addIssue({
        code: 'custom',
        message: 'Select a category, enter a description, or choose Suno styles',
        path: ['category'],
      });
    }
  });

/**
 * Schema for Quick Vibes refine validation.
 * User can refine when ANY input differs from the original.
 * Note: Uses z.string().nullable() for backward compatibility instead of strict
 * QuickVibesCategorySchema to allow any string category value.
 */
export const QuickVibesRefineSchema = z
  .object({
    category: z.string().nullable(),
    customDescription: z.string(),
    sunoStyles: SunoStylesSchema,
    original: z
      .object({
        category: z.string().nullable(),
        customDescription: z.string(),
        sunoStyles: z.array(z.string()),
      })
      .nullable(),
  })
  .superRefine((data, ctx) => {
    // If no original, fall back to submit validation
    if (!data.original) {
      const hasCategory = data.category !== null;
      const hasDescription = !!data.customDescription.trim();
      const hasSunoStyles = data.sunoStyles.length > 0;

      if (!hasCategory && !hasDescription && !hasSunoStyles) {
        ctx.addIssue({
          code: 'custom',
          message: 'Select a category, enter a description, or choose Suno styles',
          path: ['category'],
        });
      }
      return;
    }

    const categoryChanged = data.category !== data.original.category;
    const descriptionChanged =
      data.customDescription.trim() !== data.original.customDescription.trim();
    const stylesChanged = !arraysEqual(data.sunoStyles, data.original.sunoStyles);

    if (!categoryChanged && !descriptionChanged && !stylesChanged) {
      ctx.addIssue({
        code: 'custom',
        message: 'Make changes to refine the prompt',
        path: ['customDescription'],
      });
    }
  });

function arraysEqual(a: readonly string[], b: readonly string[]): boolean {
  if (a.length !== b.length) return false;
  return a.every((val, i) => val === b[i]);
}

// ============================================
// Creative Boost Mode
// ============================================

/**
 * Schema for Creative Boost submit validation.
 * User can submit with ANY of: description, lyrics topic, suno styles, or seed genres.
 * Note: Mutual exclusivity of seed genres and suno styles is NOT checked here,
 * it's enforced by GenerateCreativeBoostSchema during generation.
 */
export const CreativeBoostSubmitSchema = z
  .object({
    description: z.string(),
    lyricsTopic: z.string(),
    lyricsMode: z.boolean(),
    sunoStyles: SunoStylesSchema,
    seedGenres: SeedGenresSchema,
  })
  .superRefine((data, ctx) => {
    const hasDescription = !!data.description.trim();
    const hasLyricsTopic = data.lyricsMode && !!data.lyricsTopic.trim();
    const hasSunoStyles = data.sunoStyles.length > 0;
    const hasSeedGenres = data.seedGenres.length > 0;

    // Must have at least one input
    if (!hasDescription && !hasLyricsTopic && !hasSunoStyles && !hasSeedGenres) {
      ctx.addIssue({
        code: 'custom',
        message: 'Provide a description, lyrics topic, Suno styles, or seed genres',
        path: ['description'],
      });
    }
  });
