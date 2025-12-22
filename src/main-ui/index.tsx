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
    chatMessages,
    settingsOpen,
    currentModel,
    debugInfo,
    setSettingsOpen,
    selectSession,
    newProject,
    deleteSession,
    handleGenerate,
    handleCopy,
    handleRemix
  } = useAppContext();

  const currentPrompt = currentSession?.currentPrompt || "";

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
              isGenerating={isGenerating}
              validation={validation}
              chatMessages={chatMessages}
              onGenerate={handleGenerate}
              onCopy={handleCopy}
              onRemix={handleRemix}
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
console.log('Suno Prompting App Initialized');
