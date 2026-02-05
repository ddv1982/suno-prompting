import { useCallback, useMemo } from 'react';

import { createLogger } from '@/lib/logger';
import { formatRpcError } from '@/lib/rpc-utils';
import { rpcClient } from '@/services/rpc-client';
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
  moodCategory: input.moodCategory,
});

const buildCreativeBoostOriginalInput = (input: CreativeBoostInput): string => {
  return (
    [
      `[creativity: ${input.creativityLevel}%]`,
      input.seedGenres.length > 0 ? `[genres: ${input.seedGenres.join(', ')}]` : null,
      input.sunoStyles.length > 0 ? `[suno-styles: ${input.sunoStyles.join(', ')}]` : null,
      input.description || null,
    ]
      .filter(Boolean)
      .join(' ') || 'Creative Boost'
  );
};

type CreativeBoostActionsConfig = GenerationActionDeps & {
  setPendingInput: (input: string) => void;
  creativeBoostInput: CreativeBoostInput;
  maxMode: boolean;
  lyricsMode: boolean;
};

export interface CreativeBoostActionsResult {
  handleGenerateCreativeBoost: () => Promise<void>;
  handleRefineCreativeBoost: (feedback: string) => Promise<boolean>;
}

export function useCreativeBoostActions(
  config: CreativeBoostActionsConfig
): CreativeBoostActionsResult {
  const { currentSession, setPendingInput, showToast, creativeBoostInput, maxMode, lyricsMode } =
    config;

  const sessionDeps = useMemo(() => createSessionDeps(config, log), [config]);
  const { execute } = useGenerationAction(config);

  const handleGenerateCreativeBoost = useCallback(async () => {
    const originalInput = buildCreativeBoostOriginalInput(creativeBoostInput);

    await execute(
      {
        action: 'creativeBoost',
        apiCall: async () => {
          const result = await rpcClient.generateCreativeBoost({
            creativityLevel: creativeBoostInput.creativityLevel,
            seedGenres: creativeBoostInput.seedGenres,
            sunoStyles: creativeBoostInput.sunoStyles,
            description: creativeBoostInput.description,
            lyricsTopic: creativeBoostInput.lyricsTopic,
            maxMode,
            withLyrics: lyricsMode,
          });
          if (!result.ok) throw new Error(formatRpcError(result.error));
          return result.value;
        },
        originalInput,
        promptMode: 'creativeBoost',
        modeInput: { creativeBoostInput: buildSavedCreativeBoostInput(creativeBoostInput) },
        successMessage: 'Creative Boost prompt generated.',
        errorContext: 'generate Creative Boost',
        log,
        onSuccess: () => {
          showToast('Creative Boost generated!', 'success');
        },
      },
      sessionDeps
    );
  }, [execute, sessionDeps, creativeBoostInput, maxMode, lyricsMode, showToast]);

  const handleRefineCreativeBoost = useCallback(
    async (feedback: string): Promise<boolean> => {
      if (!currentSession?.currentPrompt || !currentSession?.currentTitle) return false;

      // Extract for TypeScript narrowing
      const { currentPrompt, currentTitle, currentLyrics } = currentSession;

      // Pass targetGenreCount to preserve genre count during refinement
      // Only pass when seedGenres.length > 0, otherwise omit (backend treats undefined as "no enforcement")
      const targetGenreCount =
        creativeBoostInput.seedGenres.length > 0 ? creativeBoostInput.seedGenres.length : undefined;

      return execute(
        {
          action: 'creativeBoost',
          apiCall: async () => {
            const result = await rpcClient.refineCreativeBoost({
              currentPrompt,
              currentTitle,
              currentLyrics,
              feedback,
              lyricsTopic: creativeBoostInput.lyricsTopic,
              description: creativeBoostInput.description,
              seedGenres: creativeBoostInput.seedGenres,
              sunoStyles: creativeBoostInput.sunoStyles,
              maxMode,
              withLyrics: lyricsMode,
              targetGenreCount,
            });
            if (!result.ok) throw new Error(formatRpcError(result.error));
            return result.value;
          },
          originalInput: currentSession.originalInput || '',
          promptMode: 'creativeBoost',
          modeInput: { creativeBoostInput: buildSavedCreativeBoostInput(creativeBoostInput) },
          successMessage: 'Creative Boost prompt refined.',
          feedback,
          errorContext: 'refine Creative Boost',
          log,
          onSuccess: () => {
            setPendingInput('');
          },
        },
        sessionDeps
      );
    },
    [execute, sessionDeps, currentSession, creativeBoostInput, maxMode, lyricsMode, setPendingInput]
  );

  return {
    handleGenerateCreativeBoost,
    handleRefineCreativeBoost,
  };
}
