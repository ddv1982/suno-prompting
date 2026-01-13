/**
 * Types for Prompt Refinement Module
 *
 * @module ai/refinement/types
 */

import type { RefinementType, StyleChanges } from '@shared/types/refinement';

/**
 * Options for refining a prompt.
 */
export interface RefinePromptOptions {
  /** Current prompt to refine */
  currentPrompt: string;
  /** Current title */
  currentTitle: string;
  /** User feedback to apply (optional for style-only refinement) */
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
  /**
   * Type of refinement to perform (auto-detected by frontend).
   * - 'style': Only style fields changed, no LLM calls needed
   * - 'lyrics': Only feedback text provided, refine lyrics with LLM
   * - 'combined': Both style changes AND feedback, do both
   * Defaults to 'combined' for backwards compatibility.
   */
  refinementType?: RefinementType;
  /** Style changes to apply (for 'style' or 'combined' refinement types) */
  styleChanges?: StyleChanges;
}
