import { createContext, useContext, useMemo, type ReactNode } from 'react';

import { useToast } from '@/components/ui/toast';
import { useEditorContext } from '@/context/editor-context';
import { useSessionContext } from '@/context/session-context';
import { useSettingsContext } from '@/context/settings-context';
import { useCreativeBoostActions } from '@/hooks/use-creative-boost-actions';
import { useQuickVibesActions } from '@/hooks/use-quick-vibes-actions';
import { useRemixActions } from '@/hooks/use-remix-actions';

import { GenerationStateProvider, useGenerationStateContext } from './generation-state-context';
import { SessionOperationsProvider, useSessionOperationsContext } from './session-operations-context';
import { StandardGenerationProvider, useStandardGenerationContext } from './standard-generation-context';

import type { GenerationContextType } from './types';

const GenerationContext = createContext<GenerationContextType | null>(null);

export const useGenerationContext = (): GenerationContextType => {
  const ctx = useContext(GenerationContext);
  if (!ctx) throw new Error('useGenerationContext must be used within GenerationProvider');
  return ctx;
};

function GenerationFacade({ children }: { children: ReactNode }): ReactNode {
  const { currentSession, generateId, saveSession } = useSessionContext();
  const { withWordlessVocals, getQuickVibesInput, setPendingInput, creativeBoostInput } = useEditorContext();
  const { maxMode, lyricsMode } = useSettingsContext();
  const { showToast } = useToast();

  const stateCtx = useGenerationStateContext();
  const sessionOps = useSessionOperationsContext();
  const stdGeneration = useStandardGenerationContext();

  const baseDeps = useMemo(() => ({
    isGenerating: stateCtx.isGenerating,
    currentSession,
    generateId,
    saveSession,
    setGeneratingAction: stateCtx.setGeneratingAction,
    setDebugTrace: stateCtx.setDebugTrace,
    setChatMessages: stateCtx.setChatMessages,
    setValidation: stateCtx.setValidation,
    showToast,
    startOptimistic: stateCtx.startOptimistic,
    completeOptimistic: stateCtx.completeOptimistic,
    errorOptimistic: stateCtx.errorOptimistic,
  }), [
    stateCtx.isGenerating,
    currentSession,
    generateId,
    saveSession,
    stateCtx.setGeneratingAction,
    stateCtx.setDebugTrace,
    stateCtx.setChatMessages,
    stateCtx.setValidation,
    showToast,
    stateCtx.startOptimistic,
    stateCtx.completeOptimistic,
    stateCtx.errorOptimistic,
  ]);

  const remixActions = useRemixActions(baseDeps);
  const quickVibesActions = useQuickVibesActions({
    ...baseDeps,
    setPendingInput,
    withWordlessVocals,
    getQuickVibesInput,
  });
  const creativeBoostActions = useCreativeBoostActions({
    ...baseDeps,
    setPendingInput,
    creativeBoostInput,
    maxMode,
    lyricsMode,
  });

  const contextValue = useMemo<GenerationContextType>(() => ({
    ...stateCtx, ...sessionOps, ...stdGeneration,
    handleRemixInstruments: remixActions.handleRemixInstruments, handleRemixGenre: remixActions.handleRemixGenre,
    handleRemixMood: remixActions.handleRemixMood, handleRemixStyleTags: remixActions.handleRemixStyleTags,
    handleRemixRecording: remixActions.handleRemixRecording, handleRemixTitle: remixActions.handleRemixTitle,
    handleRemixLyrics: remixActions.handleRemixLyrics, handleGenerateQuickVibes: quickVibesActions.handleGenerateQuickVibes,
    handleRemixQuickVibes: quickVibesActions.handleRemixQuickVibes, handleRefineQuickVibes: quickVibesActions.handleRefineQuickVibes,
    handleGenerateCreativeBoost: creativeBoostActions.handleGenerateCreativeBoost,
    handleRefineCreativeBoost: creativeBoostActions.handleRefineCreativeBoost,
  }), [stateCtx, sessionOps, stdGeneration, remixActions, quickVibesActions, creativeBoostActions]);

  return <GenerationContext.Provider value={contextValue}>{children}</GenerationContext.Provider>;
}

export function GenerationProvider({ children }: { children: ReactNode }): ReactNode {
  return (
    <GenerationStateProvider>
      <SessionOperationsProvider>
        <StandardGenerationProvider>
          <GenerationFacade>{children}</GenerationFacade>
        </StandardGenerationProvider>
      </SessionOperationsProvider>
    </GenerationStateProvider>
  );
}
