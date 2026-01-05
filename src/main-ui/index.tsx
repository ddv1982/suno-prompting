import { lazy, Suspense } from "react";
import { createRoot } from "react-dom/client";

import { Header } from "@/components/app-header";
import { ErrorBoundary } from "@/components/error-boundary";
import { HistorySidebar } from "@/components/history-sidebar";
import { PromptEditor } from "@/components/prompt-editor";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { ToastProvider } from "@/components/ui/toast";
import { AppProvider, useAppContext } from "@/context/app-context";
import { useScrollReveal } from "@/hooks/use-scroll-reveal";
import { APP_CONSTANTS } from "@shared/constants";

const SettingsModal = lazy(() => import("./components/settings-modal").then(m => ({ default: m.SettingsModal })));

// Main App
function App() {
  useScrollReveal();
  
  const {
    sessions,
    currentSession,
    validation,
    isGenerating,
    generatingAction,
    chatMessages,
    settingsOpen,
    currentModel,
    debugInfo,
    lockedPhrase,
    editorMode,
    advancedSelection,
    computedMusicPhrase,
    pendingInput,
    lyricsTopic,
    promptMode,
    quickVibesInput,
    withWordlessVocals,
    creativeBoostInput,
    creativeBoostMode,
    setCreativeBoostMode,
    setPendingInput,
    setSettingsOpen,
    setLockedPhrase,
    setLyricsTopic,
    setEditorMode,
    setPromptMode,
    setQuickVibesInput,
    setWithWordlessVocals,
    setCreativeBoostInput,
    updateAdvancedSelection,
    clearAdvancedSelection,
    selectSession,
    newProject,
    deleteSession,
    handleGenerate,
    handleGenerateQuickVibes,
    handleCopy,
    handleRemix,
    handleRemixQuickVibes,
    handleConversionComplete,
    handleRemixInstruments,
    handleRemixGenre,
    handleRemixMood,
    handleRemixStyleTags,
    handleRemixRecording,
    handleRemixTitle,
    handleRemixLyrics,
    handleGenerateCreativeBoost,
    handleRefineCreativeBoost,
    maxMode,
    setMaxMode,
    lyricsMode,
    setLyricsMode
  } = useAppContext();

  const currentPrompt = currentSession?.currentPrompt || "";
  const currentTitle = currentSession?.currentTitle;
  const currentLyrics = currentSession?.currentLyrics;

  return (
    <SidebarProvider>
      <div className="flex h-screen w-full bg-background overflow-hidden">
        <HistorySidebar
          sessions={sessions}
          currentSessionId={currentSession?.id || null}
          onSelectSession={selectSession}
          onDeleteSession={deleteSession}
          onNewProject={newProject}
        />
        <SidebarInset className="flex flex-1 min-w-0 flex-col bg-background">
          <Header onOpenSettings={() => { setSettingsOpen(true); }} />
          <main className="flex-1 min-h-0 overflow-auto">
            <PromptEditor
              currentPrompt={currentPrompt}
              currentTitle={currentTitle}
              currentLyrics={currentLyrics}
              isGenerating={isGenerating}
              generatingAction={generatingAction}
              validation={validation}
              chatMessages={chatMessages}
              lockedPhrase={lockedPhrase}
              editorMode={editorMode}
              advancedSelection={advancedSelection}
              computedMusicPhrase={computedMusicPhrase}
              pendingInput={pendingInput}
              lyricsTopic={lyricsTopic}
              promptMode={promptMode}
              quickVibesInput={quickVibesInput}
              withWordlessVocals={withWordlessVocals}
              creativeBoostInput={creativeBoostInput}
              creativeBoostMode={creativeBoostMode}
              onCreativeBoostModeChange={setCreativeBoostMode}
              onPendingInputChange={setPendingInput}
              onLockedPhraseChange={setLockedPhrase}
              onLyricsTopicChange={setLyricsTopic}
              onEditorModeChange={setEditorMode}
              onAdvancedSelectionUpdate={updateAdvancedSelection}
              onAdvancedSelectionClear={clearAdvancedSelection}
              onPromptModeChange={setPromptMode}
              onQuickVibesInputChange={setQuickVibesInput}
              onWordlessVocalsChange={setWithWordlessVocals}
              onCreativeBoostInputChange={setCreativeBoostInput}
              onGenerate={handleGenerate}
              onGenerateQuickVibes={handleGenerateQuickVibes}
              onGenerateCreativeBoost={handleGenerateCreativeBoost}
              onRefineCreativeBoost={handleRefineCreativeBoost}
              onCopy={handleCopy}
              onRemix={handleRemix}
              onRemixQuickVibes={handleRemixQuickVibes}
              onRemixInstruments={handleRemixInstruments}
              onRemixGenre={handleRemixGenre}
              onRemixMood={handleRemixMood}
              onRemixStyleTags={handleRemixStyleTags}
              onRemixRecording={handleRemixRecording}
              onRemixTitle={handleRemixTitle}
              onRemixLyrics={handleRemixLyrics}
              onConversionComplete={handleConversionComplete}
              maxMode={maxMode}
              onMaxModeChange={setMaxMode}
              lyricsMode={lyricsMode}
              onLyricsModeChange={setLyricsMode}
              maxChars={APP_CONSTANTS.MAX_PROMPT_CHARS}
              currentModel={currentModel}
              debugInfo={debugInfo}
            />
          </main>
        </SidebarInset>
      </div>
      <Suspense fallback={null}>
        {settingsOpen && <SettingsModal isOpen={settingsOpen} onClose={() => { setSettingsOpen(false); }} />}
      </Suspense>
    </SidebarProvider>
  );
}

const container = document.getElementById('root');
if (container) {
    const root = createRoot(container);
    root.render(
      <ErrorBoundary>
        <ToastProvider>
          <AppProvider>
            <App />
          </AppProvider>
        </ToastProvider>
      </ErrorBoundary>
    );
}
