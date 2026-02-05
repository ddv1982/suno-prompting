import { createContext, useContext, useMemo, type ReactNode } from 'react';

import { useGenerationState } from '@/hooks/use-generation-state';
import { useOptimisticGeneration } from '@/hooks/use-optimistic-generation';

import type { GenerationStateContextValue } from './types';

const GenerationStateContext = createContext<GenerationStateContextValue | null>(null);

export function useGenerationStateContext(): GenerationStateContextValue {
  const context = useContext(GenerationStateContext);
  if (!context) {
    throw new Error('useGenerationStateContext must be used within GenerationStateProvider');
  }
  return context;
}

export function GenerationStateProvider({ children }: { children: ReactNode }): ReactNode {
  const state = useGenerationState();
  const optimistic = useOptimisticGeneration();

  const value = useMemo<GenerationStateContextValue>(
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

  return (
    <GenerationStateContext.Provider value={value}>{children}</GenerationStateContext.Provider>
  );
}
