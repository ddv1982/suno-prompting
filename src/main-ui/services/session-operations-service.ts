import { buildChatMessages } from '@/lib/chat-utils';
import { createVersion, updateChatMessagesAfterGeneration } from '@/lib/session-helpers';
import { EMPTY_VALIDATION } from '@shared/validation';

import type { PromptSession, TraceRun } from '@shared/types';

export interface SessionOperationsServiceDeps {
  currentSession: PromptSession | null;
  setCurrentSession: (session: PromptSession | null) => void;
  saveSession: (session: PromptSession) => Promise<void>;
  generateId: () => string;
  resetEditor: () => void;
  setLyricsTopic: (value: string) => void;
  setPromptMode: (mode: 'full' | 'quickVibes' | 'creativeBoost') => void;
  setQuickVibesInput: (input: NonNullable<PromptSession['quickVibesInput']>) => void;
  resetQuickVibesInput: () => void;
  setCreativeBoostInput: (input: NonNullable<PromptSession['creativeBoostInput']>) => void;
  resetCreativeBoostInput: () => void;
  setChatMessages: React.Dispatch<React.SetStateAction<import('@/lib/chat-utils').ChatMessage[]>>;
  setValidation: (validation: typeof EMPTY_VALIDATION) => void;
  setDebugTrace: (trace: TraceRun | undefined) => void;
}

export function createSessionOperationsService(deps: SessionOperationsServiceDeps): {
  selectSession: (session: PromptSession) => void;
  newProject: () => void;
  createConversionSession: (
    originalInput: string,
    convertedPrompt: string,
    versionId: string,
    conversionDebugTrace?: TraceRun
  ) => Promise<void>;
} {
  const selectSession = (session: PromptSession): void => {
    deps.setCurrentSession(session);
    deps.setChatMessages(buildChatMessages(session));
    deps.setValidation({ ...EMPTY_VALIDATION });
    deps.setLyricsTopic(session.lyricsTopic || '');
    deps.setPromptMode(session.promptMode ?? 'full');

    if (session.promptMode === 'quickVibes' && session.quickVibesInput) {
      deps.setQuickVibesInput(session.quickVibesInput);
      deps.resetCreativeBoostInput();
      return;
    }

    if (session.promptMode === 'creativeBoost' && session.creativeBoostInput) {
      deps.setCreativeBoostInput(session.creativeBoostInput);
      deps.resetQuickVibesInput();
      return;
    }

    deps.resetQuickVibesInput();
    deps.resetCreativeBoostInput();
  };

  const newProject = (): void => {
    deps.setCurrentSession(null);
    deps.setChatMessages([]);
    deps.setValidation({ ...EMPTY_VALIDATION });
    deps.resetEditor();
  };

  const createConversionSession = async (
    originalInput: string,
    convertedPrompt: string,
    versionId: string,
    conversionDebugTrace?: TraceRun
  ): Promise<void> => {
    const existingSession = deps.currentSession;
    deps.setDebugTrace(conversionDebugTrace);
    const now = new Date().toISOString();
    const newVersion = createVersion(
      { prompt: convertedPrompt, versionId, debugTrace: conversionDebugTrace },
      '[auto-converted to max format]'
    );
    const isNewSession = !existingSession;

    const updatedSession: PromptSession = isNewSession
      ? {
          id: deps.generateId(),
          originalInput,
          currentPrompt: convertedPrompt,
          versionHistory: [newVersion],
          createdAt: now,
          updatedAt: now,
        }
      : {
          ...existingSession,
          currentPrompt: convertedPrompt,
          versionHistory: [...existingSession.versionHistory, newVersion],
          updatedAt: now,
        };

    updateChatMessagesAfterGeneration(
      deps.setChatMessages,
      updatedSession,
      isNewSession,
      'Converted to Max Mode format.'
    );
    deps.setValidation({ ...EMPTY_VALIDATION });
    await deps.saveSession(updatedSession);
  };

  return { selectSession, newProject, createConversionSession };
}
