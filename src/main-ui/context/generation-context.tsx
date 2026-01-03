import { createContext, useContext, useCallback, type ReactNode } from 'react';
import { api } from '@/services/rpc';
import { type PromptSession, type PromptVersion, type QuickVibesCategory, type DebugInfo } from '@shared/types';
import { EMPTY_VALIDATION, type ValidationResult } from '@shared/validation';
import { buildChatMessages, type ChatMessage } from '@/lib/chat-utils';
import { useSessionContext } from '@/context/session-context';
import { useEditorContext } from '@/context/editor-context';
import { createLogger } from '@/lib/logger';
import { useGenerationState, type GeneratingAction } from '@/hooks/use-generation-state';
import { useRemixActions } from '@/hooks/use-remix-actions';

const log = createLogger('Generation');

export type { GeneratingAction } from '@/hooks/use-generation-state';

interface GenerationContextType {
  isGenerating: boolean;
  generatingAction: GeneratingAction;
  chatMessages: ChatMessage[];
  validation: ValidationResult;
  debugInfo: DebugInfo | undefined;
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
  handleGenerateQuickVibes: (category: QuickVibesCategory | null, customDescription: string, withWordlessVocals: boolean) => Promise<void>;
  handleRemixQuickVibes: () => Promise<void>;
  handleConversionComplete: (originalInput: string, convertedPrompt: string, versionId: string, debugInfo?: DebugInfo) => Promise<void>;
}

const GenerationContext = createContext<GenerationContextType | null>(null);

export const useGenerationContext = () => {
  const context = useContext(GenerationContext);
  if (!context) throw new Error('useGenerationContext must be used within GenerationProvider');
  return context;
};

