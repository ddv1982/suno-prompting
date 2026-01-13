import { useRef, useEffect } from 'react';

import type { MoodCategory } from '@bun/mood';
import type { AdvancedSelection, OriginalAdvancedSelection } from '@shared/types';

/**
 * Hook to track the original advanced selection when a prompt is generated.
 * Uses useRef to avoid unnecessary re-renders when capturing the selection.
 *
 * @param currentPrompt - The current prompt text (truthy when in refine mode)
 * @param advancedSelection - The current advanced selection state
 * @param moodCategory - The current mood category (not part of AdvancedSelection)
 * @returns The original selection captured at generation time, or null if no prompt exists
 *
 * @example
 * ```typescript
 * const originalSelection = useOriginalSelection(currentPrompt, advancedSelection, moodCategory);
 *
 * // originalSelection is null when no currentPrompt
 * // originalSelection captures advancedSelection when currentPrompt becomes truthy
 * // originalSelection resets to null when currentPrompt is cleared
 * ```
 */
export function useOriginalSelection(
  currentPrompt: string,
  advancedSelection: AdvancedSelection,
  moodCategory: MoodCategory | null
): OriginalAdvancedSelection | null {
  const originalRef = useRef<OriginalAdvancedSelection | null>(null);
  const prevPromptRef = useRef<string>('');

  useEffect(() => {
    const hadPrompt = !!prevPromptRef.current;
    const hasPrompt = !!currentPrompt;

    // Capture selection when a new prompt is generated (transition from no prompt to has prompt)
    if (!hadPrompt && hasPrompt) {
      originalRef.current = {
        // Array fields (copy to avoid reference issues)
        seedGenres: [...advancedSelection.seedGenres],
        sunoStyles: [...advancedSelection.sunoStyles],
        // Nullable string fields from AdvancedSelection
        harmonicStyle: advancedSelection.harmonicStyle,
        harmonicCombination: advancedSelection.harmonicCombination,
        polyrhythmCombination: advancedSelection.polyrhythmCombination,
        timeSignature: advancedSelection.timeSignature,
        timeSignatureJourney: advancedSelection.timeSignatureJourney,
        // moodCategory is passed separately (not part of AdvancedSelection)
        moodCategory,
      };
    }

    // Reset when prompt is cleared (transition from has prompt to no prompt)
    if (hadPrompt && !hasPrompt) {
      originalRef.current = null;
    }

    // Track previous prompt state
    prevPromptRef.current = currentPrompt;
  }, [
    currentPrompt,
    advancedSelection.seedGenres,
    advancedSelection.sunoStyles,
    advancedSelection.harmonicStyle,
    advancedSelection.harmonicCombination,
    advancedSelection.polyrhythmCombination,
    advancedSelection.timeSignature,
    advancedSelection.timeSignatureJourney,
    moodCategory,
  ]);

  return originalRef.current;
}
