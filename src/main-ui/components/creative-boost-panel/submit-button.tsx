import { Dice3, Loader2, RefreshCw, Zap } from "lucide-react";

import { Button } from "@/components/ui/button";

import type { ReactNode } from "react";


type SubmitButtonProps = {
  isGenerating: boolean;
  isRefineMode: boolean;
  isDirectMode: boolean;
  canSubmit: boolean;
  onSubmit: () => void;
};

export function SubmitButton({
  isGenerating,
  isRefineMode,
  isDirectMode,
  canSubmit,
  onSubmit,
}: SubmitButtonProps): ReactNode {
  return (
    <Button
      onClick={onSubmit}
      disabled={!canSubmit || isGenerating}
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
