import { createContext, useContext, useCallback, useMemo, type ReactNode } from 'react';

import { useToast } from '@/components/ui/toast';
import { useEditorContext } from '@/context/editor-context';
import { useSessionContext } from '@/context/session-context';
import { useSettingsContext } from '@/context/settings-context';
import { useCreativeBoostActions } from '@/hooks/use-creative-boost-actions';
import { useGenerationState, type GeneratingAction } from '@/hooks/use-generation-state';
import { useQuickVibesActions } from '@/hooks/use-quick-vibes-actions';
import { useRemixActions } from '@/hooks/use-remix-actions';
import { buildChatMessages, type ChatMessage } from '@/lib/chat-utils';
import { createLogger } from '@/lib/logger';
import { isMaxFormat, isStructuredPrompt } from '@/lib/max-format';
import {
  createVersion,
  updateChatMessagesAfterGeneration,
  handleGenerationError,
  addUserMessage,
} from '@/lib/session-helpers';
import { api } from '@/services/rpc';
import { type PromptSession, type PromptVersion, type QuickVibesCategory, type DebugInfo } from '@shared/types';
import { nowISO } from '@shared/utils';
import { EMPTY_VALIDATION, type ValidationResult } from '@shared/validation';

const log = createLogger('Generation');

// ============================================================================
// Helper: Max Mode Conversion
// ============================================================================

interface MaxModeConversionDeps {
  input: string;
  createConversionSession: (
    originalInput: string,
    convertedPrompt: string,
    versionId: string,
    debugInfo?: Partial<DebugInfo>
  ) => Promise<void>;
  setPendingInput: (v: string) => void;
  setLyricsTopic: (v: string) => void;
  showToast: (message: string, type: 'success' | 'error') => void;
}

/** Try Max Mode conversion, returns true if conversion was handled */
async function tryMaxModeConversion(deps: MaxModeConversionDeps): Promise<boolean> {
  const { input, createConversionSession, setPendingInput, setLyricsTopic, showToast } = deps;

  try {
    const result = await api.convertToMaxFormat(input);

    if (result?.convertedPrompt && result.wasConverted) {
      await createConversionSession(input, result.convertedPrompt, result.versionId, result.debugInfo);
      setPendingInput("");
      setLyricsTopic("");
      showToast('Converted to Max Mode format', 'success');
      return true;
    }
    return false;
  } catch (error) {
    if (error instanceof Error && (error.name === 'AbortError' || error.message.includes('aborted'))) {
      log.info('Conversion cancelled, falling through to normal generation');
    } else {
      log.error('Max Mode conversion failed:', error);
      showToast('Conversion failed, using normal generation', 'error');
    }
    return false;
  }
}

/** Check if Max Mode conversion should be attempted */
function shouldAttemptMaxConversion(isInitial: boolean, maxMode: boolean, input: string): boolean {
  return isInitial && maxMode && isStructuredPrompt(input) && !isMaxFormat(input);
}

export type { GeneratingAction } from '@/hooks/use-generation-state';

export interface GenerationContextType {
  isGenerating: boolean;
  generatingAction: GeneratingAction;
  chatMessages: ChatMessage[];
  validation: ValidationResult;
  debugInfo: Partial<DebugInfo> | undefined;
  setValidation: (v: ValidationResult) => void;
  selectSession: (session: PromptSession) => void;
  newProject: () => void;
  handleGenerate: (input: string) => Promise<void>;
  handleCopy: () => void;
  handleRemix: () => Promise<void>;
  handleRemixInstruments: () => Promise<void>;
  handleRemixGenre: () => Promise<void>;
  handleRemixMood: () => Promise<void>;
  handleRemixStyleTags: () => Promise<void>;
  handleRemixRecording: () => Promise<void>;
  handleRemixTitle: () => Promise<void>;
  handleRemixLyrics: () => Promise<void>;
  handleGenerateQuickVibes: (category: QuickVibesCategory | null, customDescription: string, withWordlessVocals: boolean, sunoStyles: string[]) => Promise<void>;
  handleRemixQuickVibes: () => Promise<void>;
  handleConversionComplete: (originalInput: string, convertedPrompt: string, versionId: string, debugInfo?: Partial<DebugInfo>) => Promise<void>;
  handleGenerateCreativeBoost: () => Promise<void>;
  handleRefineCreativeBoost: (feedback: string) => Promise<void>;
}

