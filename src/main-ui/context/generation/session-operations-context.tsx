import { createContext, useContext, useCallback, type ReactNode } from 'react';

import { useEditorContext } from '@/context/editor-context';
import { useSessionContext } from '@/context/session-context';
import { buildChatMessages } from '@/lib/chat-utils';
import { createVersion, updateChatMessagesAfterGeneration } from '@/lib/session-helpers';
import { type PromptSession, type TraceRun } from '@shared/types';
import { nowISO } from '@shared/utils';
import { EMPTY_VALIDATION } from '@shared/validation';

import { useGenerationStateContext } from './generation-state-context';

import type { SessionOperationsContextValue } from './types';

const SessionOperationsContext = createContext<SessionOperationsContextValue | null>(null);

export function useSessionOperationsContext(): SessionOperationsContextValue {
  const ctx = useContext(SessionOperationsContext);
  if (!ctx) throw new Error('useSessionOperationsContext must be used within SessionOperationsProvider');
  return ctx;
}

export function SessionOperationsProvider({ children }: { children: ReactNode }): ReactNode {
  const { currentSession, setCurrentSession, saveSession, generateId } = useSessionContext();
  const { resetEditor, setLyricsTopic, setPromptMode, setQuickVibesInput, resetQuickVibesInput, setCreativeBoostInput } = useEditorContext();
  const { setChatMessages, setValidation, setDebugTrace } = useGenerationStateContext();

  const selectSession = useCallback((session: PromptSession) => {
    setCurrentSession(session);
    setChatMessages(buildChatMessages(session));
    setValidation({ ...EMPTY_VALIDATION });
    setLyricsTopic(session.lyricsTopic || '');
    setPromptMode(session.promptMode ?? 'full');

    if (session.promptMode === 'quickVibes' && session.quickVibesInput) {
      setQuickVibesInput(session.quickVibesInput);
    } else if (session.promptMode === 'creativeBoost' && session.creativeBoostInput) {
      setCreativeBoostInput(session.creativeBoostInput);
    } else {
      resetQuickVibesInput();
    }
  }, [
    resetQuickVibesInput,
    setChatMessages,
    setCreativeBoostInput,
    setCurrentSession,
    setLyricsTopic,
    setPromptMode,
    setQuickVibesInput,
    setValidation,
  ]);

  const newProject = useCallback(() => {
    setCurrentSession(null);
    setChatMessages([]);
    setValidation({ ...EMPTY_VALIDATION });
    resetEditor();
  }, [setCurrentSession, setChatMessages, setValidation, resetEditor]);

  const createConversionSession = useCallback(async (
    originalInput: string,
    convertedPrompt: string,
    versionId: string,
    conversionDebugTrace?: TraceRun
  ): Promise<void> => {
    setDebugTrace(conversionDebugTrace);
    const now = nowISO();
    const newVersion = createVersion({ prompt: convertedPrompt, versionId, debugTrace: conversionDebugTrace }, '[auto-converted to max format]');
    const isNewSession = !currentSession;

    const updatedSession: PromptSession = isNewSession
      ? {
          id: generateId(),
          originalInput,
          currentPrompt: convertedPrompt,
          versionHistory: [newVersion],
          createdAt: now,
          updatedAt: now,
        }
      : {
          ...currentSession,
          currentPrompt: convertedPrompt,
          versionHistory: [...currentSession.versionHistory, newVersion],
          updatedAt: now,
        };

    updateChatMessagesAfterGeneration(setChatMessages, updatedSession, isNewSession, 'Converted to Max Mode format.');
    setValidation({ ...EMPTY_VALIDATION });
    await saveSession(updatedSession);
  }, [currentSession, generateId, saveSession, setDebugTrace, setChatMessages, setValidation]);

  return <SessionOperationsContext.Provider value={{ selectSession, newProject, createConversionSession }}>{children}</SessionOperationsContext.Provider>;
}
