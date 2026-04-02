import { createContext, useContext, type ReactNode } from 'react';

import { useToast } from '@/components/ui/toast';
import { useEditorActions, useEditorState } from '@/context/editor';
import { useSessionContext } from '@/context/session-context';
import { useSettingsContext } from '@/context/settings-context';
import { useGenerationContextValue } from './generation-context-value';
import { useGenerationActionDeps, useGenerationStateValue } from './generation-state-value';
import { useSessionOperationsValue, useStandardGenerationValue } from './generation-service-values';

import type { GenerationContextType, GenerationStateContextValue } from './types';

const GenerationContext = createContext<GenerationContextType | null>(null);

export const useGenerationContext = (): GenerationContextType => {
  const ctx = useContext(GenerationContext);
  if (!ctx) throw new Error('useGenerationContext must be used within GenerationProvider');
  return ctx;
};

function GenerationFacade({
  children,
  stateCtx,
}: {
  children: ReactNode;
  stateCtx: GenerationStateContextValue;
}): ReactNode {
  const { currentSession, generateId, saveSession, setCurrentSession } = useSessionContext();
  const { creativeBoostInput, advancedSelection, lyricsTopic, promptMode } = useEditorState();
  const {
    getQuickVibesInput,
    setPendingInput,
    getEffectiveLockedPhrase,
    setLyricsTopic,
    resetEditor,
    setPromptMode,
    setQuickVibesInput,
    resetQuickVibesInput,
    setCreativeBoostInput,
    resetCreativeBoostInput,
  } = useEditorActions();
  const { maxMode, lyricsMode } = useSettingsContext();
  const { showToast } = useToast();
  const sessionOps = useSessionOperationsValue({
    currentSession,
    generateId,
    resetCreativeBoostInput,
    resetEditor,
    resetQuickVibesInput,
    saveSession,
    setChatMessages: stateCtx.setChatMessages,
    setCreativeBoostInput,
    setCurrentSession,
    setDebugTrace: stateCtx.setDebugTrace,
    setLyricsTopic,
    setPromptMode,
    setQuickVibesInput,
    setValidation: stateCtx.setValidation,
  });

  const baseDeps = useGenerationActionDeps({
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
  });

  const standardGeneration = useStandardGenerationValue({
    advancedSelection,
    createConversionSession: sessionOps.createConversionSession,
    currentSession,
    generateId,
    getEffectiveLockedPhrase,
    isGenerating: stateCtx.isGenerating,
    lyricsTopic,
    maxMode,
    promptMode,
    saveSession,
    setChatMessages: stateCtx.setChatMessages,
    setDebugTrace: stateCtx.setDebugTrace,
    setGeneratingAction: stateCtx.setGeneratingAction,
    setLyricsTopic,
    setPendingInput,
    setValidation: stateCtx.setValidation,
    showToast,
  });

  const contextValue = useGenerationContextValue({
    stateCtx,
    sessionOps,
    standardGeneration,
    baseDeps,
    setPendingInput,
    getQuickVibesInput,
    creativeBoostInput,
    maxMode,
    lyricsMode,
  });

  return <GenerationContext.Provider value={contextValue}>{children}</GenerationContext.Provider>;
}

export function GenerationProvider({ children }: { children: ReactNode }): ReactNode {
  const stateCtx = useGenerationStateValue();
  return <GenerationFacade stateCtx={stateCtx}>{children}</GenerationFacade>;
}
