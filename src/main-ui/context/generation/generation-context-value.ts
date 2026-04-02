import { useMemo } from 'react';

import { useCreativeBoostActions } from '@/hooks/use-creative-boost-actions';
import { useQuickVibesActions } from '@/hooks/use-quick-vibes-actions';
import { useRemixActions } from '@/hooks/use-remix-actions';
import type { CreativeBoostInput, QuickVibesInput } from '@shared/types';

import type { GenerationActionDeps } from '@/hooks/use-generation-action';
import type {
  GenerationContextType,
  GenerationStateContextValue,
  SessionOperationsContextValue,
  StandardGenerationContextValue,
} from './types';

interface UseGenerationContextValueArgs {
  baseDeps: GenerationActionDeps;
  creativeBoostInput: CreativeBoostInput;
  getQuickVibesInput: () => QuickVibesInput;
  lyricsMode: boolean;
  maxMode: boolean;
  sessionOps: SessionOperationsContextValue;
  setPendingInput: (value: string) => void;
  standardGeneration: StandardGenerationContextValue;
  stateCtx: GenerationStateContextValue;
}

export function useGenerationContextValue({
  baseDeps,
  creativeBoostInput,
  getQuickVibesInput,
  lyricsMode,
  maxMode,
  sessionOps,
  setPendingInput,
  standardGeneration,
  stateCtx,
}: UseGenerationContextValueArgs): GenerationContextType {
  const remixActions = useRemixActions(baseDeps);
  const quickVibesActions = useQuickVibesActions({
    ...baseDeps,
    setPendingInput,
    getQuickVibesInput,
  });
  const creativeBoostActions = useCreativeBoostActions({
    ...baseDeps,
    setPendingInput,
    creativeBoostInput,
    maxMode,
    lyricsMode,
  });

  return useMemo(
    () => ({
      ...stateCtx,
      ...sessionOps,
      ...standardGeneration,
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
      stateCtx,
      sessionOps,
      standardGeneration,
      remixActions,
      quickVibesActions,
      creativeBoostActions,
    ]
  );
}
