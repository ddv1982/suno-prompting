/**
 * Panel Submit Button Component
 *
 * Unified submit button for Creative Boost and Quick Vibes panels.
 *
 * @module components/shared/panel-submit-button
 */

import { Loader2, RefreshCw } from "lucide-react";

import { Button } from "@/components/ui/button";

import type { PanelSubmitButtonProps } from "./types";
import type { ReactElement } from "react";

/**
 * Unified submit button for panel components.
 * Displays different states based on generation progress, mode, and refine state.
 */
export function PanelSubmitButton({
  isGenerating,
  isRefineMode,
  isDirectMode = false,
  canSubmit,
  onSubmit,
  defaultIcon,
  defaultLabel = "GENERATE",
  directModeIcon,
  directModeLabel = "USE SELECTED STYLES",
  refineLabel = "REFINE",
  refineDirectModeLabel = "REFINE TITLE & LYRICS",
}: PanelSubmitButtonProps): ReactElement {
  const getContent = (): ReactElement => {
    if (isGenerating) {
      return (
        <>
          <Loader2 className="w-4 h-4 animate-spin" />
          {isRefineMode ? "REFINING..." : "GENERATING..."}
        </>
      );
    }

    if (isRefineMode) {
      return (
        <>
          <RefreshCw className="w-4 h-4" />
          {isDirectMode ? refineDirectModeLabel : refineLabel}
        </>
      );
    }

    if (isDirectMode && directModeIcon) {
      return (
        <>
          {directModeIcon}
          {directModeLabel}
        </>
      );
    }

    return (
      <>
        {defaultIcon}
        {defaultLabel}
      </>
    );
  };

  return (
    <Button
      onClick={onSubmit}
      disabled={!canSubmit || isGenerating}
      className="w-full h-11 font-semibold text-[length:var(--text-footnote)] shadow-panel gap-2"
    >
      {getContent()}
    </Button>
  );
}
