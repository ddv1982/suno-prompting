import { useCallback, useMemo } from 'react';

import { type ChatMessage } from '@/lib/chat-utils';
import { createLogger } from '@/lib/logger';
import { handleGenerationError, createVersion } from '@/lib/session-helpers';
import { api } from '@/services/rpc';
import { type PromptSession } from '@shared/types';
import { nowISO } from '@shared/utils';
import { type ValidationResult } from '@shared/validation';

import { type GeneratingAction } from './use-generation-state';


const log = createLogger('RemixActions');

/** API methods for prompt-only remix actions (no originalInput needed) */
type PromptRemixMethod = 'remixGenre' | 'remixMood' | 'remixStyleTags' | 'remixRecording';

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

// eslint-disable-next-line max-lines-per-function -- Hook managing all 4 remix types (genre, mood, instruments, style tags)
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
        updatedAt: nowISO(),
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

  // Factory for prompt-only remix handlers
  const createPromptRemixHandler = useCallback((
    action: GeneratingAction,
    apiMethod: PromptRemixMethod,
    label: string,
    message: string
  ) => async () => {
    if (!currentSession?.currentPrompt) return;
    await executeRemixAction(
      action as Exclude<GeneratingAction, 'none' | 'generate' | 'remix'>,
      () => api[apiMethod](currentSession.currentPrompt),
      label,
      message
    );
  }, [currentSession, executeRemixAction]);

  // Generate prompt-only remix handlers from config
  const handleRemixGenre = useMemo(
    () => createPromptRemixHandler('remixGenre', 'remixGenre', 'genre remix', 'Genre remixed.'),
    [createPromptRemixHandler]
  );
  const handleRemixMood = useMemo(
    () => createPromptRemixHandler('remixMood', 'remixMood', 'mood remix', 'Mood remixed.'),
    [createPromptRemixHandler]
  );
  const handleRemixStyleTags = useMemo(
    () => createPromptRemixHandler('remixStyleTags', 'remixStyleTags', 'style tags remix', 'Style tags remixed.'),
    [createPromptRemixHandler]
  );
  const handleRemixRecording = useMemo(
    () => createPromptRemixHandler('remixRecording', 'remixRecording', 'recording remix', 'Recording remixed.'),
    [createPromptRemixHandler]
  );

  // Special case: remixInstruments needs originalInput
  const handleRemixInstruments = useCallback(async () => {
    if (!currentSession?.originalInput) return;
    await executeRemixAction(
      'remixInstruments',
      () => api.remixInstruments(currentSession.currentPrompt, currentSession.originalInput),
      'instruments remix',
      'Instruments remixed.'
    );
  }, [currentSession, executeRemixAction]);

  /**
   * Execute a single-field remix action (title or lyrics).
   * Unlike executeRemixAction, this updates only one field without changing the prompt.
   */
  const executeSingleFieldRemix = useCallback(async <T extends { title?: string; lyrics?: string }>(
    action: 'remixTitle' | 'remixLyrics',
    apiCall: () => Promise<T>,
    getSessionUpdate: (result: T) => Partial<PromptSession>,
    feedbackLabel: string,
    successMessage: string
  ) => {
    // Guards for currentPrompt/originalInput are in the calling handlers for TypeScript narrowing
    if (isGenerating || !currentSession) return;

    try {
      setGeneratingAction(action);
      const result = await apiCall();

      const sessionUpdate = getSessionUpdate(result);
      const newVersion = createVersion(
        { 
          prompt: currentSession.currentPrompt, 
          versionId: generateId(), 
          title: sessionUpdate.currentTitle ?? currentSession.currentTitle, 
          lyrics: sessionUpdate.currentLyrics ?? currentSession.currentLyrics 
        },
        `[${feedbackLabel}]`
      );

      const updatedSession: PromptSession = {
        ...currentSession,
        ...sessionUpdate,
        versionHistory: [...currentSession.versionHistory, newVersion],
        updatedAt: nowISO(),
      };

      setChatMessages((prev) => [...prev, { role: "ai", content: successMessage }]);
      await saveSession(updatedSession);
    } catch (error) {
      handleGenerationError(error, feedbackLabel, setChatMessages, log);
    } finally {
      setGeneratingAction('none');
    }
  }, [isGenerating, currentSession, generateId, saveSession, setGeneratingAction, setChatMessages]);

  const handleRemixTitle = useCallback(async () => {
    if (!currentSession?.currentPrompt || !currentSession?.originalInput) return;
    await executeSingleFieldRemix(
      'remixTitle',
      () => api.remixTitle(currentSession.currentPrompt, currentSession.originalInput),
      (result) => ({ currentTitle: result.title }),
      'title remix',
      'Title remixed.'
    );
  }, [currentSession, executeSingleFieldRemix]);

  const handleRemixLyrics = useCallback(async () => {
    if (!currentSession?.currentPrompt || !currentSession?.originalInput) return;
    await executeSingleFieldRemix(
      'remixLyrics',
      () => api.remixLyrics(currentSession.currentPrompt, currentSession.originalInput, currentSession.lyricsTopic),
      (result) => ({ currentLyrics: result.lyrics }),
      'lyrics remix',
      'Lyrics remixed.'
    );
  }, [currentSession, executeSingleFieldRemix]);

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
