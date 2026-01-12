/**
 * Panel Description Input Component
 *
 * Unified description/feedback text input for panels.
 *
 * @module components/shared/panel-description-input
 */

import { MessageSquare } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { FormLabel } from "@/components/ui/form-label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

import type { PanelDescriptionInputProps } from "./types";
import type { ReactElement } from "react";

/**
 * Unified description/feedback input for panel components.
 * Adapts labels, placeholders, and helper text based on mode.
 */
export function PanelDescriptionInput({
  value,
  isRefineMode,
  isDirectMode,
  isGenerating,
  onChange,
  onKeyDown,
  maxChars,
  defaultPlaceholder = "Describe what you want...",
  refinePlaceholder = "How should it change?",
  directModePlaceholder = "Description not used with selected styles",
  defaultHelperText = "Optionally describe the style or direction.",
  refineHelperText = "Describe how you'd like to adjust the output.",
  directModeHelperText = "Description is not used when styles are selected.",
  defaultLabel = "Description",
  refineLabel = "Refine feedback",
  badge = "optional",
  disableInDirectMode = true,
}: PanelDescriptionInputProps): ReactElement {
  const charCount = value.length;
  const isDisabled = isGenerating || (disableInDirectMode && isDirectMode && !isRefineMode);

  const getPlaceholder = (): string => {
    if (isRefineMode) return refinePlaceholder;
    if (isDirectMode) return directModePlaceholder;
    return defaultPlaceholder;
  };

  const getHelperText = (): string => {
    if (isRefineMode) return refineHelperText;
    if (isDirectMode) return directModeHelperText;
    return defaultHelperText;
  };

  const getLabel = (): string => {
    return isRefineMode ? refineLabel : defaultLabel;
  };

  const getBadge = (): string | undefined => {
    if (isDirectMode && !isRefineMode) return "disabled";
    return badge;
  };

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <FormLabel
          icon={<MessageSquare className="w-3 h-3" />}
          badge={getBadge()}
        >
          {getLabel()}
        </FormLabel>
        <Badge variant="secondary" className="ui-badge font-mono h-5">
          {charCount} / {maxChars}
        </Badge>
      </div>
      <Textarea
        value={value}
        onChange={(e): void => { onChange(e.target.value); }}
        onKeyDown={onKeyDown}
        disabled={isDisabled}
        maxLength={maxChars}
        className={cn(
          "min-h-20 resize-none text-[length:var(--text-footnote)] p-4 rounded-xl bg-surface",
          isDisabled && "opacity-70"
        )}
        placeholder={getPlaceholder()}
      />
      <p className="ui-helper">
        {getHelperText()}
      </p>
    </div>
  );
}
