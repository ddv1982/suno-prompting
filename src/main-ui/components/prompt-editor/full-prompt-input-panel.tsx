import { useCallback, type ReactNode } from "react";

import { AdvancedPanel } from "@/components/advanced-panel";

import { FullWidthSubmitButton } from "./full-width-submit-button";
import { LockedPhraseInput } from "./locked-phrase-input";
import { MainInput } from "./main-input";
import { ModeToggle } from "./mode-toggle";
import { SongTopicInput } from "./song-topic-input";

import type { AdvancedSelection, DebugInfo, EditorMode } from "@shared/types";

/** Input state and handlers */
type InputState = {
  pendingInput: string;
  lockedPhrase: string;
  lyricsTopic: string;
  onPendingInputChange: (input: string) => void;
  onLockedPhraseChange: (phrase: string) => void;
  onLyricsTopicChange: (topic: string) => void;
};

/** Mode state and handlers */
type ModeState = {
  editorMode: EditorMode;
  maxMode: boolean;
  lyricsMode: boolean;
  onEditorModeChange: (mode: EditorMode) => void;
  onMaxModeChange: (mode: boolean) => void;
  onLyricsModeChange: (mode: boolean) => void;
};

/** Advanced selection state and handlers */
type AdvancedState = {
  advancedSelection: AdvancedSelection;
  computedMusicPhrase: string;
  hasAdvancedSelection: boolean;
  onAdvancedSelectionUpdate: (updates: Partial<AdvancedSelection>) => void;
  onAdvancedSelectionClear: () => void;
};

/** Validation and limits */
type ValidationState = {
  maxChars: number;
  lockedPhraseValidation: { isValid: boolean; error: string | null };
  inputOverLimit: boolean;
  lyricsTopicOverLimit: boolean;
};

/** Generation state and handlers */
type GenerationState = {
  currentPrompt: string;
  isGenerating: boolean;
  onGenerate: (input: string) => void;
  onConversionComplete: (originalInput: string, convertedPrompt: string, versionId: string, debugInfo?: Partial<DebugInfo>) => Promise<void>;
};

type FullPromptInputPanelProps = InputState & ModeState & AdvancedState & ValidationState & GenerationState;

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
