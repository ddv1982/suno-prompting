import { Loader2, RefreshCw, Send } from "lucide-react";

import { Button } from "@/components/ui/button";

import type { ReactElement } from "react";

/**
 * Full-width submit button for Full Prompt mode.
 * Provides consistent UX with Creative Boost submit button.
 * Shows different states for generating/refining modes.
 */
type FullWidthSubmitButtonProps = {
  isGenerating: boolean;
  isRefineMode: boolean;
  disabled: boolean;
  onSubmit: () => void;
};

export function FullWidthSubmitButton({
  isGenerating,
  isRefineMode,
  disabled,
  onSubmit,
}: FullWidthSubmitButtonProps): ReactElement {
  return (
    <Button
      onClick={onSubmit}
      disabled={disabled}
      className="w-full h-11 font-semibold text-[length:var(--text-footnote)] shadow-panel gap-2"
    >
      {isGenerating ? (
        <>
          <Loader2 className="w-4 h-4 animate-spin" />
          {isRefineMode ? "REFINING..." : "GENERATING..."}
        </>
      ) : isRefineMode ? (
        <>
          <RefreshCw className="w-4 h-4" />
          REFINE
        </>
      ) : (
        <>
          <Send className="w-4 h-4" />
          GENERATE
        </>
      )}
    </Button>
  );
}
