import { useCallback, type ReactElement } from "react";

import { AdvancedPanel } from "@/components/advanced-panel";
import { MoodCategoryCombobox } from "@/components/mood-category-combobox";
import { GenerationDisabledProvider } from "@/context/generation-disabled-context";
import { useOriginalSelection } from "@/hooks/use-original-selection";
import { useRefinedFeedback } from "@/hooks/use-refined-feedback";
import { useRefinementType } from "@/hooks/use-refinement-type";
import { canSubmitFullPrompt, canRefineFullPrompt } from "@shared/submit-validation";

import { FullWidthSubmitButton } from "./full-width-submit-button";
import { LockedPhraseInput } from "./locked-phrase-input";
import { MainInput } from "./main-input";
import { ModeToggle } from "./mode-toggle";
import { SongTopicInput } from "./song-topic-input";

import type { FullPromptInputPanelProps } from "./full-prompt-input-panel.types";

export type { FullPromptInputPanelProps };

export function FullPromptInputPanel(props: FullPromptInputPanelProps): ReactElement {
  const { currentPrompt, pendingInput, lockedPhrase, lyricsTopic, editorMode, advancedSelection, computedMusicPhrase,
    moodCategory, maxMode, lyricsMode, isGenerating, maxChars, lockedPhraseValidation, inputOverLimit, lyricsTopicOverLimit,
    hasAdvancedSelection, onPendingInputChange, onLockedPhraseChange, onLyricsTopicChange, onMoodCategoryChange, onEditorModeChange,
    onAdvancedSelectionUpdate, onAdvancedSelectionClear, onMaxModeChange, onLyricsModeChange, onGenerate, onConversionComplete } = props;

  const { refined, triggerRefinedFeedback } = useRefinedFeedback();

  // Track original selection and determine refinement type for change detection
  const originalSelection = useOriginalSelection(currentPrompt, advancedSelection, moodCategory);
  const { refinementType, styleChanges } = useRefinementType({
    currentSelection: advancedSelection, originalSelection, feedbackText: pendingInput, lyricsMode, hasCurrentPrompt: !!currentPrompt, moodCategory,
  });

  // Validation: initial generation uses canSubmitFullPrompt, refine mode uses canRefineFullPrompt
  const canSubmitContent = canSubmitFullPrompt({ description: pendingInput, lyricsTopic, lyricsMode, hasAdvancedSelection, sunoStyles: advancedSelection.sunoStyles });
  const canRefine = canRefineFullPrompt({ feedbackText: pendingInput, styleChanges, lyricsMode });
  const canSubmit = !isGenerating && !inputOverLimit && !lyricsTopicOverLimit && lockedPhraseValidation.isValid && (currentPrompt ? canRefine : canSubmitContent);

  const handleSend = useCallback(async (): Promise<void> => {
    if (!canSubmit) return;
    const isRefine = !!currentPrompt;
    const success = await onGenerate(pendingInput.trim(), refinementType, styleChanges);
    if (success && isRefine) {
      triggerRefinedFeedback();
    }
  }, [canSubmit, currentPrompt, pendingInput, refinementType, styleChanges, onGenerate, triggerRefinedFeedback]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent): void => {
    if (e.key === "Enter" && !e.shiftKey && canSubmit) { e.preventDefault(); void handleSend(); }
  }, [canSubmit, handleSend]);

  return (
    <GenerationDisabledProvider isDisabled={isGenerating}>
      <ModeToggle
        editorMode={editorMode}
        maxMode={maxMode}
        lyricsMode={lyricsMode}
        onEditorModeChange={onEditorModeChange}
        onMaxModeChange={onMaxModeChange}
        onLyricsModeChange={onLyricsModeChange}
      />

      {editorMode === 'advanced' && (
        <AdvancedPanel
          selection={advancedSelection}
          onUpdate={onAdvancedSelectionUpdate}
          onClear={onAdvancedSelectionClear}
          computedPhrase={computedMusicPhrase}
          moodCategory={moodCategory}
          onMoodCategoryChange={onMoodCategoryChange}
          isGenerating={isGenerating}
        />
      )}

      <LockedPhraseInput
        value={lockedPhrase}
        editorMode={editorMode}
        isGenerating={isGenerating}
        validation={lockedPhraseValidation}
        onChange={onLockedPhraseChange}
      />

      {editorMode === 'simple' && (
        <MoodCategoryCombobox
          value={moodCategory}
          onChange={onMoodCategoryChange}
          disabled={isGenerating}
          helperText="Influences the emotional tone of your prompt"
        />
      )}

      <MainInput
        value={pendingInput}
        currentPrompt={currentPrompt}
        lyricsMode={lyricsMode}
        maxMode={maxMode}
        isGenerating={isGenerating}
        maxChars={maxChars}
        inputOverLimit={inputOverLimit}
        hasAdvancedSelection={hasAdvancedSelection}
        onChange={onPendingInputChange}
        onSubmit={handleSend}
        onConversionComplete={onConversionComplete}
      />

      {lyricsMode && (
        <SongTopicInput
          value={lyricsTopic}
          isGenerating={isGenerating}
          hasCurrentPrompt={!!currentPrompt}
          isOverLimit={lyricsTopicOverLimit}
          onChange={onLyricsTopicChange}
          onKeyDown={handleKeyDown}
        />
      )}

      <FullWidthSubmitButton
        isGenerating={isGenerating}
        isRefineMode={!!currentPrompt}
        disabled={!canSubmit}
        refined={refined}
        onSubmit={handleSend}
      />
    </GenerationDisabledProvider>
  );
}
