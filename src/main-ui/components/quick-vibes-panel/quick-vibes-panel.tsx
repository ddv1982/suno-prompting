import { Sparkles } from "lucide-react";
import { useCallback, type ReactElement } from "react";

import { CategorySelector } from "@/components/category-selector";
import { MoodCategoryCombobox } from "@/components/mood-category-combobox";
import { SunoStylesMultiSelect } from "@/components/suno-styles-multi-select";
import { FormLabel } from "@/components/ui/form-label";
import { GenerationDisabledProvider } from "@/context/generation-disabled-context";
import { useRefinedFeedback } from "@/hooks/use-refined-feedback";
import { canSubmitQuickVibes, canRefineQuickVibes } from "@shared/submit-validation";
import { isSunoV5Style } from "@shared/suno-v5-styles";

import { DescriptionInput } from "./description-input";
import { SubmitButton } from "./submit-button";
import { TogglesSection } from "./toggles-section";

import type { MoodCategory } from "@bun/mood";
import type { QuickVibesCategory, QuickVibesInput } from "@shared/types";

function getCanSubmit(input: QuickVibesInput, originalInput: QuickVibesInput | null | undefined, isRefineMode: boolean): boolean {
  const submitInput = { category: input.category, customDescription: input.customDescription, sunoStyles: input.sunoStyles };
  if (!isRefineMode) return canSubmitQuickVibes(submitInput);
  return canRefineQuickVibes({
    ...submitInput,
    original: originalInput ? { category: originalInput.category, customDescription: originalInput.customDescription, sunoStyles: originalInput.sunoStyles } : null,
  });
}

type QuickVibesPanelProps = {
  input: QuickVibesInput; originalInput?: QuickVibesInput | null; withWordlessVocals: boolean; maxMode: boolean;
  isGenerating: boolean; hasCurrentPrompt: boolean; onInputChange: (input: QuickVibesInput) => void;
  onWordlessVocalsChange: (value: boolean) => void; onMaxModeChange: (value: boolean) => void;
  onGenerate: () => void; onRefine: (feedback: string) => Promise<boolean>;
};

export function QuickVibesPanel({
  input, originalInput, withWordlessVocals, maxMode, isGenerating, hasCurrentPrompt,
  onInputChange, onWordlessVocalsChange, onMaxModeChange, onGenerate, onRefine,
}: QuickVibesPanelProps): ReactElement {
  const isRefineMode = hasCurrentPrompt;
  const isDirectMode = input.sunoStyles.length > 0;
  const canSubmit = getCanSubmit(input, originalInput, isRefineMode);

  const { refined, handleRefine } = useRefinedFeedback(onRefine);

  const handleCategorySelect = useCallback((categoryId: QuickVibesCategory | null): void => {
    onInputChange(categoryId !== null && input.sunoStyles.length > 0
      ? { ...input, category: categoryId, sunoStyles: [] }
      : { ...input, category: categoryId });
  }, [input, onInputChange]);

  const handleSunoStylesChange = useCallback((styles: string[]): void => {
    const validStyles = styles.filter(isSunoV5Style);
    onInputChange(validStyles.length > 0 && input.category !== null
      ? { ...input, sunoStyles: validStyles, category: null }
      : { ...input, sunoStyles: validStyles });
  }, [input, onInputChange]);

  const handleDescriptionChange = useCallback((value: string): void => { onInputChange({ ...input, customDescription: value }); }, [input, onInputChange]);

  const handleMoodCategoryChange = useCallback((category: MoodCategory | null): void => {
    onInputChange({ ...input, moodCategory: category });
  }, [input, onInputChange]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent): void => {
    if (e.key === "Enter" && !e.shiftKey && canSubmit && !isGenerating) {
      e.preventDefault();
      if (isRefineMode) void handleRefine(input.customDescription); else onGenerate();
    }
  }, [canSubmit, isGenerating, isRefineMode, input.customDescription, handleRefine, onGenerate]);

  const handleSubmit = useCallback((): void => { if (isRefineMode) void handleRefine(input.customDescription); else onGenerate(); }, [isRefineMode, input.customDescription, handleRefine, onGenerate]);

  return (
    <GenerationDisabledProvider isDisabled={isGenerating}>
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

        {/* Mood Category Selection */}
        <MoodCategoryCombobox
          value={input.moodCategory}
          onChange={handleMoodCategoryChange}
          disabled={isGenerating}
          helperText="Injects moods from this category into your prompt"
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
          refined={refined}
          onSubmit={handleSubmit}
        />
      </div>
    </GenerationDisabledProvider>
  );
}