export const GenerationProvider = ({ children }: { children: ReactNode }) => {
  const { currentSession, setCurrentSession, saveSession, generateId } = useSessionContext();
  const { getEffectiveLockedPhrase, resetEditor, setPendingInput, lyricsTopic, setLyricsTopic, resetQuickVibesInput, promptMode, withWordlessVocals, quickVibesInput, advancedSelection } = useEditorContext();

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

  const selectSession = useCallback((session: PromptSession) => {
    setCurrentSession(session);
    setChatMessages(buildChatMessages(session));
    setValidation({ ...EMPTY_VALIDATION });
    setLyricsTopic(session.lyricsTopic || "");
  }, [setCurrentSession, setLyricsTopic]);

  const newProject = useCallback(() => {
    setCurrentSession(null);
    setChatMessages([]);
    setValidation({ ...EMPTY_VALIDATION });
    resetEditor();
  }, [setCurrentSession, resetEditor]);

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
    const now = new Date().toISOString();
    const newVersion: PromptVersion = {
      id: result.versionId,
      content: result.prompt,
      title: result.title,
      lyrics: result.lyrics,
      feedback: feedbackLabel,
      lockedPhrase,
      timestamp: now,
    };

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

    if (isNewSession) {
      setChatMessages(buildChatMessages(updatedSession));
    } else {
      setChatMessages(prev => [...prev, { role: "ai", content: successMessage }]);
    }

    setValidation(result.validation);
    await saveSession(updatedSession);
  }, [currentSession, generateId, saveSession]);

  const handleGenerate = useCallback(async (input: string) => {
    if (isGenerating) return;
    
    const currentPrompt = currentSession?.currentPrompt || "";
    const currentTitle = currentSession?.currentTitle;
    const currentLyrics = currentSession?.currentLyrics;
    const isInitial = !currentPrompt;
    const effectiveLockedPhrase = getEffectiveLockedPhrase();

    // Quick Vibes refinement: when in Quick Vibes mode with an existing prompt
    if (promptMode === 'quickVibes' && currentSession?.currentPrompt) {
      const session = currentSession;
      if (!session) return;
      try {
        setGeneratingAction('quickVibes');
        setChatMessages(prev => [...prev, { role: "user", content: input }]);

        const result = await api.refineQuickVibes(session.currentPrompt, input, withWordlessVocals, quickVibesInput.category);

        if (!result?.prompt) {
          throw new Error("Invalid result received from Quick Vibes refinement");
        }

        setDebugInfo(result.debugInfo);
        const now = new Date().toISOString();
        const newVersion: PromptVersion = {
          id: result.versionId,
          content: result.prompt,
          timestamp: now,
        };

        const updatedSession: PromptSession = {
          ...session,
          currentPrompt: result.prompt,
          versionHistory: [...session.versionHistory, newVersion],
          updatedAt: now,
        };

        setChatMessages(prev => [...prev, { role: "ai", content: "Quick Vibes prompt refined." }]);
        setValidation({ ...EMPTY_VALIDATION });
        await saveSession(updatedSession);
        setPendingInput("");
        resetQuickVibesInput();
      } catch (error) {
        log.error("refineQuickVibes:failed", error);
        setChatMessages(prev => [
          ...prev,
          { role: "ai", content: `Error: ${error instanceof Error ? error.message : "Failed to refine Quick Vibes"}.` },
        ]);
      } finally {
        setGeneratingAction('none');
      }
      return;
    }

    // Full prompt generation/refinement
    try {
      setGeneratingAction('generate');
      if (!isInitial) {
        setChatMessages(prev => [...prev, { role: "user", content: input }]);
      }

      const effectiveLyricsTopic = lyricsTopic?.trim() || undefined;
      const genreOverride = advancedSelection.singleGenre || advancedSelection.genreCombination || undefined;
      const result = isInitial
        ? await api.generateInitial(input, effectiveLockedPhrase, effectiveLyricsTopic, genreOverride)
        : await api.refinePrompt(currentPrompt, input, effectiveLockedPhrase, currentTitle, currentLyrics, effectiveLyricsTopic, genreOverride);

      if (!result?.prompt) {
        throw new Error("Invalid result received from generation");
      }

      await updateSessionWithResult(
        result,
        isInitial ? undefined : input,
        "Updated prompt generated.",
        isInitial,
        input,
        effectiveLockedPhrase,
        effectiveLyricsTopic
      );
      
      setPendingInput("");
      setLyricsTopic("");
    } catch (error) {
      log.error("generate:failed", error);
      setChatMessages(prev => [
        ...prev,
        { role: "ai", content: `Error: ${error instanceof Error ? error.message : "Failed to generate prompt"}.` },
      ]);
    } finally {
      setGeneratingAction('none');
    }
  }, [isGenerating, currentSession, getEffectiveLockedPhrase, updateSessionWithResult, setPendingInput, lyricsTopic, setLyricsTopic, promptMode, withWordlessVocals, saveSession, advancedSelection]);

  const handleCopy = useCallback(() => {
    const prompt = currentSession?.currentPrompt || "";
    navigator.clipboard.writeText(prompt);
  }, [currentSession?.currentPrompt]);

  const handleRemix = useCallback(async () => {
    if (isGenerating || !currentSession?.originalInput) return;
    const effectiveLockedPhrase = getEffectiveLockedPhrase();
    const genreOverride = advancedSelection.singleGenre || advancedSelection.genreCombination || undefined;

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
      log.error("remix:failed", error);
      setChatMessages(prev => [
        ...prev,
        { role: "ai", content: `Error: ${error instanceof Error ? error.message : "Failed to remix prompt"}.` },
      ]);
    } finally {
      setGeneratingAction('none');
    }
  }, [isGenerating, currentSession, getEffectiveLockedPhrase, updateSessionWithResult, advancedSelection]);

  const handleGenerateQuickVibes = useCallback(async (
    category: QuickVibesCategory | null,
    customDescription: string,
    withWordlessVocals: boolean
  ) => {
    if (isGenerating) return;

    try {
      setGeneratingAction('quickVibes');
      const result = await api.generateQuickVibes(category, customDescription, withWordlessVocals);

      if (!result?.prompt) {
        throw new Error("Invalid result received from Quick Vibes generation");
      }

      setDebugInfo(result.debugInfo);
      const now = new Date().toISOString();
      const originalInput = [
        category ? `[${category}]` : null,
        customDescription || null,
      ].filter(Boolean).join(' ') || 'Quick Vibes';

      const newVersion: PromptVersion = {
        id: result.versionId,
        content: result.prompt,
        timestamp: now,
      };

      const isNewSession = !currentSession;
      const updatedSession: PromptSession = isNewSession
        ? {
            id: generateId(),
            originalInput,
            currentPrompt: result.prompt,
            versionHistory: [newVersion],
            createdAt: now,
            updatedAt: now,
            promptMode: 'quickVibes',
            quickVibesInput: { category, customDescription, withWordlessVocals },
          }
        : {
            ...currentSession,
            currentPrompt: result.prompt,
            versionHistory: [...currentSession.versionHistory, newVersion],
            updatedAt: now,
            promptMode: 'quickVibes',
            quickVibesInput: { category, customDescription, withWordlessVocals },
          };

      if (isNewSession) {
        setChatMessages(buildChatMessages(updatedSession));
      } else {
        setChatMessages(prev => [...prev, { role: "ai", content: "Quick Vibes prompt generated." }]);
      }

      setValidation({ ...EMPTY_VALIDATION });
      await saveSession(updatedSession);
      resetQuickVibesInput();
    } catch (error) {
      log.error("generateQuickVibes:failed", error);
      setChatMessages(prev => [
        ...prev,
        { role: "ai", content: `Error: ${error instanceof Error ? error.message : "Failed to generate Quick Vibes"}.` },
      ]);
    } finally {
      setGeneratingAction('none');
    }
  }, [isGenerating, currentSession, generateId, saveSession, resetQuickVibesInput]);

  const handleRemixQuickVibes = useCallback(async () => {
    if (isGenerating) return;
    if (!currentSession?.quickVibesInput) return;

    const { category, customDescription, withWordlessVocals: storedWithWordlessVocals } = currentSession.quickVibesInput;
    await handleGenerateQuickVibes(category, customDescription, storedWithWordlessVocals ?? false);
  }, [isGenerating, currentSession, handleGenerateQuickVibes]);

  const handleConversionComplete = useCallback(async (
    originalInput: string,
    convertedPrompt: string,
    versionId: string,
    conversionDebugInfo?: DebugInfo
  ) => {
    setDebugInfo(conversionDebugInfo);
    const now = new Date().toISOString();

    const newVersion: PromptVersion = {
      id: versionId,
      content: convertedPrompt,
      feedback: '[auto-converted to max format]',
      timestamp: now,
    };

    // Create new session or update existing
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

    if (isNewSession) {
      setChatMessages(buildChatMessages(updatedSession));
    } else {
      setChatMessages(prev => [...prev, { role: "ai", content: "Converted to Max Mode format." }]);
    }

    setValidation({ ...EMPTY_VALIDATION });
    await saveSession(updatedSession);
  }, [currentSession, generateId, saveSession, setDebugInfo, setChatMessages, setValidation]);

  return (
    <GenerationContext.Provider value={{
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
      handleGenerateQuickVibes,
      handleRemixQuickVibes,
      handleConversionComplete,
    }}>
      {children}
    </GenerationContext.Provider>
  );
};
