/**
 * Types for Prompt Refinement Module
 *
 * @module ai/refinement/types
 */

/**
 * Options for refining a prompt.
 */
export interface RefinePromptOptions {
  /** Current prompt to refine */
  currentPrompt: string;
  /** Current title */
  currentTitle: string;
  /** User feedback to apply */
  feedback: string;
  /** Current lyrics (when lyrics mode enabled) */
  currentLyrics?: string;
  /** Locked phrase to preserve */
  lockedPhrase?: string;
  /** Topic for lyrics refinement */
  lyricsTopic?: string;
  /** Optional genre override from Advanced Mode */
  genreOverride?: string;
  /** Optional Suno V5 styles for Direct Mode (mutually exclusive with genreOverride) */
  sunoStyles?: string[];
}
