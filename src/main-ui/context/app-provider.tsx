import { type ReactNode } from 'react';
import { SessionProvider } from '@/context/session-context';
import { SettingsProvider } from '@/context/settings-context';
import { EditorProvider } from '@/context/editor-context';
import { GenerationProvider } from '@/context/generation-context';

export const AppProvider = ({ children }: { children: ReactNode }) => {
  return (
    <SettingsProvider>
      <SessionProvider>
        <EditorProvider>
          <GenerationProvider>
            {children}
          </GenerationProvider>
        </EditorProvider>
      </SessionProvider>
    </SettingsProvider>
  );
};
