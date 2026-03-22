import { createContext, useContext, useMemo, type ReactNode } from 'react';

import { useEditorActions } from '@/context/editor-context';
import { useSessionContext } from '@/context/session-context';
import { createSessionOperationsService } from '@/services/session-operations-service';

import { useGenerationStateContext } from './generation-state-context';

import type { SessionOperationsContextValue } from './types';

const SessionOperationsContext = createContext<SessionOperationsContextValue | null>(null);

export function useSessionOperationsContext(): SessionOperationsContextValue {
  const ctx = useContext(SessionOperationsContext);
  if (!ctx)
    throw new Error('useSessionOperationsContext must be used within SessionOperationsProvider');
  return ctx;
}

export function SessionOperationsProvider({ children }: { children: ReactNode }): ReactNode {
  const { currentSession, setCurrentSession, saveSession, generateId } = useSessionContext();
  const {
    resetEditor,
    setLyricsTopic,
    setPromptMode,
    setQuickVibesInput,
    resetQuickVibesInput,
    setCreativeBoostInput,
    resetCreativeBoostInput,
  } = useEditorActions();
  const { setChatMessages, setValidation, setDebugTrace } = useGenerationStateContext();
  const service = useMemo(
    () =>
      createSessionOperationsService({
        currentSession,
        setCurrentSession,
        saveSession,
        generateId,
        resetEditor,
        setLyricsTopic,
        setPromptMode,
        setQuickVibesInput,
        resetQuickVibesInput,
        setCreativeBoostInput,
        resetCreativeBoostInput,
        setChatMessages,
        setValidation,
        setDebugTrace,
      }),
    [
      currentSession,
      setCurrentSession,
      saveSession,
      generateId,
      resetEditor,
      setLyricsTopic,
      setPromptMode,
      setQuickVibesInput,
      resetQuickVibesInput,
      setCreativeBoostInput,
      resetCreativeBoostInput,
      setChatMessages,
      setValidation,
      setDebugTrace,
    ]
  );

  return (
    <SessionOperationsContext.Provider value={service}>
      {children}
    </SessionOperationsContext.Provider>
  );
}
