/**
 * Types for Quick Vibes Engine
 *
 * @module ai/quick-vibes/types
 */

import type { QuickVibesCategory } from '@shared/types';

/**
 * Options for generating Quick Vibes prompts.
 */
export interface GenerateQuickVibesOptions {
  /** Category for deterministic generation (e.g., 'lofi-study', 'cafe-coffeeshop') */
  category: QuickVibesCategory | null;
  /** Custom description when no category is selected */
  customDescription: string;
  /** Suno V5 style tags for direct mode */
  sunoStyles: string[];
}

/**
 * Options for refining Quick Vibes prompts.
 */
export interface RefineQuickVibesOptions {
  /** Current prompt to refine */
  currentPrompt: string;
  /** Current title (optional) */
  currentTitle?: string;
  /** Original description (optional) */
  description?: string;
  /** User feedback to apply */
  feedback: string;
  /** Category for deterministic refinement (optional) */
  category?: QuickVibesCategory | null;
  /** Suno V5 style tags for direct mode */
  sunoStyles: string[];
}
