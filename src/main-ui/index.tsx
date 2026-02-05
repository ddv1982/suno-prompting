import { lazy, Suspense, type ReactNode } from 'react';
import { createRoot } from 'react-dom/client';

import { Header } from '@/components/app-header';
import { ErrorBoundary } from '@/components/error-boundary';
import { HistorySidebar } from '@/components/history-sidebar';
import { PanelErrorBoundary } from '@/components/panel-error-boundary';
import { PromptEditorContainer } from '@/components/prompt-editor-container';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import { ToastProvider } from '@/components/ui/toast';
import { AppProvider } from '@/context/app-context';
import { useGenerationContext } from '@/context/generation';
import { useSessionContext } from '@/context/session-context';
import { useSettingsContext } from '@/context/settings-context';
import { useScrollReveal } from '@/hooks/use-scroll-reveal';

const SettingsModal = lazy(() =>
  import('./components/settings-modal').then((m) => ({ default: m.SettingsModal }))
);

function App(): ReactNode {
  useScrollReveal();
  const { sessions, currentSession, deleteSession } = useSessionContext();
  const { settingsOpen, setSettingsOpen } = useSettingsContext();
  const { selectSession, newProject } = useGenerationContext();

  return (
    <SidebarProvider>
      <div className="flex h-screen w-full bg-background overflow-hidden">
        <PanelErrorBoundary panelName="History Sidebar">
          <HistorySidebar
            sessions={sessions}
            currentSessionId={currentSession?.id || null}
            onSelectSession={selectSession}
            onDeleteSession={deleteSession}
            onNewProject={newProject}
          />
        </PanelErrorBoundary>
        <SidebarInset className="flex flex-1 min-w-0 flex-col bg-background">
          <Header
            onOpenSettings={() => {
              setSettingsOpen(true);
            }}
          />
          <main className="flex-1 min-h-0 overflow-auto">
            <PanelErrorBoundary panelName="Prompt Editor">
              <PromptEditorContainer />
            </PanelErrorBoundary>
          </main>
        </SidebarInset>
      </div>
      <Suspense fallback={null}>
        {settingsOpen && (
          <SettingsModal
            isOpen={settingsOpen}
            onClose={() => {
              setSettingsOpen(false);
            }}
          />
        )}
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
