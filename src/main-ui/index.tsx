import { lazy, Suspense, type ReactNode } from "react";
import { createRoot } from "react-dom/client";

import { Header } from "@/components/app-header";
import { ErrorBoundary } from "@/components/error-boundary";
import { HistorySidebar } from "@/components/history-sidebar";
import { PromptEditorContainer } from "@/components/prompt-editor-container";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { ToastProvider } from "@/components/ui/toast";
import { AppProvider, useAppContext } from "@/context/app-context";
import { useScrollReveal } from "@/hooks/use-scroll-reveal";

const SettingsModal = lazy(() => import("./components/settings-modal").then(m => ({ default: m.SettingsModal })));

function App(): ReactNode {
  useScrollReveal();
  // eslint-disable-next-line @typescript-eslint/no-deprecated -- top-level App needs combined context
  const { sessions, currentSession, settingsOpen, setSettingsOpen, selectSession, newProject, deleteSession } = useAppContext();

  return (
    <SidebarProvider>
      <div className="flex h-screen w-full bg-background overflow-hidden">
        <HistorySidebar sessions={sessions} currentSessionId={currentSession?.id || null} onSelectSession={selectSession} onDeleteSession={deleteSession} onNewProject={newProject} />
        <SidebarInset className="flex flex-1 min-w-0 flex-col bg-background">
          <Header onOpenSettings={() => { setSettingsOpen(true); }} />
          <main className="flex-1 min-h-0 overflow-auto"><PromptEditorContainer /></main>
        </SidebarInset>
      </div>
      <Suspense fallback={null}>{settingsOpen && <SettingsModal isOpen={settingsOpen} onClose={() => { setSettingsOpen(false); }} />}</Suspense>
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
