/**
 * Centralized submit validation for all prompt modes.
 * Single source of truth for determining when Generate/Refine buttons are enabled.
 *
 * @module shared/submit-validation
 */

import type { StyleChanges } from './types/refinement';

// ============================================
// Full Prompt Mode
// ============================================

export type FullPromptSubmitInput = {
  description: string;
  lyricsTopic: string;
  lyricsMode: boolean;
  hasAdvancedSelection: boolean;
  sunoStyles: string[];
};

/**
 * Determines if Full Prompt mode can submit.
 * User can submit with ANY of: description, advanced selections, song topic, or suno styles.
 */
export function canSubmitFullPrompt(input: FullPromptSubmitInput): boolean {
  const hasDescription = !!input.description.trim();
  const hasLyricsTopic = input.lyricsMode && !!input.lyricsTopic.trim();
  const hasSunoStyles = input.sunoStyles.length > 0;
  return hasDescription || input.hasAdvancedSelection || hasLyricsTopic || hasSunoStyles;
}

export type FullPromptRefineInput = {
  feedbackText: string;
  styleChanges: StyleChanges | undefined;
  lyricsMode: boolean;
};

/**
 * Determines if Full Prompt mode can refine.
 * User can refine with ANY of: style changes OR feedback text.
 * Style changes always enable refine. Feedback text enables refine (lyrics when lyricsMode ON, style when OFF).
 */
export function canRefineFullPrompt(input: FullPromptRefineInput): boolean {
  const hasFeedback = !!input.feedbackText.trim();
  const hasStyleChanges = input.styleChanges !== undefined;

  // Style changes always enable refine
  if (hasStyleChanges) return true;

  // Feedback text enables refine (lyrics when lyricsMode ON, style when OFF)
  if (hasFeedback) return true;

  return false;
}

// ============================================
// Quick Vibes Mode
// ============================================

export type QuickVibesSubmitInput = {
  category: string | null;
  customDescription: string;
  sunoStyles: string[];
};

export type QuickVibesRefineInput = QuickVibesSubmitInput & {
  original: {
    category: string | null;
    customDescription: string;
    sunoStyles: string[];
  } | null;
};

/**
 * Determines if Quick Vibes mode can submit (generate).
 * User can submit with ANY of: category, description, or suno styles.
 */
export function canSubmitQuickVibes(input: QuickVibesSubmitInput): boolean {
  const hasCategory = input.category !== null;
  const hasDescription = !!input.customDescription.trim();
  const hasSunoStyles = input.sunoStyles.length > 0;
  return hasCategory || hasDescription || hasSunoStyles;
}

/**
 * Determines if Quick Vibes refine mode can submit.
 * User can submit when ANY input differs from the original.
 */
export function canRefineQuickVibes(input: QuickVibesRefineInput): boolean {
  if (!input.original) return canSubmitQuickVibes(input);

  const categoryChanged = input.category !== input.original.category;
  const descriptionChanged = input.customDescription.trim() !== input.original.customDescription.trim();
  const stylesChanged = !arraysEqual(input.sunoStyles, input.original.sunoStyles);

  return categoryChanged || descriptionChanged || stylesChanged;
}

function arraysEqual(a: string[], b: string[]): boolean {
  if (a.length !== b.length) return false;
  return a.every((val, i) => val === b[i]);
}

// ============================================
// Creative Boost Mode
// ============================================

export type CreativeBoostSubmitInput = {
  description: string;
  lyricsTopic: string;
  lyricsMode: boolean;
  sunoStyles: string[];
  seedGenres: string[];
};

/**
 * Determines if Creative Boost mode can submit.
 * User can submit with ANY of: description, lyrics topic, suno styles, or seed genres.
 */
export function canSubmitCreativeBoost(input: CreativeBoostSubmitInput): boolean {
  const hasDescription = !!input.description.trim();
  const hasLyricsTopic = input.lyricsMode && !!input.lyricsTopic.trim();
  const hasSunoStyles = input.sunoStyles.length > 0;
  const hasSeedGenres = input.seedGenres.length > 0;
  return hasDescription || hasLyricsTopic || hasSunoStyles || hasSeedGenres;
}
