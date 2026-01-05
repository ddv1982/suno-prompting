import { Sparkles } from "lucide-react";
import { useCallback, type ReactNode } from "react";

import { CategorySelector } from "@/components/category-selector";
import { SunoStylesMultiSelect } from "@/components/suno-styles-multi-select";
import { FormLabel } from "@/components/ui/form-label";
import { isSunoV5Style } from "@shared/suno-v5-styles";

import { DescriptionInput } from "./description-input";
import { SubmitButton } from "./submit-button";
import { TogglesSection } from "./toggles-section";

import type { QuickVibesCategory, QuickVibesInput } from "@shared/types";

type QuickVibesPanelProps = {
  input: QuickVibesInput; withWordlessVocals: boolean; maxMode: boolean;
  isGenerating: boolean; hasCurrentPrompt: boolean; onInputChange: (input: QuickVibesInput) => void;
  onWordlessVocalsChange: (value: boolean) => void; onMaxModeChange: (value: boolean) => void;
  onGenerate: () => void; onRefine: (feedback: string) => void;
};

export function QuickVibesPanel({
  input, withWordlessVocals, maxMode, isGenerating, hasCurrentPrompt,
  onInputChange, onWordlessVocalsChange, onMaxModeChange, onGenerate, onRefine,
}: QuickVibesPanelProps): ReactNode {
  const isRefineMode = hasCurrentPrompt;
  const isDirectMode = input.sunoStyles.length > 0;
  const canSubmit = isRefineMode 
    ? input.customDescription.trim().length > 0 || input.category !== null || isDirectMode
    : input.category !== null || input.customDescription.trim().length > 0 || isDirectMode;

  const handleCategorySelect = useCallback((categoryId: QuickVibesCategory | null): void => {
    if (categoryId !== null && input.sunoStyles.length > 0) {
      onInputChange({ ...input, category: categoryId, sunoStyles: [] });
    } else {
      onInputChange({ ...input, category: categoryId });
    }
  }, [input, onInputChange]);

  const handleSunoStylesChange = useCallback((styles: string[]): void => {
    const validStyles = styles.filter(isSunoV5Style);
    if (validStyles.length > 0 && input.category !== null) {
      onInputChange({ ...input, sunoStyles: validStyles, category: null });
    } else {
      onInputChange({ ...input, sunoStyles: validStyles });
    }
  }, [input, onInputChange]);

  const handleDescriptionChange = useCallback((value: string): void => {
    onInputChange({ ...input, customDescription: value });
  }, [input, onInputChange]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent): void => {
    if (e.key === "Enter" && !e.shiftKey && canSubmit && !isGenerating) {
      e.preventDefault();
      if (isRefineMode) {
        onRefine(input.customDescription);
      } else {
        onGenerate();
      }
    }
  }, [canSubmit, isGenerating, isRefineMode, input.customDescription, onRefine, onGenerate]);

  const handleSubmit = useCallback((): void => {
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

      <DescriptionInput
        value={input.customDescription}
        category={input.category}
        isRefineMode={isRefineMode}
        isDirectMode={isDirectMode}
        isGenerating={isGenerating}
        onChange={handleDescriptionChange}
        onKeyDown={handleKeyDown}
      />

      <TogglesSection
        withWordlessVocals={withWordlessVocals}
        maxMode={maxMode}
        isDirectMode={isDirectMode}
        isGenerating={isGenerating}
        onWordlessVocalsChange={onWordlessVocalsChange}
        onMaxModeChange={onMaxModeChange}
      />

      <SubmitButton
        isGenerating={isGenerating}
        isRefineMode={isRefineMode}
        canSubmit={canSubmit}
        onSubmit={handleSubmit}
      />
    </div>
  );
}
