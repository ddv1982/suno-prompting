import { useMemo } from 'react';

import type { MoodCategory } from '@bun/mood';
import type { AdvancedSelection, RefinementType, StyleChanges, OriginalAdvancedSelection } from '@shared/types';

/**
 * Input for useRefinementType hook.
 */
export interface UseRefinementTypeInput {
  /** Current advanced selection from the editor */
  currentSelection: AdvancedSelection;
  /** Original selection captured at generation time */
  originalSelection: OriginalAdvancedSelection | null;
  /** Current feedback text input */
  feedbackText: string;
  /** Whether lyrics mode is enabled */
  lyricsMode: boolean;
  /** Whether there's a current prompt (refine mode active) */
  hasCurrentPrompt: boolean;
  /** Current mood category (not part of AdvancedSelection) */
  moodCategory: MoodCategory | null;
}

/**
 * Result from useRefinementType hook.
 */
export interface UseRefinementTypeResult {
  /** The detected refinement type */
  refinementType: RefinementType;
  /** Style changes to apply (only present for 'style' or 'combined' types) */
  styleChanges: StyleChanges | undefined;
}

/**
 * Compare two arrays for equality (order-independent).
 * Returns true if both arrays contain the same elements.
 */
function arraysEqual(a: string[], b: string[]): boolean {
  if (a.length !== b.length) return false;
  const sortedA = [...a].sort();
  const sortedB = [...b].sort();
  return sortedA.every((val, idx) => val === sortedB[idx]);
}

/**
 * Detect style changes between current and original selection.
 * Returns StyleChanges object if any changes detected, undefined otherwise.
 *
 * @param current - Current advanced selection from editor
 * @param original - Original selection captured at generation time
 * @param currentMoodCategory - Current mood category (not part of AdvancedSelection)
 */
function detectStyleChanges(
  current: AdvancedSelection,
  original: OriginalAdvancedSelection | null,
  currentMoodCategory: string | null
): StyleChanges | undefined {
  // No original to compare against - no changes detected
  if (!original) return undefined;

  const changes: StyleChanges = {};
  let hasChanges = false;

  // Check seedGenres changes (array comparison)
  if (!arraysEqual(current.seedGenres, original.seedGenres)) {
    changes.seedGenres = current.seedGenres;
    hasChanges = true;
  }

  // Check sunoStyles changes (array comparison)
  if (!arraysEqual(current.sunoStyles, original.sunoStyles)) {
    changes.sunoStyles = current.sunoStyles;
    hasChanges = true;
  }

  // Check harmonicStyle changes (nullable string comparison)
  if (current.harmonicStyle !== original.harmonicStyle) {
    changes.harmonicStyle = current.harmonicStyle;
    hasChanges = true;
  }

  // Check harmonicCombination changes (nullable string comparison)
  if (current.harmonicCombination !== original.harmonicCombination) {
    changes.harmonicCombination = current.harmonicCombination;
    hasChanges = true;
  }

  // Check polyrhythmCombination changes (nullable string comparison)
  if (current.polyrhythmCombination !== original.polyrhythmCombination) {
    changes.polyrhythmCombination = current.polyrhythmCombination;
    hasChanges = true;
  }

  // Check timeSignature changes (nullable string comparison)
  if (current.timeSignature !== original.timeSignature) {
    changes.timeSignature = current.timeSignature;
    hasChanges = true;
  }

  // Check timeSignatureJourney changes (nullable string comparison)
  if (current.timeSignatureJourney !== original.timeSignatureJourney) {
    changes.timeSignatureJourney = current.timeSignatureJourney;
    hasChanges = true;
  }

  // Check moodCategory changes (passed separately, not part of AdvancedSelection)
  if (currentMoodCategory !== original.moodCategory) {
    changes.moodCategory = currentMoodCategory;
    hasChanges = true;
  }

  return hasChanges ? changes : undefined;
}

/**
 * Hook to determine refinement type based on current vs original selection and feedback text.
 * Uses useMemo for performance optimization.
 *
 * @param input - The input containing current state for refinement type detection
 * @returns Object with refinementType and styleChanges
 *
 * @example
 * ```typescript
 * const { refinementType, styleChanges } = useRefinementType({
 *   currentSelection: advancedSelection,
 *   originalSelection,
 *   feedbackText: pendingInput,
 *   lyricsMode,
 *   hasCurrentPrompt: !!currentPrompt,
 * });
 *
 * // refinementType: 'none' | 'style' | 'lyrics' | 'combined'
 * // styleChanges: StyleChanges | undefined
 * ```
 */
export function useRefinementType(input: UseRefinementTypeInput): UseRefinementTypeResult {
  const { currentSelection, originalSelection, feedbackText, lyricsMode, hasCurrentPrompt, moodCategory } = input;

  return useMemo((): UseRefinementTypeResult => {
    // Not in refine mode - no refinement possible
    if (!hasCurrentPrompt) {
      return { refinementType: 'none', styleChanges: undefined };
    }

    // Detect style changes (moodCategory is passed separately since it's not part of AdvancedSelection)
    const styleChanges = detectStyleChanges(currentSelection, originalSelection, moodCategory);
    const hasStyleChanges = styleChanges !== undefined;
    const hasFeedback = feedbackText.trim().length > 0;

    // Determine refinement type based on inputs
    let refinementType: RefinementType = 'none';

    if (hasStyleChanges && hasFeedback) {
      // Both style changes AND feedback text provided
      refinementType = 'combined';
    } else if (hasStyleChanges) {
      // Only style fields changed (no feedback)
      refinementType = 'style';
    } else if (hasFeedback && lyricsMode) {
      // Only feedback provided AND lyrics mode is ON
      refinementType = 'lyrics';
    } else if (hasFeedback && !lyricsMode) {
      // Feedback provided but lyrics mode is OFF - treat as style refinement
      refinementType = 'style';
    }
    // If none of the above, refinementType remains 'none'

    return { refinementType, styleChanges };
  }, [currentSelection, originalSelection, feedbackText, lyricsMode, hasCurrentPrompt, moodCategory]);
}
