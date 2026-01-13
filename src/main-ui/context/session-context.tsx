import { createContext, useContext, useState, useCallback, useEffect, useMemo, type ReactNode } from 'react';

import { createLogger } from '@/lib/logger';
import { rpcClient } from '@/services/rpc-client';
import { type PromptSession } from '@shared/types';
import { nowISO } from '@shared/utils';

const log = createLogger('Session');

function generateId(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return (
    Math.random().toString(36).substring(2, 15) +
    Math.random().toString(36).substring(2, 15)
  );
}

export interface SessionContextType {
  sessions: PromptSession[];
  currentSession: PromptSession | null;
  setCurrentSession: (session: PromptSession | null) => void;
  loadHistory: (retries?: number) => Promise<void>;
  saveSession: (session: PromptSession) => Promise<void>;
  deleteSession: (id: string) => Promise<void>;
  createNewSession: (originalInput: string, prompt: string, title?: string, lyrics?: string) => PromptSession;
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
      setSessions(result.ok ? result.value.sessions : []);
    } catch (error: unknown) {
      if (retries > 0) {
        await new Promise((resolve) => setTimeout(resolve, 400));
        return loadHistory(retries - 1);
      }
      log.error("loadHistory:failed", error);
    }
  }, []);

  const saveSession = useCallback(async (session: PromptSession) => {
    setSessions((prev) => {
      const filtered = prev.filter(s => s.id !== session.id);
      return [session, ...filtered];
    });
    setCurrentSession(session);
    try {
      await rpcClient.saveSession({ session });
    } catch (error: unknown) {
      log.error("saveSession:failed", error);
    }
  }, []);

  const deleteSession = useCallback(async (id: string) => {
    try {
      await rpcClient.deleteSession({ id });
      setSessions((prev) => prev.filter(s => s.id !== id));
      if (currentSession?.id === id) {
        setCurrentSession(null);
      }
    } catch (error: unknown) {
      log.error("deleteSession:failed", error);
    }
  }, [currentSession?.id]);

  const createNewSession = useCallback((
    originalInput: string, 
    prompt: string, 
    title?: string, 
    lyrics?: string
  ): PromptSession => {
    const now = nowISO();
    return {
      id: generateId(),
      originalInput,
      currentPrompt: prompt,
      currentTitle: title,
      currentLyrics: lyrics,
      versionHistory: [{
        id: generateId(),
        content: prompt,
        title,
        lyrics,
        timestamp: now,
      }],
      createdAt: now,
      updatedAt: now,
    };
  }, []);

  useEffect(() => {
    void loadHistory();
  }, [loadHistory]);

  // Memoize the context value to prevent unnecessary re-renders of consumers
  const contextValue = useMemo<SessionContextType>(() => ({
    sessions,
    currentSession,
    setCurrentSession,
    loadHistory,
    saveSession,
    deleteSession,
    createNewSession,
    generateId,
  }), [
    sessions,
    currentSession,
    loadHistory,
    saveSession,
    deleteSession,
    createNewSession,
  ]);

  return (
    <SessionContext.Provider value={contextValue}>
      {children}
    </SessionContext.Provider>
  );
};
