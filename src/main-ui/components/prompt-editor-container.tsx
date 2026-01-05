
import { PromptEditor } from "@/components/prompt-editor";
import { useAppContext } from "@/context/app-context";
import { APP_CONSTANTS } from "@shared/constants";

import type { ReactNode } from "react";

export function PromptEditorContainer(): ReactNode {
  const {
    currentSession, validation, isGenerating, generatingAction, chatMessages, currentModel, debugInfo,
    lockedPhrase, editorMode, advancedSelection, computedMusicPhrase, pendingInput, lyricsTopic,
    promptMode, quickVibesInput, withWordlessVocals, creativeBoostInput, creativeBoostMode,
    setCreativeBoostMode, setPendingInput, setLockedPhrase, setLyricsTopic, setEditorMode, setPromptMode,
    setQuickVibesInput, setWithWordlessVocals, setCreativeBoostInput, updateAdvancedSelection, clearAdvancedSelection,
    handleGenerate, handleGenerateQuickVibes, handleCopy, handleRemix, handleRemixQuickVibes, handleConversionComplete,
    handleRemixInstruments, handleRemixGenre, handleRemixMood, handleRemixStyleTags, handleRemixRecording,
    handleRemixTitle, handleRemixLyrics, handleGenerateCreativeBoost, handleRefineCreativeBoost,
    maxMode, setMaxMode, lyricsMode, setLyricsMode,
  } = useAppContext();

  return (
    <PromptEditor
      currentPrompt={currentSession?.currentPrompt || ""} currentTitle={currentSession?.currentTitle} currentLyrics={currentSession?.currentLyrics}
      isGenerating={isGenerating} generatingAction={generatingAction} validation={validation} chatMessages={chatMessages}
      lockedPhrase={lockedPhrase} editorMode={editorMode} advancedSelection={advancedSelection} computedMusicPhrase={computedMusicPhrase}
      pendingInput={pendingInput} lyricsTopic={lyricsTopic} promptMode={promptMode} quickVibesInput={quickVibesInput}
      withWordlessVocals={withWordlessVocals} creativeBoostInput={creativeBoostInput} creativeBoostMode={creativeBoostMode}
      onCreativeBoostModeChange={setCreativeBoostMode} onPendingInputChange={setPendingInput} onLockedPhraseChange={setLockedPhrase}
      onLyricsTopicChange={setLyricsTopic} onEditorModeChange={setEditorMode} onAdvancedSelectionUpdate={updateAdvancedSelection}
      onAdvancedSelectionClear={clearAdvancedSelection} onPromptModeChange={setPromptMode} onQuickVibesInputChange={setQuickVibesInput}
      onWordlessVocalsChange={setWithWordlessVocals} onCreativeBoostInputChange={setCreativeBoostInput}
      onGenerate={handleGenerate} onGenerateQuickVibes={handleGenerateQuickVibes} onGenerateCreativeBoost={handleGenerateCreativeBoost}
      onRefineCreativeBoost={handleRefineCreativeBoost} onCopy={handleCopy} onRemix={handleRemix} onRemixQuickVibes={handleRemixQuickVibes}
      onRemixInstruments={handleRemixInstruments} onRemixGenre={handleRemixGenre} onRemixMood={handleRemixMood}
      onRemixStyleTags={handleRemixStyleTags} onRemixRecording={handleRemixRecording} onRemixTitle={handleRemixTitle}
      onRemixLyrics={handleRemixLyrics} onConversionComplete={handleConversionComplete} maxMode={maxMode} onMaxModeChange={setMaxMode}
      lyricsMode={lyricsMode} onLyricsModeChange={setLyricsMode} maxChars={APP_CONSTANTS.MAX_PROMPT_CHARS}
      currentModel={currentModel} debugInfo={debugInfo}
    />
  );
}
