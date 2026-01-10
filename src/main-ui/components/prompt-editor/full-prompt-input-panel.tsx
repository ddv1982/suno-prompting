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

  const trimmedInput = pendingInput.trim();
  const isRefineMode = !!currentPrompt;
  const hasDescription = !!trimmedInput;
  const hasLyricsTopic = lyricsMode && !!lyricsTopic.trim();

  // Determine if we have valid content to submit:
  // - Refinement: allow description OR advanced selections OR lyrics topic
  // - Initial generation: require description OR (advanced + lyrics topic when in lyrics mode)
  const canSubmitContent = isRefineMode
    ? (hasDescription || hasAdvancedSelection || hasLyricsTopic)
    : (hasDescription || (hasAdvancedSelection && (!lyricsMode || hasLyricsTopic)));

  const canSubmit = !isGenerating && !inputOverLimit && !lyricsTopicOverLimit && lockedPhraseValidation.isValid && canSubmitContent;

  const handleSend = useCallback((): void => {
    const input = pendingInput.trim();
    const hasInput = !!input;
    const hasValidLyricsTopic = lyricsMode && !!lyricsTopic.trim();
    const hasValidContent = isRefineMode
      ? (hasInput || hasAdvancedSelection || hasValidLyricsTopic)
      : (hasInput || (hasAdvancedSelection && (!lyricsMode || hasValidLyricsTopic)));

    if (!hasValidContent) return;
    if (isGenerating || (hasInput && input.length > maxChars) || !lockedPhraseValidation.isValid || lyricsTopicOverLimit) return;
    onGenerate(input);
  }, [pendingInput, lyricsMode, lyricsTopic, isRefineMode, hasAdvancedSelection, isGenerating, maxChars, lockedPhraseValidation.isValid, lyricsTopicOverLimit, onGenerate]);

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
