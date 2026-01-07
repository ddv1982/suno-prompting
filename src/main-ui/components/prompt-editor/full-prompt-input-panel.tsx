import { useCallback, type ReactNode } from "react";

import { AdvancedPanel } from "@/components/advanced-panel";

import { FullWidthSubmitButton } from "./full-width-submit-button";
import { LockedPhraseInput } from "./locked-phrase-input";
import { MainInput } from "./main-input";
import { ModeToggle } from "./mode-toggle";
import { SongTopicInput } from "./song-topic-input";

import type { AdvancedSelection, DebugInfo, EditorMode } from "@shared/types";

type FullPromptInputPanelProps = {
  currentPrompt: string;
  pendingInput: string;
  lockedPhrase: string;
  lyricsTopic: string;
  editorMode: EditorMode;
  advancedSelection: AdvancedSelection;
  computedMusicPhrase: string;
  maxMode: boolean;
  lyricsMode: boolean;
  isGenerating: boolean;
  maxChars: number;
  lockedPhraseValidation: { isValid: boolean; error: string | null };
  inputOverLimit: boolean;
  lyricsTopicOverLimit: boolean;
  hasAdvancedSelection: boolean;
  onPendingInputChange: (input: string) => void;
  onLockedPhraseChange: (phrase: string) => void;
  onLyricsTopicChange: (topic: string) => void;
  onEditorModeChange: (mode: EditorMode) => void;
  onAdvancedSelectionUpdate: (updates: Partial<AdvancedSelection>) => void;
  onAdvancedSelectionClear: () => void;
  onMaxModeChange: (mode: boolean) => void;
  onLyricsModeChange: (mode: boolean) => void;
  onGenerate: (input: string) => void;
  onConversionComplete: (originalInput: string, convertedPrompt: string, versionId: string, debugInfo?: Partial<DebugInfo>) => Promise<void>;
};

export function FullPromptInputPanel({
  currentPrompt,
  pendingInput,
  lockedPhrase,
  lyricsTopic,
  editorMode,
  advancedSelection,
  computedMusicPhrase,
  maxMode,
  lyricsMode,
  isGenerating,
  maxChars,
  lockedPhraseValidation,
  inputOverLimit,
  lyricsTopicOverLimit,
  hasAdvancedSelection,
  onPendingInputChange,
  onLockedPhraseChange,
  onLyricsTopicChange,
  onEditorModeChange,
  onAdvancedSelectionUpdate,
  onAdvancedSelectionClear,
  onMaxModeChange,
  onLyricsModeChange,
  onGenerate,
  onConversionComplete,
}: FullPromptInputPanelProps): ReactNode {
  // Allow generation without description in advanced mode when refining OR when lyrics topic is set
  const canGenerateWithoutInput = hasAdvancedSelection && (!!currentPrompt || (lyricsMode && !!lyricsTopic.trim()));

  const canSubmit = !isGenerating &&
    !inputOverLimit &&
    !lyricsTopicOverLimit &&
    lockedPhraseValidation.isValid &&
    (!!pendingInput.trim() || canGenerateWithoutInput);

  const handleSend = useCallback((): void => {
    const trimmed = pendingInput.trim();
    
    if (!trimmed && !canGenerateWithoutInput) return;
    if (isGenerating) return;
    if (trimmed.length > maxChars) return;
    if (!lockedPhraseValidation.isValid) return;
    if (lyricsTopicOverLimit) return;
    onGenerate(trimmed);
  }, [pendingInput, canGenerateWithoutInput, isGenerating, maxChars, lockedPhraseValidation.isValid, lyricsTopicOverLimit, onGenerate]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent): void => {
    if (e.key === "Enter" && !e.shiftKey && canSubmit) {
      e.preventDefault();
      handleSend();
    }
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
