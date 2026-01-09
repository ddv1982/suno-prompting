import { createContext, useContext, type ReactNode } from 'react';

import { useGenerationState } from '@/hooks/use-generation-state';

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

  return (
    <GenerationStateContext.Provider value={state}>
      {children}
    </GenerationStateContext.Provider>
  );
}
