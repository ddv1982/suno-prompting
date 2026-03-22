import { useMemo } from 'react';

import { useCreativeBoostActions } from '@/hooks/use-creative-boost-actions';
import { useQuickVibesActions } from '@/hooks/use-quick-vibes-actions';
import { useRemixActions } from '@/hooks/use-remix-actions';

import type {
  GenerationContextType,
  GenerationStateContextValue,
} from '@/context/generation/types';
import type {
  SessionOperationsContextValue,
  StandardGenerationContextValue,
} from '@/context/generation/types';
import type { useSessionContext } from '@/context/session-context';

type SessionContextValue = ReturnType<typeof useSessionContext>;

export interface GenerationFacadeDeps {
  stateCtx: GenerationStateContextValue;
  sessionOps: SessionOperationsContextValue;
  stdGeneration: StandardGenerationContextValue;
  session: Pick<SessionContextValue, 'currentSession' | 'generateId' | 'saveSession'>;
  editor: {
    creativeBoostInput: GenerationContextType['handleGenerateCreativeBoost'] extends () => Promise<void>
      ? import('@shared/types').CreativeBoostInput
      : never;
    getQuickVibesInput: () => import('@shared/types').QuickVibesInput;
    setPendingInput: (input: string) => void;
  };
  settings: {
    maxMode: boolean;
    lyricsMode: boolean;
  };
  optimisticDeps: {
    startOptimistic: GenerationStateContextValue['startOptimistic'];
    completeOptimistic: GenerationStateContextValue['completeOptimistic'];
    errorOptimistic: GenerationStateContextValue['errorOptimistic'];
  };
  showToast: (message: string, type: 'success' | 'error' | 'warning') => void;
}

export function useGenerationFacade(deps: GenerationFacadeDeps): GenerationContextType {
  const baseDeps = useMemo(
    () => ({
      isGenerating: deps.stateCtx.isGenerating,
      currentSession: deps.session.currentSession,
      generateId: deps.session.generateId,
      saveSession: deps.session.saveSession,
      setGeneratingAction: deps.stateCtx.setGeneratingAction,
      setDebugTrace: deps.stateCtx.setDebugTrace,
      setChatMessages: deps.stateCtx.setChatMessages,
      setValidation: deps.stateCtx.setValidation,
      showToast: deps.showToast,
      startOptimistic: deps.optimisticDeps.startOptimistic,
      completeOptimistic: deps.optimisticDeps.completeOptimistic,
      errorOptimistic: deps.optimisticDeps.errorOptimistic,
    }),
    [
      deps.stateCtx.isGenerating,
      deps.session.currentSession,
      deps.session.generateId,
      deps.session.saveSession,
      deps.stateCtx.setGeneratingAction,
      deps.stateCtx.setDebugTrace,
      deps.stateCtx.setChatMessages,
      deps.stateCtx.setValidation,
      deps.showToast,
      deps.optimisticDeps.startOptimistic,
      deps.optimisticDeps.completeOptimistic,
      deps.optimisticDeps.errorOptimistic,
    ]
  );

  const remixActions = useRemixActions(baseDeps);
  const quickVibesActions = useQuickVibesActions({
    ...baseDeps,
    setPendingInput: deps.editor.setPendingInput,
    getQuickVibesInput: deps.editor.getQuickVibesInput,
  });
  const creativeBoostActions = useCreativeBoostActions({
    ...baseDeps,
    setPendingInput: deps.editor.setPendingInput,
    creativeBoostInput: deps.editor.creativeBoostInput,
    maxMode: deps.settings.maxMode,
    lyricsMode: deps.settings.lyricsMode,
  });

  return useMemo(
    () => ({
      ...deps.stateCtx,
      ...deps.sessionOps,
      ...deps.stdGeneration,
      handleRemixInstruments: remixActions.handleRemixInstruments,
      handleRemixGenre: remixActions.handleRemixGenre,
      handleRemixMood: remixActions.handleRemixMood,
      handleRemixStyleTags: remixActions.handleRemixStyleTags,
      handleRemixRecording: remixActions.handleRemixRecording,
      handleRemixTitle: remixActions.handleRemixTitle,
      handleRemixLyrics: remixActions.handleRemixLyrics,
      handleGenerateQuickVibes: quickVibesActions.handleGenerateQuickVibes,
      handleRemixQuickVibes: quickVibesActions.handleRemixQuickVibes,
      handleRefineQuickVibes: quickVibesActions.handleRefineQuickVibes,
      handleGenerateCreativeBoost: creativeBoostActions.handleGenerateCreativeBoost,
      handleRefineCreativeBoost: creativeBoostActions.handleRefineCreativeBoost,
    }),
    [
      deps.stateCtx,
      deps.sessionOps,
      deps.stdGeneration,
      remixActions,
      quickVibesActions,
      creativeBoostActions,
    ]
  );
}
