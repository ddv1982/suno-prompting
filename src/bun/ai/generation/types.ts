/**
 * Types for Initial Prompt Generation Module
 *
 * @module ai/generation/types
 */

/**
 * Options for generating an initial prompt.
 */
export interface GenerateInitialOptions {
  /** User's song description */
  description: string;
  /** Optional phrase to inject into prompt */
  lockedPhrase?: string;
  /** Optional topic for lyrics generation */
  lyricsTopic?: string;
  /** Optional genre override from Advanced Mode */
  genreOverride?: string;
  /** Optional Suno V5 styles for Direct Mode (mutually exclusive with genreOverride) */
  sunoStyles?: string[];
}
