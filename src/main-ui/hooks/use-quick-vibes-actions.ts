import { useCallback } from 'react';
import { api } from '@/services/rpc';
import { type PromptSession, type DebugInfo, type QuickVibesInput, type QuickVibesCategory } from '@shared/types';
import { type ValidationResult } from '@shared/validation';
import { type ChatMessage } from '@/lib/chat-utils';
import { createLogger } from '@/lib/logger';
import type { GeneratingAction } from '@/hooks/use-generation-state';
import {
  completeSessionUpdate,
  handleGenerationError,
  addUserMessage,
  type SessionDeps,
} from '@/lib/session-helpers';

const log = createLogger('QuickVibes');

type QuickVibesActionsConfig = {
  isGenerating: boolean;
  currentSession: PromptSession | null;
  generateId: () => string;
  saveSession: (session: PromptSession) => Promise<void>;
  setGeneratingAction: (action: GeneratingAction) => void;
  setDebugInfo: (info: Partial<DebugInfo> | undefined) => void;
  setChatMessages: React.Dispatch<React.SetStateAction<ChatMessage[]>>;
  setValidation: (v: ValidationResult) => void;
  setPendingInput: (input: string) => void;
  withWordlessVocals: boolean;
  getQuickVibesInput: () => QuickVibesInput;
};

export function useQuickVibesActions(config: QuickVibesActionsConfig) {
  const {
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
  } = config;

  const sessionDeps: SessionDeps = {
    currentSession,
    generateId,
    saveSession,
    setDebugInfo,
    setChatMessages,
    setValidation,
    setGeneratingAction,
    log,
  };

  const handleGenerateQuickVibes = useCallback(async (
    category: QuickVibesCategory | null,
    customDescription: string,
    wordlessVocals: boolean,
    sunoStyles: string[] = []
  ) => {
    if (isGenerating) return;

    try {
      setGeneratingAction('quickVibes');
      const result = await api.generateQuickVibes(category, customDescription, wordlessVocals, sunoStyles);

      if (!result?.prompt) {
        throw new Error("Invalid result received from Quick Vibes generation");
      }

      const originalInput = sunoStyles.length > 0
        ? `[Suno V5] ${sunoStyles.join(', ')}`
        : [category ? `[${category}]` : null, customDescription || null]
            .filter(Boolean).join(' ') || 'Quick Vibes';

      await completeSessionUpdate(
        sessionDeps,
        result,
        originalInput,
        'quickVibes',
        { quickVibesInput: { category, customDescription, withWordlessVocals: wordlessVocals, sunoStyles } },
        "Quick Vibes prompt generated."
      );
    } catch (error) {
      handleGenerationError(error, "generate Quick Vibes", setChatMessages, log);
    } finally {
      setGeneratingAction('none');
    }
  }, [isGenerating, currentSession, generateId, saveSession, setGeneratingAction, setDebugInfo, setChatMessages, setValidation]);

  const handleRemixQuickVibes = useCallback(async () => {
    if (isGenerating) return;
    if (!currentSession?.quickVibesInput) return;

    const { category, customDescription, withWordlessVocals: storedWithWordlessVocals, sunoStyles: storedSunoStyles } = currentSession.quickVibesInput;
    await handleGenerateQuickVibes(category, customDescription, storedWithWordlessVocals ?? false, storedSunoStyles ?? []);
  }, [isGenerating, currentSession, handleGenerateQuickVibes]);

  const handleRefineQuickVibes = useCallback(async (input: string) => {
    if (isGenerating) return;
    if (!currentSession?.currentPrompt) return;

    const quickVibesInput = getQuickVibesInput();
    const storedInput = currentSession.quickVibesInput;
    
    // Calculate effective values (UI state if changed, otherwise stored session)
    const effectiveSunoStyles = quickVibesInput.sunoStyles.length > 0
      ? quickVibesInput.sunoStyles
      : storedInput?.sunoStyles ?? [];
    const effectiveDescription = quickVibesInput.customDescription || storedInput?.customDescription || '';

    try {
      setGeneratingAction('quickVibes');
      addUserMessage(setChatMessages, input);

      const result = await api.refineQuickVibes({
        currentPrompt: currentSession.currentPrompt,
        currentTitle: currentSession.currentTitle,
        description: effectiveDescription,
        feedback: input,
        withWordlessVocals,
        category: storedInput?.category ?? null,
        sunoStyles: effectiveSunoStyles,
      });

      if (!result?.prompt) {
        throw new Error("Invalid result received from Quick Vibes refinement");
      }

      const quickVibesInputUpdate = {
        category: storedInput?.category ?? null,
        customDescription: effectiveDescription,
        withWordlessVocals: storedInput?.withWordlessVocals ?? false,
        sunoStyles: effectiveSunoStyles,
      };

      await completeSessionUpdate(
        sessionDeps,
        result,
        currentSession.originalInput,
        'quickVibes',
        { quickVibesInput: quickVibesInputUpdate },
        "Quick Vibes prompt refined."
      );
      setPendingInput("");
    } catch (error) {
      handleGenerationError(error, "refine Quick Vibes", setChatMessages, log);
    } finally {
      setGeneratingAction('none');
    }
  }, [getQuickVibesInput, isGenerating, currentSession, withWordlessVocals, saveSession, setPendingInput, setGeneratingAction, setDebugInfo, setChatMessages, setValidation]);

  return {
    handleGenerateQuickVibes,
    handleRemixQuickVibes,
    handleRefineQuickVibes,
  };
}
