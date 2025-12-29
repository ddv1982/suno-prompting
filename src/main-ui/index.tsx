import { createRoot } from "react-dom/client";
import { lazy, Suspense } from "react";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { Header } from "@/components/app-header";
import { HistorySidebar } from "@/components/history-sidebar";
import { PromptEditor } from "@/components/prompt-editor";
import { ErrorBoundary } from "@/components/error-boundary";
import { AppProvider, useAppContext } from "@/context/AppContext";
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
    setSettingsOpen,
    setLockedPhrase,
    setEditorMode,
    updateAdvancedSelection,
    clearAdvancedSelection,
    selectSession,
    newProject,
    deleteSession,
    handleGenerate,
    handleCopy,
    handleRemix,
    handleRemixInstruments,
    handleRemixGenre,
    handleRemixMood,
    handleRemixStyleTags,
    handleRemixRecording,
    handleRemixTitle,
    handleRemixLyrics,
    maxMode,
    lyricsMode,
    setLyricsMode
  } = useAppContext();

  const currentPrompt = currentSession?.currentPrompt || "";
  const currentTitle = currentSession?.currentTitle;
  const currentLyrics = currentSession?.currentLyrics;

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-background">
        <HistorySidebar
          sessions={sessions}
          currentSessionId={currentSession?.id || null}
          onSelectSession={selectSession}
          onDeleteSession={deleteSession}
          onNewProject={newProject}
        />
        <SidebarInset className="flex flex-1 min-w-0 flex-col bg-background">
          <Header onOpenSettings={() => setSettingsOpen(true)} />
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
              onLockedPhraseChange={setLockedPhrase}
              onEditorModeChange={setEditorMode}
              onAdvancedSelectionUpdate={updateAdvancedSelection}
              onAdvancedSelectionClear={clearAdvancedSelection}
              onGenerate={handleGenerate}
              onCopy={handleCopy}
              onRemix={handleRemix}
              onRemixInstruments={handleRemixInstruments}
              onRemixGenre={handleRemixGenre}
              onRemixMood={handleRemixMood}
              onRemixStyleTags={handleRemixStyleTags}
              onRemixRecording={handleRemixRecording}
              onRemixTitle={handleRemixTitle}
              onRemixLyrics={handleRemixLyrics}
              maxMode={maxMode}
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
        {settingsOpen && <SettingsModal isOpen={settingsOpen} onClose={() => setSettingsOpen(false)} />}
      </Suspense>
    </SidebarProvider>
  );
}

const container = document.getElementById('root');
if (container) {
    const root = createRoot(container);
    root.render(
      <ErrorBoundary>
        <AppProvider>
          <App />
        </AppProvider>
      </ErrorBoundary>
    );
}
