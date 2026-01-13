import { Check, Dice3, Loader2, RefreshCw, Zap } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import type { ReactElement } from "react";


type SubmitButtonProps = {
  isGenerating: boolean;
  isRefineMode: boolean;
  isDirectMode: boolean;
  canSubmit: boolean;
  refined?: boolean;
  onSubmit: () => void;
};

export function SubmitButton({
  isGenerating,
  isRefineMode,
  isDirectMode,
  canSubmit,
  refined = false,
  onSubmit,
}: SubmitButtonProps): ReactElement {
  return (
    <Button
      onClick={onSubmit}
      disabled={!canSubmit || isGenerating}
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
          {isDirectMode ? "REFINE TITLE & LYRICS" : "REFINE"}
        </>
      ) : isDirectMode ? (
        <>
          <Zap className="w-4 h-4" />
          USE SELECTED STYLES
        </>
      ) : (
        <>
          <Dice3 className="w-4 h-4" />
          GENERATE CREATIVE BOOST
        </>
      )}
    </Button>
  );
}
