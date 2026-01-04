import { type ReactNode } from 'react';

import { EditorProvider } from '@/context/editor-context';
import { GenerationProvider } from '@/context/generation-context';
import { SessionProvider } from '@/context/session-context';
import { SettingsProvider } from '@/context/settings-context';

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
