import { type ReactNode } from 'react';
import { SessionProvider } from '@/context/SessionContext';
import { SettingsProvider } from '@/context/SettingsContext';
import { EditorProvider } from '@/context/EditorContext';
import { GenerationProvider } from '@/context/GenerationContext';

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