const GenerationContext = createContext<GenerationContextType | null>(null);

export const useGenerationContext = (): GenerationContextType => {
  const context = useContext(GenerationContext);
  if (!context) throw new Error('useGenerationContext must be used within GenerationProvider');
  return context;
};

export const GenerationProvider = ({ children }: { children: ReactNode }): ReactNode => {
  const { currentSession, setCurrentSession, saveSession, generateId } = useSessionContext();
  const { getEffectiveLockedPhrase, resetEditor, setPendingInput, lyricsTopic, setLyricsTopic, resetQuickVibesInput, setQuickVibesInput, getQuickVibesInput, setWithWordlessVocals, promptMode, setPromptMode, withWordlessVocals, advancedSelection, creativeBoostInput, setCreativeBoostInput } = useEditorContext();
  const { maxMode, lyricsMode } = useSettingsContext();
  const { showToast } = useToast();

  const {
    generatingAction,
    isGenerating,
    chatMessages,
    validation,
    debugInfo,
    setGeneratingAction,
    setChatMessages,
    setValidation,
    setDebugInfo,
  } = useGenerationState();

  const remixActions = useRemixActions({
    isGenerating,
    currentSession,
    generateId,
    saveSession,
    setGeneratingAction,
    setDebugInfo,
    setChatMessages,
    setValidation,
  });

  const quickVibesActions = useQuickVibesActions({
    isGenerating,
    currentSession,
    generateId,
    saveSession,
    setGeneratingAction,
    setDebugInfo,
    setChatMessages,
    setValidation,
    setPendingInput,
    withWordlessVocals,
    getQuickVibesInput,
  });

  const creativeBoostActions = useCreativeBoostActions({
    isGenerating,
    currentSession,
    generateId,
    saveSession,
    setGeneratingAction,
    setDebugInfo,
    setChatMessages,
    setValidation,
    setPendingInput,
    showToast,
    creativeBoostInput,
    maxMode,
    lyricsMode,
  });

  const selectSession = useCallback((session: PromptSession) => {
    setCurrentSession(session);
    setChatMessages(buildChatMessages(session));
    setValidation({ ...EMPTY_VALIDATION });
    setLyricsTopic(session.lyricsTopic || "");

    // Restore the session's prompt mode (default to 'full' for legacy sessions)
    setPromptMode(session.promptMode ?? 'full');

    // Restore mode-specific inputs
    if (session.promptMode === 'quickVibes' && session.quickVibesInput) {
      setQuickVibesInput(session.quickVibesInput);
      setWithWordlessVocals(session.quickVibesInput.withWordlessVocals ?? false);
    } else if (session.promptMode === 'creativeBoost' && session.creativeBoostInput) {
      setCreativeBoostInput(session.creativeBoostInput);
    } else {
      resetQuickVibesInput();
      setWithWordlessVocals(false);
    }
  }, [resetQuickVibesInput, setChatMessages, setCreativeBoostInput, setCurrentSession, setLyricsTopic, setPromptMode, setQuickVibesInput, setValidation, setWithWordlessVocals]);

  const newProject = useCallback(() => {
    setCurrentSession(null);
    setChatMessages([]);
    setValidation({ ...EMPTY_VALIDATION });
    resetEditor();
  }, [setCurrentSession, setChatMessages, setValidation, resetEditor]);

  const updateSessionWithResult = useCallback(async (
    result: { prompt: string; title?: string; lyrics?: string; versionId: string; validation: ValidationResult; debugInfo?: DebugInfo },
    feedbackLabel: string | undefined,
    successMessage: string,
    isNewSession: boolean,
    originalInput: string,
    lockedPhrase?: string,
    sessionLyricsTopic?: string
  ) => {
    setDebugInfo(result.debugInfo);
    const now = nowISO();
    
    const baseVersion = createVersion(result, feedbackLabel);
    const newVersion: PromptVersion = lockedPhrase 
      ? { ...baseVersion, lockedPhrase } 
      : baseVersion;

    const updatedSession: PromptSession = isNewSession || !currentSession
      ? {
          id: generateId(),
          originalInput,
          lyricsTopic: sessionLyricsTopic,
          currentPrompt: result.prompt,
          currentTitle: result.title,
          currentLyrics: result.lyrics,
          versionHistory: [newVersion],
          createdAt: now,
          updatedAt: now,
        }
      : {
          ...currentSession,
          currentPrompt: result.prompt,
          currentTitle: result.title,
          currentLyrics: result.lyrics,
          versionHistory: [...currentSession.versionHistory, newVersion],
          updatedAt: now,
        };

    updateChatMessagesAfterGeneration(setChatMessages, updatedSession, isNewSession, successMessage);
    setValidation(result.validation);
    await saveSession(updatedSession);
  }, [currentSession, generateId, saveSession, setChatMessages, setDebugInfo, setValidation]);

  /**
   * Helper to create or update session after Max Mode conversion.
   * Used by both paste handler and Generate button conversion.
   */
  const createConversionSession = useCallback(async (
    originalInput: string,
    convertedPrompt: string,
    versionId: string,
    conversionDebugInfo?: Partial<DebugInfo>,
    feedback?: string
  ): Promise<void> => {
    setDebugInfo(conversionDebugInfo);
    const now = nowISO();

    const newVersion = createVersion(
      { prompt: convertedPrompt, versionId },
      feedback || '[auto-converted to max format]'
    );

    const isNewSession = !currentSession;
    const updatedSession: PromptSession = isNewSession
      ? {
          id: generateId(),
          originalInput,
          currentPrompt: convertedPrompt,
          versionHistory: [newVersion],
          createdAt: now,
          updatedAt: now,
        }
      : {
          ...currentSession,
          currentPrompt: convertedPrompt,
          versionHistory: [...currentSession.versionHistory, newVersion],
          updatedAt: now,
        };

    updateChatMessagesAfterGeneration(setChatMessages, updatedSession, isNewSession, "Converted to Max Mode format.");
    setValidation({ ...EMPTY_VALIDATION });
    await saveSession(updatedSession);
  }, [currentSession, generateId, saveSession, setDebugInfo, setChatMessages, setValidation]);

  const handleGenerate = useCallback(async (input: string) => {
    if (isGenerating) return;

    // Quick Vibes refinement: when in Quick Vibes mode with an existing prompt
    if (promptMode === 'quickVibes' && currentSession?.currentPrompt) {
      await quickVibesActions.handleRefineQuickVibes(input);
      return;
    }

    const currentPrompt = currentSession?.currentPrompt || "";
    const isInitial = !currentPrompt;

    try {
      setGeneratingAction('generate');
      if (!isInitial) {
        addUserMessage(setChatMessages, input);
      }

      // Max Mode conversion for structured prompts
      if (shouldAttemptMaxConversion(isInitial, maxMode, input)) {
        log.info('Converting structured prompt to Max Mode format');
        const wasConverted = await tryMaxModeConversion({
          input, createConversionSession, setPendingInput, setLyricsTopic, showToast,
        });
        if (wasConverted) return;
      }

      // Standard generation
      const effectiveLockedPhrase = getEffectiveLockedPhrase();
      const effectiveLyricsTopic = lyricsTopic?.trim() || undefined;
      const genreOverride = advancedSelection.seedGenres[0] || undefined;

      const result = isInitial
        ? await api.generateInitial(input, effectiveLockedPhrase, effectiveLyricsTopic, genreOverride)
        : await api.refinePrompt(currentPrompt, input, effectiveLockedPhrase, currentSession?.currentTitle, currentSession?.currentLyrics, effectiveLyricsTopic, genreOverride);

      if (!result?.prompt) {
        throw new Error("Invalid result received from generation");
      }

      await updateSessionWithResult(result, isInitial ? undefined : input, "Updated prompt generated.", isInitial, input, effectiveLockedPhrase, effectiveLyricsTopic);
      setPendingInput("");
      setLyricsTopic("");
    } catch (error) {
      handleGenerationError(error, "generate prompt", setChatMessages, log);
    } finally {
      setGeneratingAction('none');
    }
  }, [isGenerating, currentSession, getEffectiveLockedPhrase, updateSessionWithResult, setPendingInput, lyricsTopic, setLyricsTopic, promptMode, advancedSelection, maxMode, createConversionSession, showToast, quickVibesActions, setChatMessages, setGeneratingAction]);

  const handleCopy = useCallback((): void => {
    const prompt = currentSession?.currentPrompt || "";
    void navigator.clipboard.writeText(prompt);
  }, [currentSession?.currentPrompt]);

  const handleRemix = useCallback(async () => {
    if (isGenerating || !currentSession?.originalInput) return;
    const effectiveLockedPhrase = getEffectiveLockedPhrase();
    const genreOverride = advancedSelection.seedGenres[0] || undefined;

    try {
      setGeneratingAction('remix');
      const result = await api.generateInitial(currentSession.originalInput, effectiveLockedPhrase, currentSession.lyricsTopic, genreOverride);

      if (!result?.prompt) {
        throw new Error("Invalid result received from remix");
      }

      await updateSessionWithResult(
        result,
        "[remix]",
        "Remixed prompt generated.",
        false,
        currentSession.originalInput,
        effectiveLockedPhrase,
        currentSession.lyricsTopic
      );
    } catch (error) {
      handleGenerationError(error, "remix prompt", setChatMessages, log);
    } finally {
      setGeneratingAction('none');
    }
  }, [isGenerating, currentSession, getEffectiveLockedPhrase, updateSessionWithResult, advancedSelection, setChatMessages, setGeneratingAction]);

  const handleConversionComplete = useCallback(async (
    originalInput: string,
    convertedPrompt: string,
    versionId: string,
    conversionDebugInfo?: Partial<DebugInfo>
  ) => {
    await createConversionSession(originalInput, convertedPrompt, versionId, conversionDebugInfo);
  }, [createConversionSession]);

  // Memoize the context value to prevent unnecessary re-renders of consumers
  const contextValue = useMemo<GenerationContextType>(() => ({
    isGenerating,
    generatingAction,
    chatMessages,
    validation,
    debugInfo,
    setValidation,
    selectSession,
    newProject,
    handleGenerate,
    handleCopy,
    handleRemix,
    handleRemixInstruments: remixActions.handleRemixInstruments,
    handleRemixGenre: remixActions.handleRemixGenre,
    handleRemixMood: remixActions.handleRemixMood,
    handleRemixStyleTags: remixActions.handleRemixStyleTags,
    handleRemixRecording: remixActions.handleRemixRecording,
    handleRemixTitle: remixActions.handleRemixTitle,
    handleRemixLyrics: remixActions.handleRemixLyrics,
    handleGenerateQuickVibes: quickVibesActions.handleGenerateQuickVibes,
    handleRemixQuickVibes: quickVibesActions.handleRemixQuickVibes,
    handleConversionComplete,
    handleGenerateCreativeBoost: creativeBoostActions.handleGenerateCreativeBoost,
    handleRefineCreativeBoost: creativeBoostActions.handleRefineCreativeBoost,
  }), [
    isGenerating,
    generatingAction,
    chatMessages,
    validation,
    debugInfo,
    setValidation,
    selectSession,
    newProject,
    handleGenerate,
    handleCopy,
    handleRemix,
    remixActions.handleRemixInstruments,
    remixActions.handleRemixGenre,
    remixActions.handleRemixMood,
    remixActions.handleRemixStyleTags,
    remixActions.handleRemixRecording,
    remixActions.handleRemixTitle,
    remixActions.handleRemixLyrics,
    quickVibesActions.handleGenerateQuickVibes,
    quickVibesActions.handleRemixQuickVibes,
    handleConversionComplete,
    creativeBoostActions.handleGenerateCreativeBoost,
    creativeBoostActions.handleRefineCreativeBoost,
  ]);

  return (
    <GenerationContext.Provider value={contextValue}>
      {children}
    </GenerationContext.Provider>
  );
};
