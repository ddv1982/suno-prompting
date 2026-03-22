import { createContext, useContext, useCallback, useMemo, type ReactNode } from 'react';

import { useToast } from '@/components/ui/toast';
import { useEditorActions, useEditorState } from '@/context/editor-context';
import { useSessionContext } from '@/context/session-context';
import { useSettingsContext } from '@/context/settings-context';
import { createLogger } from '@/lib/logger';
import { createStandardGenerationService } from '@/services/standard-generation-service';

import { useGenerationStateContext } from './generation-state-context';
import { useSessionOperationsContext } from './session-operations-context';

import type { StandardGenerationContextValue } from './types';
import type { TraceRun } from '@shared/types';

const log = createLogger('StandardGeneration');
const StandardGenerationContext = createContext<StandardGenerationContextValue | null>(null);

export function useStandardGenerationContext(): StandardGenerationContextValue {
  const ctx = useContext(StandardGenerationContext);
  if (!ctx)
    throw new Error('useStandardGenerationContext must be used within StandardGenerationProvider');
  return ctx;
}

export function StandardGenerationProvider({ children }: { children: ReactNode }): ReactNode {
  const { currentSession, saveSession, generateId } = useSessionContext();
  const { advancedSelection, lyricsTopic, promptMode } = useEditorState();
  const { getEffectiveLockedPhrase, setPendingInput, setLyricsTopic } = useEditorActions();
  const { maxMode } = useSettingsContext();
  const { showToast } = useToast();
  const { isGenerating, setGeneratingAction, setChatMessages, setValidation, setDebugTrace } =
    useGenerationStateContext();
  const { createConversionSession } = useSessionOperationsContext();

  const deps = useMemo(
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

  const service = useMemo(
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
        deps,
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
      deps,
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

  return (
    <StandardGenerationContext.Provider
      value={{
        handleGenerate: service.handleGenerate,
        handleRemix: service.handleRemix,
        handleConversionComplete,
      }}
    >
      {children}
    </StandardGenerationContext.Provider>
  );
}
