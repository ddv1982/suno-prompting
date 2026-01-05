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

  // Factory for prompt-only remix handlers (prompt → remixed prompt)
  const makePromptRemix = useCallback((action: GeneratingAction, method: keyof typeof api, label: string, msg: string) => async () => {
    if (!currentSession?.currentPrompt) return;
    await executeRemixAction(action as Exclude<GeneratingAction, 'none' | 'generate' | 'remix'>, () => (api[method] as (p: string) => Promise<{ prompt: string; versionId: string; validation: ValidationResult }>)(currentSession.currentPrompt), label, msg);
  }, [currentSession, executeRemixAction]);

  const handleRemixGenre = useMemo(() => makePromptRemix('remixGenre', 'remixGenre', 'genre remix', 'Genre remixed.'), [makePromptRemix]);
  const handleRemixMood = useMemo(() => makePromptRemix('remixMood', 'remixMood', 'mood remix', 'Mood remixed.'), [makePromptRemix]);
  const handleRemixStyleTags = useMemo(() => makePromptRemix('remixStyleTags', 'remixStyleTags', 'style tags remix', 'Style tags remixed.'), [makePromptRemix]);
  const handleRemixRecording = useMemo(() => makePromptRemix('remixRecording', 'remixRecording', 'recording remix', 'Recording remixed.'), [makePromptRemix]);

  // Special case: remixInstruments needs originalInput
  const handleRemixInstruments = useCallback(async () => {
    if (!currentSession?.originalInput) return;
    await executeRemixAction('remixInstruments', () => api.remixInstruments(currentSession.currentPrompt, currentSession.originalInput), 'instruments remix', 'Instruments remixed.');
  }, [currentSession, executeRemixAction]);

  /** Execute a single-field remix action (title or lyrics) - updates field without changing prompt */
  const executeSingleFieldRemix = useCallback(async <T extends { title?: string; lyrics?: string }>(
    action: 'remixTitle' | 'remixLyrics', apiCall: () => Promise<T>,
    getUpdate: (r: T) => Partial<PromptSession>, label: string, msg: string
  ) => {
    if (isGenerating || !currentSession) return;
    try {
      setGeneratingAction(action);
      const result = await apiCall();
      const update = getUpdate(result);
      const newVersion = createVersion({
        prompt: currentSession.currentPrompt, versionId: generateId(),
        title: update.currentTitle ?? currentSession.currentTitle,
        lyrics: update.currentLyrics ?? currentSession.currentLyrics,
      }, `[${label}]`);
      const updatedSession: PromptSession = { ...currentSession, ...update, versionHistory: [...currentSession.versionHistory, newVersion], updatedAt: nowISO() };
      setChatMessages((prev) => [...prev, { role: "ai", content: msg }]);
      await saveSession(updatedSession);
    } catch (error) {
      handleGenerationError(error, label, setChatMessages, log);
    } finally {
      setGeneratingAction('none');
    }
  }, [isGenerating, currentSession, generateId, saveSession, setGeneratingAction, setChatMessages]);

  const handleRemixTitle = useCallback(async () => {
    if (!currentSession?.currentPrompt || !currentSession?.originalInput) return;
    await executeSingleFieldRemix('remixTitle', () => api.remixTitle(currentSession.currentPrompt, currentSession.originalInput), (r) => ({ currentTitle: r.title }), 'title remix', 'Title remixed.');
  }, [currentSession, executeSingleFieldRemix]);

  const handleRemixLyrics = useCallback(async () => {
    if (!currentSession?.currentPrompt || !currentSession?.originalInput) return;
    await executeSingleFieldRemix('remixLyrics', () => api.remixLyrics(currentSession.currentPrompt, currentSession.originalInput, currentSession.lyricsTopic), (r) => ({ currentLyrics: r.lyrics }), 'lyrics remix', 'Lyrics remixed.');
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
