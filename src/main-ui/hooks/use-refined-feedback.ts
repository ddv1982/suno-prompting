import { useCallback, useEffect, useRef, useState } from 'react';

import { APP_CONSTANTS } from '@shared/constants';

/**
 * Hook for managing refined success feedback state.
 * Shows a brief "refined" state after successful refinement, then resets.
 * Handles timeout cleanup on unmount to prevent memory leaks.
 *
 * Two usage patterns:
 * 1. Simple: Pass onRefine callback, use handleRefine wrapper
 * 2. Manual: Use triggerRefinedFeedback after your own async operation
 */
export interface UseRefinedFeedbackResult {
  refined: boolean;
  handleRefine: (feedback: string) => Promise<void>;
  triggerRefinedFeedback: () => void;
}

export function useRefinedFeedback(
  onRefine?: (feedback: string) => Promise<boolean>
): UseRefinedFeedbackResult {
  const [refined, setRefined] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  const triggerRefinedFeedback = useCallback((): void => {
    setRefined(true);
    timeoutRef.current = setTimeout(() => {
      setRefined(false);
    }, APP_CONSTANTS.UI.COPY_FEEDBACK_DURATION_MS);
  }, []);

  const handleRefine = useCallback(
    async (feedback: string): Promise<void> => {
      if (!onRefine) return;
      const success = await onRefine(feedback);
      if (success) {
        triggerRefinedFeedback();
      }
    },
    [onRefine, triggerRefinedFeedback]
  );

  return { refined, handleRefine, triggerRefinedFeedback };
}
