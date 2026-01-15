/**
 * LLM Unavailable Notice Component
 *
 * Displays an info icon with tooltip when LLM is unavailable,
 * providing a clickable action to open settings.
 *
 * @module components/shared/llm-unavailable-notice
 */

import { Info } from "lucide-react";

import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useSettingsContext } from "@/context/settings-context";

import type { ReactElement } from "react";

interface LLMUnavailableNoticeProps {
  /** Show "Configure AI in Settings" text alongside the icon */
  showText?: boolean;
}

/**
 * Notice component that displays when LLM is unavailable.
 * Shows an info icon with tooltip, clicking opens settings modal.
 */
export function LLMUnavailableNotice({
  showText = false,
}: LLMUnavailableNoticeProps): ReactElement | null {
  const { isLLMAvailable, openSettings } = useSettingsContext();

  if (isLLMAvailable) return null;

  return (
    <div className="flex items-center gap-1.5 text-muted-foreground">
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type="button"
            onClick={openSettings}
            className="inline-flex items-center gap-1 hover:text-foreground transition-colors"
          >
            <Info className="w-3.5 h-3.5" />
            {showText && (
              <span className="text-[length:var(--text-caption)]">Configure AI in Settings</span>
            )}
          </button>
        </TooltipTrigger>
        <TooltipContent>
          <p>Configure AI in Settings to generate</p>
        </TooltipContent>
      </Tooltip>
    </div>
  );
}
