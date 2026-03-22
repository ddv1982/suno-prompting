import { createContext, useContext, type ReactNode } from 'react';

import { useToast } from '@/components/ui/toast';
import { useEditorActions, useEditorState } from '@/context/editor-context';
import { useSessionContext } from '@/context/session-context';
import { useSettingsContext } from '@/context/settings-context';
import { useGenerationFacade } from '@/services/generation-facade-service';

import { GenerationStateProvider, useGenerationStateContext } from './generation-state-context';
import {
  SessionOperationsProvider,
  useSessionOperationsContext,
} from './session-operations-context';
import {
  StandardGenerationProvider,
  useStandardGenerationContext,
} from './standard-generation-context';

import type { GenerationContextType } from './types';

const GenerationContext = createContext<GenerationContextType | null>(null);

export const useGenerationContext = (): GenerationContextType => {
  const ctx = useContext(GenerationContext);
  if (!ctx) throw new Error('useGenerationContext must be used within GenerationProvider');
  return ctx;
};

function GenerationFacade({ children }: { children: ReactNode }): ReactNode {
  const { currentSession, generateId, saveSession } = useSessionContext();
  const { creativeBoostInput } = useEditorState();
  const { getQuickVibesInput, setPendingInput } = useEditorActions();
  const { maxMode, lyricsMode } = useSettingsContext();
  const { showToast } = useToast();

  const stateCtx = useGenerationStateContext();
  const sessionOps = useSessionOperationsContext();
  const stdGeneration = useStandardGenerationContext();
  const optimisticDeps = {
    startOptimistic: stateCtx.startOptimistic,
    completeOptimistic: stateCtx.completeOptimistic,
    errorOptimistic: stateCtx.errorOptimistic,
  };

  const contextValue = useGenerationFacade({
    stateCtx,
    sessionOps,
    stdGeneration,
    session: { currentSession, generateId, saveSession },
    editor: { creativeBoostInput, getQuickVibesInput, setPendingInput },
    settings: { maxMode, lyricsMode },
    showToast,
    optimisticDeps,
  });

  return <GenerationContext.Provider value={contextValue}>{children}</GenerationContext.Provider>;
}

export function GenerationProvider({ children }: { children: ReactNode }): ReactNode {
  return (
    <GenerationStateProvider>
      <SessionOperationsProvider>
        <StandardGenerationProvider>
          <GenerationFacade>{children}</GenerationFacade>
        </StandardGenerationProvider>
      </SessionOperationsProvider>
    </GenerationStateProvider>
  );
}
