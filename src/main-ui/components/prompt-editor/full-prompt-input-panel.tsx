import { useCallback, type ReactNode } from "react";

import { AdvancedPanel } from "@/components/advanced-panel";

import { FullWidthSubmitButton } from "./full-width-submit-button";
import { LockedPhraseInput } from "./locked-phrase-input";
import { MainInput } from "./main-input";
import { ModeToggle } from "./mode-toggle";
import { SongTopicInput } from "./song-topic-input";

import type { FullPromptInputPanelProps } from "./full-prompt-input-panel.types";

export type { FullPromptInputPanelProps };

export function FullPromptInputPanel(props: FullPromptInputPanelProps): ReactNode {
  const { currentPrompt, pendingInput, lockedPhrase, lyricsTopic, editorMode, advancedSelection, computedMusicPhrase,
    maxMode, lyricsMode, isGenerating, maxChars, lockedPhraseValidation, inputOverLimit, lyricsTopicOverLimit,
    hasAdvancedSelection, onPendingInputChange, onLockedPhraseChange, onLyricsTopicChange, onEditorModeChange,
    onAdvancedSelectionUpdate, onAdvancedSelectionClear, onMaxModeChange, onLyricsModeChange, onGenerate, onConversionComplete } = props;

  const canGenerateWithoutInput = hasAdvancedSelection && (!!currentPrompt || (lyricsMode && !!lyricsTopic.trim()));
  const canSubmit = !isGenerating && !inputOverLimit && !lyricsTopicOverLimit && lockedPhraseValidation.isValid && (!!pendingInput.trim() || canGenerateWithoutInput);

  const handleSend = useCallback((): void => {
    const trimmed = pendingInput.trim();
    if (!trimmed && !canGenerateWithoutInput) return;
    if (isGenerating || trimmed.length > maxChars || !lockedPhraseValidation.isValid || lyricsTopicOverLimit) return;
    onGenerate(trimmed);
  }, [pendingInput, canGenerateWithoutInput, isGenerating, maxChars, lockedPhraseValidation.isValid, lyricsTopicOverLimit, onGenerate]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent): void => {
    if (e.key === "Enter" && !e.shiftKey && canSubmit) { e.preventDefault(); handleSend(); }
  }, [canSubmit, handleSend]);

  return (
    <>
      <ModeToggle
        editorMode={editorMode}
        maxMode={maxMode}
        lyricsMode={lyricsMode}
        isGenerating={isGenerating}
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
        />
      )}

      <LockedPhraseInput
        value={lockedPhrase}
        editorMode={editorMode}
        isGenerating={isGenerating}
        validation={lockedPhraseValidation}
        onChange={onLockedPhraseChange}
      />

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
        onSubmit={handleSend}
      />
    </>
  );
}
