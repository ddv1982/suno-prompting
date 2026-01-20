import { useOptimistic, useTransition } from 'react';

import type { GeneratingAction } from '@/hooks/use-generation-state';

interface OptimisticGenerationState {
  readonly isOptimistic: boolean;
  readonly optimisticAction: GeneratingAction;
  readonly showSkeleton: boolean;
}

type OptimisticAction = 
  | { type: 'start'; action: GeneratingAction }
  | { type: 'complete' }
  | { type: 'error' };

function optimisticReducer(
  _state: OptimisticGenerationState,
  action: OptimisticAction
): OptimisticGenerationState {
  switch (action.type) {
    case 'start':
      return { isOptimistic: true, optimisticAction: action.action, showSkeleton: true };
    case 'complete':
    case 'error':
      return { isOptimistic: false, optimisticAction: 'none', showSkeleton: false };
  }
}

const INITIAL_STATE: OptimisticGenerationState = {
  isOptimistic: false,
  optimisticAction: 'none',
  showSkeleton: false,
};

interface UseOptimisticGenerationReturn extends OptimisticGenerationState {
  startOptimistic: (action: GeneratingAction) => void;
  completeOptimistic: () => void;
  errorOptimistic: () => void;
}

/**
 * Hook that wraps React 19's useOptimistic for generation state management.
 * Provides immediate UI feedback during prompt generation across all modes.
 *
 * @returns Optimistic state and control methods
 *
 * @example
 * ```tsx
 * const { isOptimistic, showSkeleton, startOptimistic, completeOptimistic, errorOptimistic } = useOptimisticGeneration();
 *
 * const handleGenerate = async () => {
 *   startOptimistic('generate');
 *   try {
 *     const result = await rpcClient.generate(input);
 *     completeOptimistic();
 *   } catch (error) {
 *     errorOptimistic();
 *   }
 * };
 * ```
 */
export function useOptimisticGeneration(): UseOptimisticGenerationReturn {
  const [optimisticState, addOptimistic] = useOptimistic(
    INITIAL_STATE,
    optimisticReducer
  );
  const [, startTransition] = useTransition();

  const startOptimistic = (action: GeneratingAction): void => {
    startTransition(() => {
      addOptimistic({ type: 'start', action });
    });
  };

  const completeOptimistic = (): void => {
    startTransition(() => {
      addOptimistic({ type: 'complete' });
    });
  };

  const errorOptimistic = (): void => {
    startTransition(() => {
      addOptimistic({ type: 'error' });
    });
  };

  return {
    ...optimisticState,
    startOptimistic,
    completeOptimistic,
    errorOptimistic,
  };
}
