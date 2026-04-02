import { useCallback, useMemo } from 'react';

import { useEditorActions, useEditorState } from '@/context/editor';
import { useSessionContext } from '@/context/session-context';
import { useSettingsContext } from '@/context/settings-context';
import { createSessionOperationsService } from '@/services/session-operations-service';
import { createStandardGenerationService } from '@/services/standard-generation-service';
import { createLogger } from '@shared/logger';
import type { TraceRun } from '@shared/types';

import type {
  GenerationStateContextValue,
  SessionOperationsContextValue,
  StandardGenerationContextValue,
} from './types';

const log = createLogger('StandardGeneration');

interface UseStandardGenerationValueArgs {
  advancedSelection: ReturnType<typeof useEditorState>['advancedSelection'];
  createConversionSession: SessionOperationsContextValue['createConversionSession'];
  currentSession: ReturnType<typeof useSessionContext>['currentSession'];
  generateId: ReturnType<typeof useSessionContext>['generateId'];
  getEffectiveLockedPhrase: ReturnType<typeof useEditorActions>['getEffectiveLockedPhrase'];
  isGenerating: GenerationStateContextValue['isGenerating'];
  lyricsTopic: ReturnType<typeof useEditorState>['lyricsTopic'];
  maxMode: ReturnType<typeof useSettingsContext>['maxMode'];
  promptMode: ReturnType<typeof useEditorState>['promptMode'];
  saveSession: ReturnType<typeof useSessionContext>['saveSession'];
  setChatMessages: GenerationStateContextValue['setChatMessages'];
  setDebugTrace: GenerationStateContextValue['setDebugTrace'];
  setGeneratingAction: GenerationStateContextValue['setGeneratingAction'];
  setLyricsTopic: ReturnType<typeof useEditorActions>['setLyricsTopic'];
  setPendingInput: ReturnType<typeof useEditorActions>['setPendingInput'];
  setValidation: GenerationStateContextValue['setValidation'];
  showToast: (message: string, type?: 'error' | 'info' | 'success' | 'warning') => void;
}

export function useStandardGenerationValue({
  advancedSelection,
  createConversionSession,
  currentSession,
  generateId,
  getEffectiveLockedPhrase,
  isGenerating,
  lyricsTopic,
  maxMode,
  promptMode,
  saveSession,
  setChatMessages,
  setDebugTrace,
  setGeneratingAction,
  setLyricsTopic,
  setPendingInput,
  setValidation,
  showToast,
}: UseStandardGenerationValueArgs): StandardGenerationContextValue {
  const standardGenerationDeps = useMemo(
    () => ({
      currentSession,
      generateId,
      saveSession,
      setDebugTrace,
      setChatMessages,
      setValidation,
      setGeneratingAction,
      showToast,
      log,
    }),
    [
      currentSession,
      generateId,
      saveSession,
      setDebugTrace,
      setChatMessages,
      setValidation,
      setGeneratingAction,
      showToast,
    ]
  );

  const standardGeneration = useMemo(
    () =>
      createStandardGenerationService({
        currentSession,
        promptMode,
        isGenerating,
        maxMode,
        lyricsTopic,
        advancedSelection,
        getEffectiveLockedPhrase,
        setPendingInput,
        setLyricsTopic,
        setGeneratingAction,
        setChatMessages,
        showToast,
        createConversionSession,
        deps: standardGenerationDeps,
        log,
      }),
    [
      currentSession,
      promptMode,
      isGenerating,
      maxMode,
      lyricsTopic,
      advancedSelection,
      getEffectiveLockedPhrase,
      setPendingInput,
      setLyricsTopic,
      setGeneratingAction,
      setChatMessages,
      showToast,
      createConversionSession,
      standardGenerationDeps,
    ]
  );

  const handleConversionComplete = useCallback(
    async (
      originalInput: string,
      convertedPrompt: string,
      versionId: string,
      debugTrace?: TraceRun
    ) => {
      await createConversionSession(originalInput, convertedPrompt, versionId, debugTrace);
    },
    [createConversionSession]
  );

  return useMemo(
    () => ({
      handleGenerate: standardGeneration.handleGenerate,
      handleRemix: standardGeneration.handleRemix,
      handleConversionComplete,
    }),
    [standardGeneration, handleConversionComplete]
  );
}

interface UseSessionOperationsValueArgs {
  currentSession: ReturnType<typeof useSessionContext>['currentSession'];
  generateId: ReturnType<typeof useSessionContext>['generateId'];
  resetCreativeBoostInput: ReturnType<typeof useEditorActions>['resetCreativeBoostInput'];
  resetEditor: ReturnType<typeof useEditorActions>['resetEditor'];
  resetQuickVibesInput: ReturnType<typeof useEditorActions>['resetQuickVibesInput'];
  saveSession: ReturnType<typeof useSessionContext>['saveSession'];
  setChatMessages: GenerationStateContextValue['setChatMessages'];
  setCreativeBoostInput: ReturnType<typeof useEditorActions>['setCreativeBoostInput'];
  setCurrentSession: ReturnType<typeof useSessionContext>['setCurrentSession'];
  setDebugTrace: GenerationStateContextValue['setDebugTrace'];
  setLyricsTopic: ReturnType<typeof useEditorActions>['setLyricsTopic'];
  setPromptMode: ReturnType<typeof useEditorActions>['setPromptMode'];
  setQuickVibesInput: ReturnType<typeof useEditorActions>['setQuickVibesInput'];
  setValidation: GenerationStateContextValue['setValidation'];
}

export function useSessionOperationsValue({
  currentSession,
  generateId,
  resetCreativeBoostInput,
  resetEditor,
  resetQuickVibesInput,
  saveSession,
  setChatMessages,
  setCreativeBoostInput,
  setCurrentSession,
  setDebugTrace,
  setLyricsTopic,
  setPromptMode,
  setQuickVibesInput,
  setValidation,
}: UseSessionOperationsValueArgs): SessionOperationsContextValue {
  return useMemo(
    () =>
      createSessionOperationsService({
        currentSession,
        setCurrentSession,
        saveSession,
        generateId,
        resetEditor,
        setLyricsTopic,
        setPromptMode,
        setQuickVibesInput,
        resetQuickVibesInput,
        setCreativeBoostInput,
        resetCreativeBoostInput,
        setChatMessages,
        setValidation,
        setDebugTrace,
      }),
    [
      currentSession,
      setCurrentSession,
      saveSession,
      generateId,
      resetEditor,
      setLyricsTopic,
      setPromptMode,
      setQuickVibesInput,
      resetQuickVibesInput,
      setCreativeBoostInput,
      resetCreativeBoostInput,
      setChatMessages,
      setValidation,
      setDebugTrace,
    ]
  );
}
