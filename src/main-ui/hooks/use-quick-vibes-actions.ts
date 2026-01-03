import { useCallback } from 'react';
import { api } from '@/services/rpc';
import { type PromptSession, type PromptVersion, type QuickVibesCategory, type DebugInfo } from '@shared/types';
import { EMPTY_VALIDATION, type ValidationResult } from '@shared/validation';
import { buildChatMessages, type ChatMessage } from '@/lib/chat-utils';
import { createLogger } from '@/lib/logger';
import type { GeneratingAction } from '@/hooks/use-generation-state';

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
  resetQuickVibesInput: () => void;
  setPendingInput: (input: string) => void;
  withWordlessVocals: boolean;
  quickVibesInput: { category: QuickVibesCategory | null; customDescription: string; withWordlessVocals: boolean };
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
    resetQuickVibesInput,
    setPendingInput,
    withWordlessVocals,
    quickVibesInput,
  } = config;

  const handleGenerateQuickVibes = useCallback(async (
    category: QuickVibesCategory | null,
    customDescription: string,
    wordlessVocals: boolean
  ) => {
    if (isGenerating) return;

    try {
      setGeneratingAction('quickVibes');
      const result = await api.generateQuickVibes(category, customDescription, wordlessVocals);

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
            quickVibesInput: { category, customDescription, withWordlessVocals: wordlessVocals },
          }
        : {
            ...currentSession,
            currentPrompt: result.prompt,
            versionHistory: [...currentSession.versionHistory, newVersion],
            updatedAt: now,
            promptMode: 'quickVibes',
            quickVibesInput: { category, customDescription, withWordlessVocals: wordlessVocals },
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
  }, [isGenerating, currentSession, generateId, saveSession, resetQuickVibesInput, setGeneratingAction, setDebugInfo, setChatMessages, setValidation]);

  const handleRemixQuickVibes = useCallback(async () => {
    if (isGenerating) return;
    if (!currentSession?.quickVibesInput) return;

    const { category, customDescription, withWordlessVocals: storedWithWordlessVocals } = currentSession.quickVibesInput;
    await handleGenerateQuickVibes(category, customDescription, storedWithWordlessVocals ?? false);
  }, [isGenerating, currentSession, handleGenerateQuickVibes]);

  const handleRefineQuickVibes = useCallback(async (input: string) => {
    if (isGenerating) return;
    if (!currentSession?.currentPrompt) return;

    try {
      setGeneratingAction('quickVibes');
      setChatMessages(prev => [...prev, { role: "user", content: input }]);

      const result = await api.refineQuickVibes(currentSession.currentPrompt, input, withWordlessVocals, quickVibesInput.category);

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
        ...currentSession,
        currentPrompt: result.prompt,
        versionHistory: [...currentSession.versionHistory, newVersion],
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
  }, [isGenerating, currentSession, withWordlessVocals, quickVibesInput.category, saveSession, resetQuickVibesInput, setPendingInput, setGeneratingAction, setDebugInfo, setChatMessages, setValidation]);

  return {
    handleGenerateQuickVibes,
    handleRemixQuickVibes,
    handleRefineQuickVibes,
  };
}
