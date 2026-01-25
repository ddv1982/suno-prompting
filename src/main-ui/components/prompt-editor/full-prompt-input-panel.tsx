import { useCallback, type ReactElement } from "react";

import { AdvancedPanel } from "@/components/advanced-panel";
import { MoodCategoryCombobox } from "@/components/mood-category-combobox";
import { useOriginalSelection } from "@/hooks/use-original-selection";
import { useRefinedFeedback } from "@/hooks/use-refined-feedback";
import { useRefinementType } from "@/hooks/use-refinement-type";
import { FullPromptSubmitSchema, FullPromptRefineSchema } from "@shared/schemas/submit-validation";

import { FullWidthSubmitButton } from "./full-width-submit-button";
import { LockedPhraseInput } from "./locked-phrase-input";
import { MainInput } from "./main-input";
import { ModeToggle } from "./mode-toggle";
import { SongTopicInput } from "./song-topic-input";

import type { FullPromptInputPanelProps } from "./full-prompt-input-panel.types";

export type { FullPromptInputPanelProps };

export function FullPromptInputPanel(props: FullPromptInputPanelProps): ReactElement {
  const { currentPrompt, pendingInput, lockedPhrase, lyricsTopic, editorMode, advancedSelection, computedMusicPhrase,
    moodCategory, maxMode, lyricsMode, storyMode, isGenerating, maxChars, lockedPhraseValidation, inputOverLimit, lyricsTopicOverLimit,
    hasAdvancedSelection, onPendingInputChange, onLockedPhraseChange, onLyricsTopicChange, onMoodCategoryChange, onEditorModeChange,
    onAdvancedSelectionUpdate, onAdvancedSelectionClear, onMaxModeChange, onLyricsModeChange, onStoryModeChange, onGenerate, onConversionComplete } = props;

  const { refined, triggerRefinedFeedback } = useRefinedFeedback();

  // Track original selection and determine refinement type for change detection
  const originalSelection = useOriginalSelection(currentPrompt, advancedSelection, moodCategory);
  const { refinementType, styleChanges } = useRefinementType({
    currentSelection: advancedSelection, originalSelection, feedbackText: pendingInput, lyricsMode, hasCurrentPrompt: !!currentPrompt, moodCategory,
  });

  // Validation: initial generation uses FullPromptSubmitSchema, refine mode uses FullPromptRefineSchema
  const canSubmitContent = FullPromptSubmitSchema.safeParse({ description: pendingInput, lyricsTopic, lyricsMode, hasAdvancedSelection, sunoStyles: advancedSelection.sunoStyles }).success;
  const canRefine = FullPromptRefineSchema.safeParse({ feedbackText: pendingInput, styleChanges, lyricsMode }).success;
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
    <>
      <ModeToggle
        editorMode={editorMode}
        maxMode={maxMode}
        lyricsMode={lyricsMode}
        storyMode={storyMode}
        onEditorModeChange={onEditorModeChange}
        onMaxModeChange={onMaxModeChange}
        onLyricsModeChange={onLyricsModeChange}
        onStoryModeChange={onStoryModeChange}
      />

      {editorMode === 'advanced' && (
        <AdvancedPanel
          selection={advancedSelection}
          onUpdate={onAdvancedSelectionUpdate}
          onClear={onAdvancedSelectionClear}
          computedPhrase={computedMusicPhrase}
          moodCategory={moodCategory}
          onMoodCategoryChange={onMoodCategoryChange}
          storyMode={storyMode}
        />
      )}

      <LockedPhraseInput
        value={lockedPhrase}
        editorMode={editorMode}
        validation={lockedPhraseValidation}
        onChange={onLockedPhraseChange}
      />

      {editorMode === 'simple' && (
        <MoodCategoryCombobox
          value={moodCategory}
          onChange={onMoodCategoryChange}
          helperText="Influences the emotional tone of your prompt"
        />
      )}

      <MainInput
        value={pendingInput}
        currentPrompt={currentPrompt}
        lyricsMode={lyricsMode}
        maxMode={maxMode}
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
    </>
  );
}
