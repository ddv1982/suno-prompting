import { Check, Loader2, RefreshCw, Send } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

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
  refined?: boolean;
  onSubmit: () => void;
};

export function FullWidthSubmitButton({
  isGenerating,
  isRefineMode,
  disabled,
  refined = false,
  onSubmit,
}: FullWidthSubmitButtonProps): ReactElement {
  return (
    <Button
      onClick={onSubmit}
      disabled={disabled}
      className={cn(
        "w-full h-11 font-semibold text-[length:var(--text-footnote)] shadow-panel gap-2",
        refined && "bg-emerald-500/20 text-emerald-500 border-emerald-500/50 hover:bg-emerald-500/30 hover:text-emerald-400"
      )}
    >
      {isGenerating ? (
        <>
          <Loader2 className="w-4 h-4 animate-spin" />
          {isRefineMode ? "REFINING..." : "GENERATING..."}
        </>
      ) : refined ? (
        <>
          <Check className="w-4 h-4" />
          REFINED!
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
