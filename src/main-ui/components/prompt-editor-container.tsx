
import { useMemo } from "react";

import { PromptEditor } from "@/components/prompt-editor";
import { type OutputState, type InputState, type GenerationState, type ModeState, type QuickVibesState, type CreativeBoostState, type RemixHandlers, type EditorHandlers, type EditorConfig } from "@/components/prompt-editor/types";
import { useAppContext } from "@/context/app-context";
import { APP_CONSTANTS } from "@shared/constants";

import type { ReactNode } from "react";

export function PromptEditorContainer(): ReactNode {
  // eslint-disable-next-line @typescript-eslint/no-deprecated -- intentional use for prop grouping
  const ctx = useAppContext();

  const output: OutputState = useMemo(() => ({
    currentPrompt: ctx.currentSession?.currentPrompt || "",
    currentTitle: ctx.currentSession?.currentTitle,
    currentLyrics: ctx.currentSession?.currentLyrics,
  }), [ctx.currentSession?.currentPrompt, ctx.currentSession?.currentTitle, ctx.currentSession?.currentLyrics]);

  const input: InputState = useMemo(() => ({
    pendingInput: ctx.pendingInput, lockedPhrase: ctx.lockedPhrase, lyricsTopic: ctx.lyricsTopic,
    advancedSelection: ctx.advancedSelection, computedMusicPhrase: ctx.computedMusicPhrase,
  }), [ctx.pendingInput, ctx.lockedPhrase, ctx.lyricsTopic, ctx.advancedSelection, ctx.computedMusicPhrase]);

  const generation: GenerationState = useMemo(() => ({
    isGenerating: ctx.isGenerating, generatingAction: ctx.generatingAction, validation: ctx.validation,
    debugInfo: ctx.debugInfo, chatMessages: ctx.chatMessages,
  }), [ctx.isGenerating, ctx.generatingAction, ctx.validation, ctx.debugInfo, ctx.chatMessages]);

  const modes: ModeState = useMemo(() => ({
    maxMode: ctx.maxMode, lyricsMode: ctx.lyricsMode, editorMode: ctx.editorMode,
    promptMode: ctx.promptMode, creativeBoostMode: ctx.creativeBoostMode,
  }), [ctx.maxMode, ctx.lyricsMode, ctx.editorMode, ctx.promptMode, ctx.creativeBoostMode]);

  const quickVibes: QuickVibesState = useMemo(() => ({
    input: ctx.quickVibesInput, withWordlessVocals: ctx.withWordlessVocals,
  }), [ctx.quickVibesInput, ctx.withWordlessVocals]);

  const creativeBoost: CreativeBoostState = useMemo(() => ({
    input: ctx.creativeBoostInput,
  }), [ctx.creativeBoostInput]);

  const remix: RemixHandlers = useMemo(() => ({
    onRemix: ctx.handleRemix, onRemixQuickVibes: ctx.handleRemixQuickVibes, onRemixInstruments: ctx.handleRemixInstruments,
    onRemixGenre: ctx.handleRemixGenre, onRemixMood: ctx.handleRemixMood, onRemixStyleTags: ctx.handleRemixStyleTags,
    onRemixRecording: ctx.handleRemixRecording, onRemixTitle: ctx.handleRemixTitle, onRemixLyrics: ctx.handleRemixLyrics,
  }), [ctx.handleRemix, ctx.handleRemixQuickVibes, ctx.handleRemixInstruments, ctx.handleRemixGenre, ctx.handleRemixMood, ctx.handleRemixStyleTags, ctx.handleRemixRecording, ctx.handleRemixTitle, ctx.handleRemixLyrics]);

  const handlers: EditorHandlers = useMemo(() => ({
    onPendingInputChange: ctx.setPendingInput, onLockedPhraseChange: ctx.setLockedPhrase, onLyricsTopicChange: ctx.setLyricsTopic,
    onEditorModeChange: ctx.setEditorMode, onAdvancedSelectionUpdate: ctx.updateAdvancedSelection, onAdvancedSelectionClear: ctx.clearAdvancedSelection,
    onPromptModeChange: ctx.setPromptMode, onMaxModeChange: ctx.setMaxMode, onLyricsModeChange: ctx.setLyricsMode,
    onCreativeBoostModeChange: ctx.setCreativeBoostMode, onQuickVibesInputChange: ctx.setQuickVibesInput, onWordlessVocalsChange: ctx.setWithWordlessVocals,
    onCreativeBoostInputChange: ctx.setCreativeBoostInput, onGenerate: ctx.handleGenerate, onGenerateQuickVibes: ctx.handleGenerateQuickVibes,
    onGenerateCreativeBoost: ctx.handleGenerateCreativeBoost, onRefineCreativeBoost: ctx.handleRefineCreativeBoost,
    onCopy: ctx.handleCopy, onConversionComplete: ctx.handleConversionComplete,
  }), [ctx.setPendingInput, ctx.setLockedPhrase, ctx.setLyricsTopic, ctx.setEditorMode, ctx.updateAdvancedSelection, ctx.clearAdvancedSelection, ctx.setPromptMode, ctx.setMaxMode, ctx.setLyricsMode, ctx.setCreativeBoostMode, ctx.setQuickVibesInput, ctx.setWithWordlessVocals, ctx.setCreativeBoostInput, ctx.handleGenerate, ctx.handleGenerateQuickVibes, ctx.handleGenerateCreativeBoost, ctx.handleRefineCreativeBoost, ctx.handleCopy, ctx.handleConversionComplete]);

  const config: EditorConfig = useMemo(() => ({
    maxChars: APP_CONSTANTS.MAX_PROMPT_CHARS, currentModel: ctx.currentModel,
  }), [ctx.currentModel]);

  return (
    <PromptEditor
      output={output} input={input} generation={generation} modes={modes}
      quickVibes={quickVibes} creativeBoost={creativeBoost} remix={remix} handlers={handlers} config={config}
    />
  );
}
