import { useCallback, useMemo } from 'react';

import { createLogger } from '@/lib/logger';
import { formatRpcError } from '@/lib/rpc-utils';
import { rpcClient } from '@/services/rpc-client';
import { type MoodCategory } from '@bun/mood';
import { type QuickVibesInput, type QuickVibesCategory } from '@shared/types';

import {
  useGenerationAction,
  createSessionDeps,
  type GenerationActionDeps,
} from './use-generation-action';

const log = createLogger('QuickVibes');

type QuickVibesActionsConfig = GenerationActionDeps & {
  setPendingInput: (input: string) => void;
  getQuickVibesInput: () => QuickVibesInput;
};

export interface QuickVibesActionsResult {
  handleGenerateQuickVibes: (
    category: QuickVibesCategory | null,
    customDescription: string,
    sunoStyles?: string[],
    moodCategory?: MoodCategory | null
  ) => Promise<void>;
  handleRemixQuickVibes: () => Promise<void>;
  handleRefineQuickVibes: (input: string) => Promise<boolean>;
}

export function useQuickVibesActions(config: QuickVibesActionsConfig): QuickVibesActionsResult {
  const { isGenerating, currentSession, setPendingInput, getQuickVibesInput, showToast } = config;

  const sessionDeps = useMemo(() => createSessionDeps(config, log), [config]);
  const { execute } = useGenerationAction(config);

  const handleGenerateQuickVibes = useCallback(
    async (
      category: QuickVibesCategory | null,
      customDescription: string,
      sunoStyles: string[] = [],
      moodCategory: MoodCategory | null = null
    ) => {
      const originalInput =
        sunoStyles.length > 0
          ? `[Suno V5] ${sunoStyles.join(', ')}`
          : [category ? `[${category}]` : null, customDescription || null]
              .filter(Boolean)
              .join(' ') || 'Quick Vibes';

      await execute(
        {
          action: 'quickVibes',
          apiCall: async () => {
            const result = await rpcClient.generateQuickVibes({
              category,
              customDescription,
              sunoStyles,
              moodCategory,
            });
            if (!result.ok) throw new Error(formatRpcError(result.error));
            return result.value;
          },
          originalInput,
          promptMode: 'quickVibes',
          modeInput: { quickVibesInput: { category, customDescription, sunoStyles, moodCategory } },
          successMessage: 'Quick Vibes prompt generated.',
          errorContext: 'generate Quick Vibes',
          log,
          onSuccess: () => {
            showToast('Quick Vibes generated!', 'success');
          },
        },
        sessionDeps
      );
    },
    [execute, sessionDeps, showToast]
  );

  const handleRemixQuickVibes = useCallback(async () => {
    if (isGenerating) return;
    if (!currentSession?.quickVibesInput) return;

    const {
      category,
      customDescription,
      sunoStyles: storedSunoStyles,
    } = currentSession.quickVibesInput;
    await handleGenerateQuickVibes(category, customDescription, storedSunoStyles ?? []);
  }, [isGenerating, currentSession, handleGenerateQuickVibes]);

  const handleRefineQuickVibes = useCallback(
    async (input: string): Promise<boolean> => {
      if (!currentSession?.currentPrompt) return false;

      const uiInput = getQuickVibesInput();

      return execute(
        {
          action: 'quickVibes',
          apiCall: async () => {
            const result = await rpcClient.refineQuickVibes({
              currentPrompt: currentSession.currentPrompt,
              currentTitle: currentSession.currentTitle,
              description: uiInput.customDescription,
              feedback: input,
              category: uiInput.category,
              sunoStyles: uiInput.sunoStyles,
            });
            if (!result.ok) throw new Error(formatRpcError(result.error));
            return result.value;
          },
          originalInput: currentSession.originalInput || '',
          promptMode: 'quickVibes',
          modeInput: { quickVibesInput: uiInput },
          successMessage: 'Quick Vibes prompt refined.',
          feedback: input,
          errorContext: 'refine Quick Vibes',
          log,
          onSuccess: () => {
            setPendingInput('');
          },
        },
        sessionDeps
      );
    },
    [execute, sessionDeps, getQuickVibesInput, currentSession, setPendingInput]
  );

  return {
    handleGenerateQuickVibes,
    handleRemixQuickVibes,
    handleRefineQuickVibes,
  };
}
