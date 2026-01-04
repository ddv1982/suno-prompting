import { useCallback } from 'react';
import { api } from '@/services/rpc';
import { type PromptSession, type DebugInfo, type CreativeBoostInput } from '@shared/types';
import { type ValidationResult } from '@shared/validation';
import { type ChatMessage } from '@/lib/chat-utils';
import { createLogger } from '@/lib/logger';
import { getErrorMessage } from '@shared/errors';
import type { GeneratingAction } from '@/hooks/use-generation-state';
import {
  completeSessionUpdate,
  handleGenerationError,
  addUserMessage,
  type SessionDeps,
} from '@/lib/session-helpers';

const log = createLogger('CreativeBoost');

const buildSavedCreativeBoostInput = (input: CreativeBoostInput): CreativeBoostInput => ({
  creativityLevel: input.creativityLevel,
  seedGenres: input.seedGenres,
  sunoStyles: input.sunoStyles,
  description: input.description,
  lyricsTopic: input.lyricsTopic,
  withWordlessVocals: input.withWordlessVocals,
});

const buildCreativeBoostOriginalInput = (input: CreativeBoostInput): string => {
  return [
    `[creativity: ${input.creativityLevel}%]`,
    input.seedGenres.length > 0 ? `[genres: ${input.seedGenres.join(', ')}]` : null,
    input.sunoStyles.length > 0 ? `[suno-styles: ${input.sunoStyles.join(', ')}]` : null,
    input.description || null,
  ].filter(Boolean).join(' ') || 'Creative Boost';
};

type CreativeBoostActionsConfig = {
  isGenerating: boolean;
  currentSession: PromptSession | null;
  generateId: () => string;
  saveSession: (session: PromptSession) => Promise<void>;
  setGeneratingAction: (action: GeneratingAction) => void;
  setDebugInfo: (info: Partial<DebugInfo> | undefined) => void;
  setChatMessages: React.Dispatch<React.SetStateAction<ChatMessage[]>>;
  setValidation: (v: ValidationResult) => void;
  setPendingInput: (input: string) => void;
  showToast: (message: string, type: 'success' | 'error') => void;
  creativeBoostInput: CreativeBoostInput;
  maxMode: boolean;
  lyricsMode: boolean;
};

export function useCreativeBoostActions(config: CreativeBoostActionsConfig) {
  const {
    isGenerating,
    currentSession,
    generateId,
    saveSession,
    setGeneratingAction,
    setDebugInfo,
    setChatMessages,
    setValidation,
    setPendingInput,
    showToast,
    creativeBoostInput,
    maxMode,
    lyricsMode,
  } = config;

  const sessionDeps: SessionDeps = {
    currentSession,
    generateId,
    saveSession,
    setDebugInfo,
    setChatMessages,
    setValidation,
    setGeneratingAction,
    log,
  };

  const handleGenerateCreativeBoost = useCallback(async () => {
    if (isGenerating) return;

    try {
      setGeneratingAction('creativeBoost');
      const result = await api.generateCreativeBoost({
        creativityLevel: creativeBoostInput.creativityLevel,
        seedGenres: creativeBoostInput.seedGenres,
        sunoStyles: creativeBoostInput.sunoStyles,
        description: creativeBoostInput.description,
        lyricsTopic: creativeBoostInput.lyricsTopic,
        withWordlessVocals: creativeBoostInput.withWordlessVocals,
        maxMode,
        withLyrics: lyricsMode,
      });

      if (!result?.prompt) {
        throw new Error("Invalid result received from Creative Boost generation");
      }

      const originalInput = buildCreativeBoostOriginalInput(creativeBoostInput);

      await completeSessionUpdate(
        sessionDeps,
        result,
        originalInput,
        'creativeBoost',
        { creativeBoostInput: buildSavedCreativeBoostInput(creativeBoostInput) },
        "Creative Boost prompt generated."
      );
      showToast('Creative Boost generated!', 'success');
    } catch (error) {
      handleGenerationError(error, "generate Creative Boost", setChatMessages, log);
      showToast(getErrorMessage(error, "Failed to generate Creative Boost"), 'error');
    } finally {
      setGeneratingAction('none');
    }
  }, [isGenerating, currentSession, generateId, saveSession, creativeBoostInput, maxMode, lyricsMode, showToast, setGeneratingAction, setDebugInfo, setChatMessages, setValidation]);

  const handleRefineCreativeBoost = useCallback(async (feedback: string) => {
    if (isGenerating) return;
    if (!currentSession?.currentPrompt || !currentSession?.currentTitle) return;

    try {
      setGeneratingAction('creativeBoost');
      addUserMessage(setChatMessages, feedback);

      const result = await api.refineCreativeBoost({
        currentPrompt: currentSession.currentPrompt,
        currentTitle: currentSession.currentTitle,
        feedback,
        lyricsTopic: creativeBoostInput.lyricsTopic,
        description: creativeBoostInput.description,
        seedGenres: creativeBoostInput.seedGenres,
        sunoStyles: creativeBoostInput.sunoStyles,
        withWordlessVocals: creativeBoostInput.withWordlessVocals,
        maxMode,
        withLyrics: lyricsMode,
      });

      if (!result?.prompt) {
        throw new Error("Invalid result received from Creative Boost refinement");
      }

      await completeSessionUpdate(
        sessionDeps,
        result,
        currentSession.originalInput,
        'creativeBoost',
        { creativeBoostInput: buildSavedCreativeBoostInput(creativeBoostInput) },
        "Creative Boost prompt refined.",
        feedback
      );
      setPendingInput("");
      showToast('Creative Boost refined!', 'success');
    } catch (error) {
      handleGenerationError(error, "refine Creative Boost", setChatMessages, log);
      showToast(getErrorMessage(error, "Failed to refine Creative Boost"), 'error');
    } finally {
      setGeneratingAction('none');
    }
  }, [isGenerating, currentSession, creativeBoostInput, maxMode, lyricsMode, saveSession, setPendingInput, showToast, setGeneratingAction, setDebugInfo, setChatMessages, setValidation]);

  return {
    handleGenerateCreativeBoost,
    handleRefineCreativeBoost,
  };
}
