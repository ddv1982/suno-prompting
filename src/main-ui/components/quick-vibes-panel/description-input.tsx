import { MessageSquare } from "lucide-react";


import { Badge } from "@/components/ui/badge";
import { FormLabel } from "@/components/ui/form-label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { APP_CONSTANTS } from "@shared/constants";
import { QUICK_VIBES_CATEGORIES } from "@shared/quick-vibes-categories";

import type { QuickVibesCategory } from "@shared/types";
import type { ReactElement } from "react";

const getCategoryLabel = (categoryId: QuickVibesCategory): string => {
  return QUICK_VIBES_CATEGORIES[categoryId]?.label ?? categoryId;
};

const getDescriptionHelperText = (
  isRefineMode: boolean,
  isDirectMode: boolean,
  category: QuickVibesCategory | null
): string => {
  if (isRefineMode) {
    if (category) return `Will refine toward "${getCategoryLabel(category)}". Add feedback or leave blank.`;
    if (isDirectMode) return "Update Suno V5 styles above and/or update the description to regenerate the title.";
    return "Describe how you'd like to adjust the current vibe, or select a category above.";
  }
  if (isDirectMode) return "Used to generate a title. Styles are output exactly as selected.";
  if (category) return `Category "${getCategoryLabel(category)}" selected. Add custom details or leave blank.`;
  return "Describe the mood, setting, or activity for your music.";
};

type DescriptionInputProps = {
  value: string;
  category: QuickVibesCategory | null;
  isRefineMode: boolean;
  isDirectMode: boolean;
  isGenerating: boolean;
  onChange: (value: string) => void;
  onKeyDown: (e: React.KeyboardEvent) => void;
};

export function DescriptionInput({
  value,
  category,
  isRefineMode,
  isDirectMode,
  isGenerating,
  onChange,
  onKeyDown,
}: DescriptionInputProps): ReactElement {
  const charCount = value.length;

  const getPlaceholder = (): string => {
    if (isRefineMode) {
      return isDirectMode
        ? "Update the description to regenerate the title..."
        : "How should the vibe change? (e.g., 'more dreamy', 'add rain sounds', 'slower tempo')";
    }
    return isDirectMode
      ? "Describe the vibe for title generation (optional - will use styles if empty)..."
      : "e.g., mellow afternoon coding session, rainy window coffee shop, late night study vibes...";
  };

  const getLabel = (): string => {
    if (isRefineMode) return "Refine the vibe";
    if (isDirectMode) return "Describe the vibe (for title)";
    return "Describe the vibe";
  };

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <FormLabel 
          icon={<MessageSquare className="w-3 h-3" />} 
          badge={isRefineMode ? undefined : "optional"}
        >
          {getLabel()}
        </FormLabel>
        <Badge
          variant="secondary"
          className="ui-badge font-mono h-5"
        >
          {charCount} / {APP_CONSTANTS.QUICK_VIBES_MAX_CHARS}
        </Badge>
      </div>
      <Textarea
        value={value}
        onChange={(e): void => { onChange(e.target.value); }}
        onKeyDown={onKeyDown}
        disabled={isGenerating}
        maxLength={APP_CONSTANTS.QUICK_VIBES_MAX_CHARS}
        className={cn(
          "min-h-20 resize-none text-[length:var(--text-footnote)] p-4 rounded-xl bg-surface",
          isGenerating && "opacity-70"
        )}
        placeholder={getPlaceholder()}
      />
      <p className="ui-helper">
        {getDescriptionHelperText(isRefineMode, isDirectMode, category)}
      </p>
    </div>
  );
}
