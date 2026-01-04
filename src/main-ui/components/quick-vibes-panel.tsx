import { Sparkles, Loader2, MessageSquare, Mic, RefreshCw, Zap } from "lucide-react";
import { useCallback } from "react";

import { CategorySelector } from "@/components/category-selector";
import { SunoStylesMultiSelect } from "@/components/suno-styles-multi-select";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FormLabel } from "@/components/ui/form-label";
import { Textarea } from "@/components/ui/textarea";
import { ToggleRow } from "@/components/ui/toggle-row";
import { cn } from "@/lib/utils";
import { APP_CONSTANTS, getMaxModeHelperText } from "@shared/constants";
import { QUICK_VIBES_CATEGORIES } from "@shared/quick-vibes-categories";
import { isSunoV5Style } from "@shared/suno-v5-styles";

import type { QuickVibesCategory, QuickVibesInput } from "@shared/types";

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

type QuickVibesPanelProps = {
  input: QuickVibesInput;
  withWordlessVocals: boolean;
  maxMode: boolean;
  isGenerating: boolean;
  hasCurrentPrompt: boolean;
  onInputChange: (input: QuickVibesInput) => void;
  onWordlessVocalsChange: (value: boolean) => void;
  onMaxModeChange: (value: boolean) => void;
  onGenerate: () => void;
  onRefine: (feedback: string) => void;
};

export function QuickVibesPanel({
  input,
  withWordlessVocals,
  maxMode,
  isGenerating,
  hasCurrentPrompt,
  onInputChange,
  onWordlessVocalsChange,
  onMaxModeChange,
  onGenerate,
  onRefine,
}: QuickVibesPanelProps) {
  const charCount = input.customDescription.length;
  const isRefineMode = hasCurrentPrompt;
  const isDirectMode = input.sunoStyles.length > 0;
  const canSubmit = isRefineMode 
    ? input.customDescription.trim().length > 0 || input.category !== null || isDirectMode
    : input.category !== null || input.customDescription.trim().length > 0 || isDirectMode;

  const handleCategorySelect = useCallback((categoryId: QuickVibesCategory | null) => {
    // Clear suno styles when category is selected (mutual exclusivity)
    if (categoryId !== null && input.sunoStyles.length > 0) {
      onInputChange({ ...input, category: categoryId, sunoStyles: [] });
    } else {
      onInputChange({ ...input, category: categoryId });
    }
  }, [input, onInputChange]);

  const handleSunoStylesChange = useCallback((styles: string[]) => {
    // Validate all styles are valid Suno V5 styles
    const validStyles = styles.filter(isSunoV5Style);
    // Clear category when suno styles are selected (mutual exclusivity)
    if (validStyles.length > 0 && input.category !== null) {
      onInputChange({ ...input, sunoStyles: validStyles, category: null });
    } else {
      onInputChange({ ...input, sunoStyles: validStyles });
    }
  }, [input, onInputChange]);

  const handleDescriptionChange = useCallback((value: string) => {
    onInputChange({ ...input, customDescription: value });
  }, [input, onInputChange]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey && canSubmit && !isGenerating) {
      e.preventDefault();
      if (isRefineMode) {
        onRefine(input.customDescription);
      } else {
        onGenerate();
      }
    }
  }, [canSubmit, isGenerating, isRefineMode, input.customDescription, onRefine, onGenerate]);

  const handleSubmit = useCallback(() => {
    if (isRefineMode) {
      onRefine(input.customDescription);
    } else {
      onGenerate();
    }
  }, [isRefineMode, input.customDescription, onRefine, onGenerate]);

  return (
    <div className="space-y-[var(--space-5)]">
      {/* Category Selection */}
      <div className="space-y-2">
        <FormLabel 
          icon={<Sparkles className="w-3 h-3" />} 
          badge={isDirectMode ? "disabled" : "optional"}
        >
          {isRefineMode ? "Refine toward category" : "Category"}
        </FormLabel>
        <CategorySelector
          selectedCategory={input.category}
          onSelect={handleCategorySelect}
          disabled={isGenerating || isDirectMode}
        />
        {isDirectMode && (
          <p className="ui-helper">
            Disabled when Suno V5 Styles are selected
          </p>
        )}
      </div>

      {/* Suno V5 Styles Multi-Select */}
      <SunoStylesMultiSelect
        selected={input.sunoStyles}
        onChange={handleSunoStylesChange}
        maxSelections={4}
        disabled={isGenerating || input.category !== null}
        helperText={
          input.category !== null
            ? "Disabled when Category is selected"
            : isDirectMode
              ? "Selected styles will be used exactly as-is"
              : undefined
        }
        badgeText={input.category !== null ? "disabled" : "optional"}
      />

      {/* Description / Feedback Input */}
      <div className="space-y-1">
        <div className="flex items-center justify-between">
          <FormLabel 
            icon={<MessageSquare className="w-3 h-3" />} 
            badge={isRefineMode ? undefined : "optional"}
          >
            {isRefineMode 
              ? "Refine the vibe" 
              : isDirectMode 
                ? "Describe the vibe (for title)" 
                : "Describe the vibe"}
          </FormLabel>
          <Badge
            variant="secondary"
            className="ui-badge font-mono h-5"
          >
            {charCount} / {APP_CONSTANTS.QUICK_VIBES_MAX_CHARS}
          </Badge>
        </div>
        <Textarea
          value={input.customDescription}
          onChange={(e) => { handleDescriptionChange(e.target.value); }}
          onKeyDown={handleKeyDown}
          disabled={isGenerating}
          className={cn(
            "min-h-20 resize-none text-[length:var(--text-footnote)] p-4 rounded-xl bg-surface",
            isGenerating && "opacity-70"
          )}
          placeholder={isRefineMode 
            ? isDirectMode
              ? "Update the description to regenerate the title..."
              : "How should the vibe change? (e.g., 'more dreamy', 'add rain sounds', 'slower tempo')"
            : isDirectMode
              ? "Describe the vibe for title generation (optional - will use styles if empty)..."
              : "e.g., mellow afternoon coding session, rainy window coffee shop, late night study vibes..."
          }
        />
        <p className="ui-helper">
          {getDescriptionHelperText(isRefineMode, isDirectMode, input.category)}
        </p>
      </div>

      {/* Toggles Section */}
      <div className="space-y-1 border-t border-border/50 pt-[var(--space-4)]">
        <ToggleRow
          id="qv-wordless-vocals"
          icon={<Mic className="w-3.5 h-3.5" />}
          label="Wordless vocals"
          helperText="(humming, oohs)"
          checked={isDirectMode ? false : withWordlessVocals}
          onChange={onWordlessVocalsChange}
          disabled={isGenerating || isDirectMode}
          showNaBadge={isDirectMode}
        />
        <ToggleRow
          id="qv-max-mode"
          icon={<Zap className="w-3.5 h-3.5" />}
          label="Max Mode"
          checked={isDirectMode ? false : maxMode}
          onChange={onMaxModeChange}
          disabled={isGenerating || isDirectMode}
          showNaBadge={isDirectMode}
        />
        <p className="ui-helper pl-6">{getMaxModeHelperText(isDirectMode, maxMode)}</p>
      </div>

      {/* Generate / Refine Button */}
      <Button
        onClick={handleSubmit}
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
    </div>
  );
}
