/**
 * Hook for copy-to-clipboard functionality with visual feedback.
 * @module hooks/use-copy-to-clipboard
 */

import { useState, useCallback } from 'react';

import { APP_CONSTANTS } from '@shared/constants';

interface UseCopyToClipboardOptions {
  /** Duration in ms to show "copied" feedback. Defaults to APP_CONSTANTS.UI.COPY_FEEDBACK_DURATION_MS */
  feedbackDuration?: number;
}

interface UseCopyToClipboardResult {
  /** Whether the content was recently copied */
  copied: boolean;
  /** Copy text to clipboard and trigger feedback state */
  copy: (text: string) => Promise<void>;
}

/**
 * Hook for copying text to clipboard with automatic feedback state.
 *
 * @example
 * ```tsx
 * const { copied, copy } = useCopyToClipboard();
 *
 * return (
 *   <Button onClick={() => copy(text)}>
 *     {copied ? 'Copied!' : 'Copy'}
 *   </Button>
 * );
 * ```
 */
export function useCopyToClipboard(
  options: UseCopyToClipboardOptions = {}
): UseCopyToClipboardResult {
  const { feedbackDuration = APP_CONSTANTS.UI.COPY_FEEDBACK_DURATION_MS } = options;
  const [copied, setCopied] = useState(false);

  const copy = useCallback(
    async (text: string): Promise<void> => {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => {
        setCopied(false);
      }, feedbackDuration);
    },
    [feedbackDuration]
  );

  return { copied, copy };
}
