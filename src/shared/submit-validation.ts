/**
 * Centralized submit validation for all prompt modes.
 * Single source of truth for determining when Generate/Refine buttons are enabled.
 *
 * @module shared/submit-validation
 */

// ============================================
// Full Prompt Mode
// ============================================

export type FullPromptSubmitInput = {
  description: string;
  lyricsTopic: string;
  lyricsMode: boolean;
  hasAdvancedSelection: boolean;
};

/**
 * Determines if Full Prompt mode can submit.
 * User can submit with ANY of: description, advanced selections, or song topic.
 */
export function canSubmitFullPrompt(input: FullPromptSubmitInput): boolean {
  const hasDescription = !!input.description.trim();
  const hasLyricsTopic = input.lyricsMode && !!input.lyricsTopic.trim();
  return hasDescription || input.hasAdvancedSelection || hasLyricsTopic;
}

// ============================================
// Quick Vibes Mode
// ============================================

export type QuickVibesSubmitInput = {
  category: string | null;
  customDescription: string;
  sunoStyles: string[];
};

/**
 * Determines if Quick Vibes mode can submit.
 * User can submit with ANY of: category, description, or suno styles.
 */
export function canSubmitQuickVibes(input: QuickVibesSubmitInput): boolean {
  const hasCategory = input.category !== null;
  const hasDescription = !!input.customDescription.trim();
  const hasSunoStyles = input.sunoStyles.length > 0;
  return hasCategory || hasDescription || hasSunoStyles;
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
