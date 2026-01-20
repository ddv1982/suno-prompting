import { Check, Loader2, RefreshCw, Send } from "lucide-react";

import { LLMUnavailableNotice } from "@/components/shared/llm-unavailable-notice";
import { Button } from "@/components/ui/button";
import { useSettingsContext } from "@/context/settings-context";
import { cn } from "@/lib/utils";

import type { ReactElement } from "react";

/**
 * Full-width submit button for Full Prompt mode.
 * Provides consistent UX with Creative Boost submit button.
 * Shows different states for generating/refining modes.
 */
interface FullWidthSubmitButtonProps {
  isGenerating: boolean;
  isRefineMode: boolean;
  disabled: boolean;
  refined?: boolean;
  onSubmit: () => void;
}

export function FullWidthSubmitButton({
  isGenerating,
  isRefineMode,
  disabled,
  refined = false,
  onSubmit,
}: FullWidthSubmitButtonProps): ReactElement {
  const { isLLMAvailable } = useSettingsContext();

  return (
    <div className="flex flex-col gap-2">
      <Button
        onClick={onSubmit}
        disabled={disabled || !isLLMAvailable}
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
      {!isLLMAvailable && <LLMUnavailableNotice showText />}
    </div>
  );
}
