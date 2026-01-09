import { useCallback, useMemo } from 'react';

import { createLogger } from '@/lib/logger';
import { handleGenerationError } from '@/lib/session-helpers';
import { api } from '@/services/rpc';
import { getErrorMessage } from '@shared/errors';
import { type CreativeBoostInput } from '@shared/types';

import {
  useGenerationAction,
  createSessionDeps,
  type GenerationActionDeps,
} from './use-generation-action';


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

type CreativeBoostActionsConfig = GenerationActionDeps & {
  setPendingInput: (input: string) => void;
  showToast: (message: string, type: 'success' | 'error') => void;
  creativeBoostInput: CreativeBoostInput;
  maxMode: boolean;
  lyricsMode: boolean;
};

export interface CreativeBoostActionsResult {
  handleGenerateCreativeBoost: () => Promise<void>;
  handleRefineCreativeBoost: (feedback: string) => Promise<void>;
}

export function useCreativeBoostActions(config: CreativeBoostActionsConfig): CreativeBoostActionsResult {
  const {
    currentSession,
    setChatMessages,
    setPendingInput,
    showToast,
    creativeBoostInput,
    maxMode,
    lyricsMode,
  } = config;

  const sessionDeps = useMemo(() => createSessionDeps(config, log), [config]);
  const { execute } = useGenerationAction(config);

  const handleGenerateCreativeBoost = useCallback(async () => {
    const originalInput = buildCreativeBoostOriginalInput(creativeBoostInput);

    try {
      await execute(
        {
          action: 'creativeBoost',
          apiCall: () => api.generateCreativeBoost({
            creativityLevel: creativeBoostInput.creativityLevel,
            seedGenres: creativeBoostInput.seedGenres,
            sunoStyles: creativeBoostInput.sunoStyles,
            description: creativeBoostInput.description,
            lyricsTopic: creativeBoostInput.lyricsTopic,
            withWordlessVocals: creativeBoostInput.withWordlessVocals,
            maxMode,
            withLyrics: lyricsMode,
          }),
          originalInput,
          promptMode: 'creativeBoost',
          modeInput: { creativeBoostInput: buildSavedCreativeBoostInput(creativeBoostInput) },
          successMessage: "Creative Boost prompt generated.",
          errorContext: "generate Creative Boost",
          log,
          onSuccess: () => { showToast('Creative Boost generated!', 'success'); },
        },
        sessionDeps
      );
    } catch (error: unknown) {
      showToast(getErrorMessage(error, "Failed to generate Creative Boost"), 'error');
    }
  }, [execute, sessionDeps, creativeBoostInput, maxMode, lyricsMode, showToast]);

  const handleRefineCreativeBoost = useCallback(async (feedback: string) => {
    if (!currentSession?.currentPrompt || !currentSession?.currentTitle) return;

    // Extract for TypeScript narrowing
    const { currentPrompt, currentTitle } = currentSession;

    try {
      // Pass targetGenreCount to preserve genre count during refinement
      // Only pass when seedGenres.length > 0, otherwise omit (backend treats undefined as "no enforcement")
      const targetGenreCount = creativeBoostInput.seedGenres.length > 0
        ? creativeBoostInput.seedGenres.length
        : undefined;

      await execute(
        {
          action: 'creativeBoost',
          apiCall: () => api.refineCreativeBoost({
            currentPrompt,
            currentTitle,
            feedback,
            lyricsTopic: creativeBoostInput.lyricsTopic,
            description: creativeBoostInput.description,
            seedGenres: creativeBoostInput.seedGenres,
            sunoStyles: creativeBoostInput.sunoStyles,
            withWordlessVocals: creativeBoostInput.withWordlessVocals,
            maxMode,
            withLyrics: lyricsMode,
            targetGenreCount,
          }),
          originalInput: currentSession.originalInput || '',
          promptMode: 'creativeBoost',
          modeInput: { creativeBoostInput: buildSavedCreativeBoostInput(creativeBoostInput) },
          successMessage: "Creative Boost prompt refined.",
          feedback,
          errorContext: "refine Creative Boost",
          log,
          onSuccess: () => {
            setPendingInput("");
            showToast('Creative Boost refined!', 'success');
          },
        },
        sessionDeps
      );
    } catch (error: unknown) {
      handleGenerationError(error, "refine Creative Boost", setChatMessages, log);
      showToast(getErrorMessage(error, "Failed to refine Creative Boost"), 'error');
    }
  }, [execute, sessionDeps, currentSession, creativeBoostInput, maxMode, lyricsMode, setPendingInput, showToast, setChatMessages]);

  return {
    handleGenerateCreativeBoost,
    handleRefineCreativeBoost,
  };
}
