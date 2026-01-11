import { useCallback, useMemo } from 'react';

import { createLogger } from '@/lib/logger';
import { api } from '@/services/rpc';
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
  withWordlessVocals: boolean;
  getQuickVibesInput: () => QuickVibesInput;
};

export interface QuickVibesActionsResult {
  handleGenerateQuickVibes: (
    category: QuickVibesCategory | null,
    customDescription: string,
    wordlessVocals: boolean,
    sunoStyles?: string[],
    moodCategory?: MoodCategory | null
  ) => Promise<void>;
  handleRemixQuickVibes: () => Promise<void>;
  handleRefineQuickVibes: (input: string) => Promise<void>;
}

export function useQuickVibesActions(config: QuickVibesActionsConfig): QuickVibesActionsResult {
  const {
    isGenerating,
    currentSession,
    setPendingInput,
    withWordlessVocals,
    getQuickVibesInput,
    showToast,
  } = config;

  const sessionDeps = useMemo(() => createSessionDeps(config, log), [config]);
  const { execute } = useGenerationAction(config);

  const handleGenerateQuickVibes = useCallback(async (
    category: QuickVibesCategory | null,
    customDescription: string,
    wordlessVocals: boolean,
    sunoStyles: string[] = [],
    moodCategory: MoodCategory | null = null
  ) => {
    const originalInput = sunoStyles.length > 0
      ? `[Suno V5] ${sunoStyles.join(', ')}`
      : [category ? `[${category}]` : null, customDescription || null]
          .filter(Boolean).join(' ') || 'Quick Vibes';

    await execute(
      {
        action: 'quickVibes',
        apiCall: () => api.generateQuickVibes(category, customDescription, wordlessVocals, sunoStyles, moodCategory),
        originalInput,
        promptMode: 'quickVibes',
        modeInput: { quickVibesInput: { category, customDescription, withWordlessVocals: wordlessVocals, sunoStyles, moodCategory } },
        successMessage: "Quick Vibes prompt generated.",
        errorContext: "generate Quick Vibes",
        log,
        onSuccess: () => { showToast('Quick Vibes generated!', 'success'); },
      },
      sessionDeps
    );
  }, [execute, sessionDeps, showToast]);

  const handleRemixQuickVibes = useCallback(async () => {
    if (isGenerating) return;
    if (!currentSession?.quickVibesInput) return;

    const { category, customDescription, withWordlessVocals: storedWithWordlessVocals, sunoStyles: storedSunoStyles } = currentSession.quickVibesInput;
    await handleGenerateQuickVibes(category, customDescription, storedWithWordlessVocals ?? false, storedSunoStyles ?? []);
  }, [isGenerating, currentSession, handleGenerateQuickVibes]);

  const handleRefineQuickVibes = useCallback(async (input: string) => {
    if (!currentSession?.currentPrompt) return;

    const uiInput = getQuickVibesInput();

    await execute(
      {
        action: 'quickVibes',
        apiCall: () => api.refineQuickVibes({
          currentPrompt: currentSession.currentPrompt,
          currentTitle: currentSession.currentTitle,
          description: uiInput.customDescription,
          feedback: input,
          withWordlessVocals,
          category: uiInput.category,
          sunoStyles: uiInput.sunoStyles,
        }),
        originalInput: currentSession.originalInput || '',
        promptMode: 'quickVibes',
        modeInput: { quickVibesInput: { ...uiInput, withWordlessVocals } },
        successMessage: "Quick Vibes prompt refined.",
        feedback: input,
        errorContext: "refine Quick Vibes",
        log,
        onSuccess: () => {
          setPendingInput("");
          showToast('Quick Vibes refined!', 'success');
        },
      },
      sessionDeps
    );
  }, [execute, sessionDeps, getQuickVibesInput, currentSession, withWordlessVocals, setPendingInput, showToast]);

  return {
    handleGenerateQuickVibes,
    handleRemixQuickVibes,
    handleRefineQuickVibes,
  };
}
