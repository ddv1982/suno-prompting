import { Loader2, RefreshCw, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";

import type { ReactElement } from "react";


type SubmitButtonProps = {
  isGenerating: boolean;
  isRefineMode: boolean;
  canSubmit: boolean;
  onSubmit: () => void;
};

export function SubmitButton({
  isGenerating,
  isRefineMode,
  canSubmit,
  onSubmit,
}: SubmitButtonProps): ReactElement {
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
          REFINE
        </>
      ) : (
        <>
          <Sparkles className="w-4 h-4" />
          GENERATE QUICK VIBES
        </>
      )}
    </Button>
  );
}
