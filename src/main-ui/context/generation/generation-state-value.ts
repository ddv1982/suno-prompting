import { useMemo } from 'react';

import type { GenerationActionDeps } from '@/hooks/use-generation-action';
import { useGenerationState } from '@/hooks/use-generation-state';
import { useOptimisticGeneration } from '@/hooks/use-optimistic-generation';

import type { GenerationStateContextValue } from './types';

export function useGenerationActionDeps({
  completeOptimistic,
  currentSession,
  errorOptimistic,
  generateId,
  isGenerating,
  saveSession,
  setChatMessages,
  setDebugTrace,
  setGeneratingAction,
  setValidation,
  showToast,
  startOptimistic,
}: GenerationActionDeps): GenerationActionDeps {
  return useMemo(
    () => ({
      isGenerating,
      currentSession,
      generateId,
      saveSession,
      setGeneratingAction,
      setDebugTrace,
      setChatMessages,
      setValidation,
      showToast,
      startOptimistic,
      completeOptimistic,
      errorOptimistic,
    }),
    [
      isGenerating,
      currentSession,
      generateId,
      saveSession,
      setGeneratingAction,
      setDebugTrace,
      setChatMessages,
      setValidation,
      showToast,
      startOptimistic,
      completeOptimistic,
      errorOptimistic,
    ]
  );
}

export function useGenerationStateValue(): GenerationStateContextValue {
  const state = useGenerationState();
  const optimistic = useOptimisticGeneration();

  return useMemo(
    () => ({
      ...state,
      isOptimistic: optimistic.isOptimistic,
      showSkeleton: optimistic.showSkeleton,
      startOptimistic: optimistic.startOptimistic,
      completeOptimistic: optimistic.completeOptimistic,
      errorOptimistic: optimistic.errorOptimistic,
    }),
    [state, optimistic]
  );
}
