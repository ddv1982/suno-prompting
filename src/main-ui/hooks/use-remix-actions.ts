import { useCallback } from 'react';
import { api } from '@/services/rpc';
import { type PromptSession } from '@shared/types';
import { type ValidationResult } from '@shared/validation';
import { type ChatMessage } from '@/lib/chat-utils';
import { createLogger } from '@/lib/logger';
import { type GeneratingAction } from './use-generation-state';
import { handleGenerationError, createVersion } from '@/lib/session-helpers';

const log = createLogger('RemixActions');

type RemixActionDeps = {
  isGenerating: boolean;
  currentSession: PromptSession | null;
  generateId: () => string;
  saveSession: (session: PromptSession) => Promise<void>;
  setGeneratingAction: (action: GeneratingAction) => void;
  setDebugInfo: (info: undefined) => void;
  setChatMessages: React.Dispatch<React.SetStateAction<ChatMessage[]>>;
  setValidation: (v: ValidationResult) => void;
};

export function useRemixActions(deps: RemixActionDeps) {
  const {
    isGenerating,
    currentSession,
    generateId,
    saveSession,
    setGeneratingAction,
    setDebugInfo,
    setChatMessages,
    setValidation,
  } = deps;

  const executeRemixAction = useCallback(async (
    action: Exclude<GeneratingAction, 'none' | 'generate' | 'remix'>,
    apiCall: () => Promise<{ prompt: string; versionId: string; validation: ValidationResult }>,
    feedbackLabel: string,
    successMessage: string
  ) => {
    if (isGenerating || !currentSession?.currentPrompt) return;

    try {
      setGeneratingAction(action);
      setDebugInfo(undefined);
      const result = await apiCall();

      if (!result?.prompt) {
        throw new Error(`Invalid result received from ${feedbackLabel}`);
      }

      const newVersion = createVersion(
        { ...result, title: currentSession.currentTitle, lyrics: currentSession.currentLyrics },
        `[${feedbackLabel}]`
      );

      const updatedSession: PromptSession = {
        ...currentSession,
        currentPrompt: result.prompt,
        versionHistory: [...currentSession.versionHistory, newVersion],
        updatedAt: new Date().toISOString(),
      };

      setChatMessages((prev) => [...prev, { role: "ai", content: successMessage }]);
      setValidation(result.validation);
      await saveSession(updatedSession);
    } catch (error) {
      handleGenerationError(error, feedbackLabel, setChatMessages, log);
    } finally {
      setGeneratingAction('none');
    }
  }, [isGenerating, currentSession, generateId, saveSession, setGeneratingAction, setDebugInfo, setChatMessages, setValidation]);

  const handleRemixInstruments = useCallback(async () => {
    if (!currentSession?.originalInput) return;
    await executeRemixAction(
      'remixInstruments',
      () => api.remixInstruments(currentSession.currentPrompt, currentSession.originalInput),
      'instruments remix',
      'Instruments remixed.'
    );
  }, [currentSession, executeRemixAction]);

  const handleRemixGenre = useCallback(async () => {
    if (!currentSession?.currentPrompt) return;
    await executeRemixAction(
      'remixGenre',
      () => api.remixGenre(currentSession.currentPrompt),
      'genre remix',
      'Genre remixed.'
    );
  }, [currentSession, executeRemixAction]);

  const handleRemixMood = useCallback(async () => {
    if (!currentSession?.currentPrompt) return;
    await executeRemixAction(
      'remixMood',
      () => api.remixMood(currentSession.currentPrompt),
      'mood remix',
      'Mood remixed.'
    );
  }, [currentSession, executeRemixAction]);

  const handleRemixStyleTags = useCallback(async () => {
    if (!currentSession?.currentPrompt) return;
    await executeRemixAction(
      'remixStyleTags',
      () => api.remixStyleTags(currentSession.currentPrompt),
      'style tags remix',
      'Style tags remixed.'
    );
  }, [currentSession, executeRemixAction]);

  const handleRemixRecording = useCallback(async () => {
    if (!currentSession?.currentPrompt) return;
    await executeRemixAction(
      'remixRecording',
      () => api.remixRecording(currentSession.currentPrompt),
      'recording remix',
      'Recording remixed.'
    );
  }, [currentSession, executeRemixAction]);

  const handleRemixTitle = useCallback(async () => {
    if (!currentSession?.currentPrompt || !currentSession?.originalInput) return;
    if (isGenerating) return;

    try {
      setGeneratingAction('remixTitle');
      const result = await api.remixTitle(currentSession.currentPrompt, currentSession.originalInput);

      const newVersion = createVersion(
        { prompt: currentSession.currentPrompt, versionId: generateId(), title: result.title, lyrics: currentSession.currentLyrics },
        '[title remix]'
      );

      const updatedSession: PromptSession = {
        ...currentSession,
        currentTitle: result.title,
        versionHistory: [...currentSession.versionHistory, newVersion],
        updatedAt: new Date().toISOString(),
      };

      setChatMessages((prev) => [...prev, { role: "ai", content: "Title remixed." }]);
      await saveSession(updatedSession);
    } catch (error) {
      handleGenerationError(error, "remix title", setChatMessages, log);
    } finally {
      setGeneratingAction('none');
    }
  }, [isGenerating, currentSession, generateId, saveSession, setGeneratingAction, setChatMessages]);

  const handleRemixLyrics = useCallback(async () => {
    if (!currentSession?.currentPrompt || !currentSession?.originalInput) return;
    if (isGenerating) return;

    try {
      setGeneratingAction('remixLyrics');
      const result = await api.remixLyrics(currentSession.currentPrompt, currentSession.originalInput, currentSession.lyricsTopic);

      const newVersion = createVersion(
        { prompt: currentSession.currentPrompt, versionId: generateId(), title: currentSession.currentTitle, lyrics: result.lyrics },
        '[lyrics remix]'
      );

      const updatedSession: PromptSession = {
        ...currentSession,
        currentLyrics: result.lyrics,
        versionHistory: [...currentSession.versionHistory, newVersion],
        updatedAt: new Date().toISOString(),
      };

      setChatMessages((prev) => [...prev, { role: "ai", content: "Lyrics remixed." }]);
      await saveSession(updatedSession);
    } catch (error) {
      handleGenerationError(error, "remix lyrics", setChatMessages, log);
    } finally {
      setGeneratingAction('none');
    }
  }, [isGenerating, currentSession, generateId, saveSession, setGeneratingAction, setChatMessages]);

  return {
    handleRemixInstruments,
    handleRemixGenre,
    handleRemixMood,
    handleRemixStyleTags,
    handleRemixRecording,
    handleRemixTitle,
    handleRemixLyrics,
  };
}
