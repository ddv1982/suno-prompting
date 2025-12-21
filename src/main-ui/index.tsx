import { createRoot } from "react-dom/client";
import { lazy, Suspense } from "react";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { Header } from "./components/app-header";
import { HistorySidebar } from "./components/history-sidebar";
import { PromptEditor } from "./components/prompt-editor";
import { ErrorBoundary } from "./components/error-boundary";
import { AppProvider, useAppContext } from "./context/AppContext";
import { APP_CONSTANTS } from "../shared/constants";

const SettingsModal = lazy(() => import("./components/settings-modal").then(m => ({ default: m.SettingsModal })));

// Main App
function App() {
  const {
    sessions,
    currentSession,
    validation,
    isGenerating,
    isCondensing,
    chatMessages,
    settingsOpen,
    streamingPrompt,
    currentModel,
    setSettingsOpen,
    selectSession,
    newProject,
    deleteSession,
    handleGenerate,
    handleCopy,
    handleRemix
  } = useAppContext();

  const currentPrompt = currentSession?.currentPrompt || "";
  // If condensing, hide the streamed text; if streaming, show it; otherwise show current
  const displayPrompt = isCondensing ? "" : (isGenerating && streamingPrompt ? streamingPrompt : currentPrompt);

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
              currentPrompt={displayPrompt}
              isGenerating={isGenerating}
              isCondensing={isCondensing}
              validation={validation}
              chatMessages={chatMessages}
              onGenerate={handleGenerate}
              onCopy={handleCopy}
              onRemix={handleRemix}
              maxChars={APP_CONSTANTS.MAX_PROMPT_CHARS}
              currentModel={currentModel}
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
console.log('Suno Prompting App Initialized');
