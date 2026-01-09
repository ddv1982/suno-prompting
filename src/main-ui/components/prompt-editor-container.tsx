
import { useMemo } from "react";

import { PromptEditor } from "@/components/prompt-editor";
import { type OutputState, type InputState, type GenerationState, type ModeState, type QuickVibesState, type CreativeBoostState, type RemixHandlers, type EditorHandlers, type EditorConfig } from "@/components/prompt-editor/types";
import { useEditorContext } from "@/context/editor-context";
import { useGenerationContext } from "@/context/generation";
import { useSessionContext } from "@/context/session-context";
import { useSettingsContext } from "@/context/settings-context";
import { APP_CONSTANTS } from "@shared/constants";

import type { ReactNode } from "react";

export function PromptEditorContainer(): ReactNode {
  // -- Session State --
  const { currentSession } = useSessionContext();

  // -- Settings --
  const { currentModel, maxMode, lyricsMode, setMaxMode, setLyricsMode } = useSettingsContext();

  // -- Editor State & Handlers --
  const { editorMode, promptMode, creativeBoostMode, advancedSelection, lockedPhrase, pendingInput, lyricsTopic, computedMusicPhrase, quickVibesInput, withWordlessVocals, creativeBoostInput, setEditorMode, setPromptMode, setCreativeBoostMode, updateAdvancedSelection, clearAdvancedSelection, setLockedPhrase, setPendingInput, setLyricsTopic, setQuickVibesInput, setWithWordlessVocals, setCreativeBoostInput } = useEditorContext();

  // -- Generation State & Handlers --
  const { isGenerating, generatingAction, chatMessages, validation, debugInfo, handleGenerate, handleCopy, handleRemix, handleRemixInstruments, handleRemixGenre, handleRemixMood, handleRemixStyleTags, handleRemixRecording, handleRemixTitle, handleRemixLyrics, handleGenerateQuickVibes, handleRemixQuickVibes, handleConversionComplete, handleGenerateCreativeBoost, handleRefineCreativeBoost } = useGenerationContext();

  // -- Memoized Prop Groups --
  const output: OutputState = useMemo(() => ({
    currentPrompt: currentSession?.currentPrompt || "",
    currentTitle: currentSession?.currentTitle,
    currentLyrics: currentSession?.currentLyrics,
  }), [currentSession?.currentPrompt, currentSession?.currentTitle, currentSession?.currentLyrics]);

  const input: InputState = useMemo(() => ({
    pendingInput, lockedPhrase, lyricsTopic, advancedSelection, computedMusicPhrase,
  }), [pendingInput, lockedPhrase, lyricsTopic, advancedSelection, computedMusicPhrase]);

  const generation: GenerationState = useMemo(() => ({
    isGenerating, generatingAction, validation, debugInfo, chatMessages,
  }), [isGenerating, generatingAction, validation, debugInfo, chatMessages]);

  const modes: ModeState = useMemo(() => ({
    maxMode, lyricsMode, editorMode, promptMode, creativeBoostMode,
  }), [maxMode, lyricsMode, editorMode, promptMode, creativeBoostMode]);

  const quickVibes: QuickVibesState = useMemo(() => ({
    input: quickVibesInput, withWordlessVocals,
  }), [quickVibesInput, withWordlessVocals]);

  const creativeBoost: CreativeBoostState = useMemo(() => ({
    input: creativeBoostInput,
  }), [creativeBoostInput]);

  const remix: RemixHandlers = useMemo(() => ({
    onRemix: handleRemix, onRemixQuickVibes: handleRemixQuickVibes, onRemixInstruments: handleRemixInstruments,
    onRemixGenre: handleRemixGenre, onRemixMood: handleRemixMood, onRemixStyleTags: handleRemixStyleTags,
    onRemixRecording: handleRemixRecording, onRemixTitle: handleRemixTitle, onRemixLyrics: handleRemixLyrics,
  }), [handleRemix, handleRemixQuickVibes, handleRemixInstruments, handleRemixGenre, handleRemixMood, handleRemixStyleTags, handleRemixRecording, handleRemixTitle, handleRemixLyrics]);

  const handlers: EditorHandlers = useMemo(() => ({
    onPendingInputChange: setPendingInput, onLockedPhraseChange: setLockedPhrase, onLyricsTopicChange: setLyricsTopic,
    onEditorModeChange: setEditorMode, onAdvancedSelectionUpdate: updateAdvancedSelection, onAdvancedSelectionClear: clearAdvancedSelection,
    onPromptModeChange: setPromptMode, onMaxModeChange: setMaxMode, onLyricsModeChange: setLyricsMode,
    onCreativeBoostModeChange: setCreativeBoostMode, onQuickVibesInputChange: setQuickVibesInput, onWordlessVocalsChange: setWithWordlessVocals,
    onCreativeBoostInputChange: setCreativeBoostInput, onGenerate: handleGenerate, onGenerateQuickVibes: handleGenerateQuickVibes,
    onGenerateCreativeBoost: handleGenerateCreativeBoost, onRefineCreativeBoost: handleRefineCreativeBoost,
    onCopy: handleCopy, onConversionComplete: handleConversionComplete,
  }), [setPendingInput, setLockedPhrase, setLyricsTopic, setEditorMode, updateAdvancedSelection, clearAdvancedSelection, setPromptMode, setMaxMode, setLyricsMode, setCreativeBoostMode, setQuickVibesInput, setWithWordlessVocals, setCreativeBoostInput, handleGenerate, handleGenerateQuickVibes, handleGenerateCreativeBoost, handleRefineCreativeBoost, handleCopy, handleConversionComplete]);

  const config: EditorConfig = useMemo(() => ({
    maxChars: APP_CONSTANTS.MAX_PROMPT_CHARS, currentModel,
  }), [currentModel]);

  return (
    <PromptEditor
      output={output} input={input} generation={generation} modes={modes}
      quickVibes={quickVibes} creativeBoost={creativeBoost} remix={remix} handlers={handlers} config={config}
    />
  );
}
