import { Sparkles } from "lucide-react";
import { useCallback, type ReactElement } from "react";

import { CategorySelector } from "@/components/category-selector";
import { MoodCategoryCombobox } from "@/components/mood-category-combobox";
import { SunoStylesMultiSelect } from "@/components/suno-styles-multi-select";
import { FormLabel } from "@/components/ui/form-label";
import { useRefinedFeedback } from "@/hooks/use-refined-feedback";
import { QuickVibesSubmitSchema, QuickVibesRefineSchema } from "@shared/schemas/submit-validation";
import { isSunoV5Style } from "@shared/suno-v5-styles";

import { DescriptionInput } from "./description-input";
import { SubmitButton } from "./submit-button";
import { TogglesSection } from "./toggles-section";

import type { MoodCategory } from "@bun/mood";
import type { QuickVibesCategory, QuickVibesInput } from "@shared/types";

function getCanSubmit(input: QuickVibesInput, originalInput: QuickVibesInput | null | undefined, isRefineMode: boolean): boolean {
  const submitInput = { category: input.category, customDescription: input.customDescription, sunoStyles: input.sunoStyles };
  if (!isRefineMode) return QuickVibesSubmitSchema.safeParse(submitInput).success;
  return QuickVibesRefineSchema.safeParse({
    ...submitInput,
    original: originalInput ? { category: originalInput.category, customDescription: originalInput.customDescription, sunoStyles: originalInput.sunoStyles } : null,
  }).success;
}

interface QuickVibesPanelProps {
  input: QuickVibesInput; originalInput?: QuickVibesInput | null; withWordlessVocals: boolean; maxMode: boolean;
  isGenerating: boolean; hasCurrentPrompt: boolean; onInputChange: (input: QuickVibesInput) => void;
  onWordlessVocalsChange: (value: boolean) => void; onMaxModeChange: (value: boolean) => void;
  onGenerate: () => void; onRefine: (feedback: string) => Promise<boolean>;
}

interface QuickVibesPanelHandlers {
  refined: boolean;
  handleCategorySelect: (categoryId: QuickVibesCategory | null) => void;
  handleSunoStylesChange: (styles: string[]) => void;
  handleDescriptionChange: (value: string) => void;
  handleMoodCategoryChange: (category: MoodCategory | null) => void;
  handleKeyDown: (event: React.KeyboardEvent) => void;
  handleSubmit: () => void;
}

interface QuickVibesPanelState {
  isRefineMode: boolean;
  isDirectMode: boolean;
  canSubmit: boolean;
}

interface QuickVibesHandlerArgs {
  input: QuickVibesInput;
  isRefineMode: boolean;
  isGenerating: boolean;
  canSubmit: boolean;
  onInputChange: (input: QuickVibesInput) => void;
  onGenerate: () => void;
  onRefine: (feedback: string) => Promise<boolean>;
}

function useQuickVibesPanelHandlers({ input, isRefineMode, isGenerating, canSubmit, onInputChange, onGenerate, onRefine }: QuickVibesHandlerArgs): QuickVibesPanelHandlers {
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

  const handleKeyDown = useCallback((event: React.KeyboardEvent): void => {
    if (event.key === "Enter" && !event.shiftKey && canSubmit && !isGenerating) {
      event.preventDefault();
      if (isRefineMode) void handleRefine(input.customDescription); else onGenerate();
    }
  }, [canSubmit, isGenerating, isRefineMode, input.customDescription, handleRefine, onGenerate]);

  const handleSubmit = useCallback((): void => {
    if (isRefineMode) void handleRefine(input.customDescription); else onGenerate();
  }, [isRefineMode, input.customDescription, handleRefine, onGenerate]);

  return {
    refined,
    handleCategorySelect,
    handleSunoStylesChange,
    handleDescriptionChange,
    handleMoodCategoryChange,
    handleKeyDown,
    handleSubmit,
  };
}

interface QuickVibesPanelContentProps {
  input: QuickVibesInput;
  state: QuickVibesPanelState;
  handlers: QuickVibesPanelHandlers;
  withWordlessVocals: boolean;
  maxMode: boolean;
  isGenerating: boolean;
  onWordlessVocalsChange: (value: boolean) => void;
  onMaxModeChange: (value: boolean) => void;
}

function QuickVibesPanelContent({
  input,
  state,
  handlers,
  withWordlessVocals,
  maxMode,
  isGenerating,
  onWordlessVocalsChange,
  onMaxModeChange,
}: QuickVibesPanelContentProps): ReactElement {
  const { isRefineMode, isDirectMode, canSubmit } = state;

  return (
    <div className="space-y-[var(--space-5)]">
      <div className="space-y-2">
        <FormLabel
          icon={<Sparkles className="w-3 h-3" />}
          badge={isDirectMode ? "disabled" : "optional"}
        >
          {isRefineMode ? "Refine toward category" : "Category"}
        </FormLabel>
        <CategorySelector
          selectedCategory={input.category}
          onSelect={handlers.handleCategorySelect}
          disabled={isDirectMode}
        />
        {isDirectMode && (
          <p className="ui-helper">
            Disabled when Suno V5 Styles are selected
          </p>
        )}
      </div>

      <SunoStylesMultiSelect
        selected={input.sunoStyles}
        onChange={handlers.handleSunoStylesChange}
        maxSelections={4}
        disabled={input.category !== null}
        helperText={
          input.category !== null
            ? "Disabled when Category is selected"
            : isDirectMode
              ? "Selected styles will be used exactly as-is"
              : undefined
        }
        badgeText={input.category !== null ? "disabled" : "optional"}
      />

      <MoodCategoryCombobox
        value={input.moodCategory}
        onChange={handlers.handleMoodCategoryChange}
        helperText="Injects moods from this category into your prompt"
      />

      <DescriptionInput
        value={input.customDescription}
        category={input.category}
        isRefineMode={isRefineMode}
        isDirectMode={isDirectMode}
        onChange={handlers.handleDescriptionChange}
        onKeyDown={handlers.handleKeyDown}
      />

      <TogglesSection
        withWordlessVocals={withWordlessVocals}
        maxMode={maxMode}
        isDirectMode={isDirectMode}
        onWordlessVocalsChange={onWordlessVocalsChange}
        onMaxModeChange={onMaxModeChange}
      />

      <SubmitButton
        isGenerating={isGenerating}
        isRefineMode={isRefineMode}
        canSubmit={canSubmit}
        refined={handlers.refined}
        onSubmit={handlers.handleSubmit}
      />
    </div>
  );
}

export function QuickVibesPanel({
  input,
  originalInput,
  withWordlessVocals,
  maxMode,
  isGenerating,
  hasCurrentPrompt,
  onInputChange,
  onWordlessVocalsChange,
  onMaxModeChange,
  onGenerate,
  onRefine,
}: QuickVibesPanelProps): ReactElement {
  const isRefineMode = hasCurrentPrompt;
  const isDirectMode = input.sunoStyles.length > 0;
  const canSubmit = getCanSubmit(input, originalInput, isRefineMode);

  const handlers = useQuickVibesPanelHandlers({
    input,
    isRefineMode,
    isGenerating,
    canSubmit,
    onInputChange,
    onGenerate,
    onRefine,
  });

  return (
    <QuickVibesPanelContent
      input={input}
      state={{ isRefineMode, isDirectMode, canSubmit }}
      handlers={handlers}
      withWordlessVocals={withWordlessVocals}
      maxMode={maxMode}
      isGenerating={isGenerating}
      onWordlessVocalsChange={onWordlessVocalsChange}
      onMaxModeChange={onMaxModeChange}
    />
  );
}
