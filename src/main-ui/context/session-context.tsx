import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  useMemo,
  type ReactNode,
} from 'react';

import { createLogger } from '@shared/logger';
import { rpcClient } from '@/services/rpc-client';
import { APP_CONSTANTS } from '@shared/constants';
import { type PromptSession } from '@shared/types';

const log = createLogger('Session');

function generateId(): string {
  return crypto.randomUUID();
}

async function delayRetry(): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, APP_CONSTANTS.UI.RETRY_DELAY_MS));
}

function upsertSessions(prev: PromptSession[], session: PromptSession): PromptSession[] {
  const filtered = prev.filter((s) => s.id !== session.id);
  return [session, ...filtered];
}

function buildNewSession(
  originalInput: string,
  prompt: string,
  title?: string,
  lyrics?: string
): PromptSession {
  const now = new Date().toISOString();
  return {
    id: generateId(),
    originalInput,
    currentPrompt: prompt,
    currentTitle: title,
    currentLyrics: lyrics,
    versionHistory: [
      {
        id: generateId(),
        content: prompt,
        title,
        lyrics,
        timestamp: now,
      },
    ],
    createdAt: now,
    updatedAt: now,
  };
}

export interface SessionContextType {
  sessions: PromptSession[];
  currentSession: PromptSession | null;
  setCurrentSession: (session: PromptSession | null) => void;
  loadHistory: (retries?: number) => Promise<void>;
  saveSession: (session: PromptSession) => Promise<void>;
  deleteSession: (id: string) => Promise<void>;
  createNewSession: (
    originalInput: string,
    prompt: string,
    title?: string,
    lyrics?: string
  ) => PromptSession;
  generateId: () => string;
}

const SessionContext = createContext<SessionContextType | null>(null);

export const useSessionContext = (): SessionContextType => {
  const context = useContext(SessionContext);
  if (!context) throw new Error('useSessionContext must be used within SessionProvider');
  return context;
};

export const SessionProvider = ({ children }: { children: ReactNode }): ReactNode => {
  const [sessions, setSessions] = useState<PromptSession[]>([]);
  const [currentSession, setCurrentSession] = useState<PromptSession | null>(null);

  const loadHistory = useCallback(async (retries = 1) => {
    try {
      const result = await rpcClient.getHistory({});
      if (result.ok) {
        setSessions(result.value.sessions);
        return;
      }

      if (retries > 0) {
        await delayRetry();
        await loadHistory(retries - 1);
        return;
      }

      log.error('loadHistory:failed', result.error);
    } catch (error: unknown) {
      if (retries > 0) {
        await delayRetry();
        await loadHistory(retries - 1);
        return;
      }
      log.error('loadHistory:failed', error);
    }
  }, []);

  const saveSession = useCallback(async (session: PromptSession) => {
    try {
      const result = await rpcClient.saveSession({ session });
      if (!result.ok) {
        log.error('saveSession:failed', result.error);
        return;
      }

      setSessions((prev) => upsertSessions(prev, session));
      setCurrentSession(session);
    } catch (error: unknown) {
      log.error('saveSession:failed', error);
    }
  }, []);

  const deleteSession = useCallback(
    async (id: string) => {
      try {
        const result = await rpcClient.deleteSession({ id });
        if (!result.ok) {
          log.error('deleteSession:failed', result.error);
          return;
        }

        setSessions((prev) => prev.filter((s) => s.id !== id));
        if (currentSession?.id === id) {
          setCurrentSession(null);
        }
      } catch (error: unknown) {
        log.error('deleteSession:failed', error);
      }
    },
    [currentSession?.id]
  );

  const createNewSession = useCallback(
    (originalInput: string, prompt: string, title?: string, lyrics?: string): PromptSession =>
      buildNewSession(originalInput, prompt, title, lyrics),
    []
  );

  useEffect(() => {
    void loadHistory();
  }, [loadHistory]);

  // Memoize the context value to prevent unnecessary re-renders of consumers
  const contextValue = useMemo<SessionContextType>(
    () => ({
      sessions,
      currentSession,
      setCurrentSession,
      loadHistory,
      saveSession,
      deleteSession,
      createNewSession,
      generateId,
    }),
    [sessions, currentSession, loadHistory, saveSession, deleteSession, createNewSession]
  );

  return <SessionContext.Provider value={contextValue}>{children}</SessionContext.Provider>;
};
