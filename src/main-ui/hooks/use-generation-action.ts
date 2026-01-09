import { useCallback } from 'react';

import { type ChatMessage } from '@/lib/chat-utils';
import {
  completeSessionUpdate,
  handleGenerationError,
  addUserMessage,
  type SessionDeps,
  type GenerationResultBase,
  type ModeInputUpdate,
} from '@/lib/session-helpers';
import { type PromptSession, type DebugInfo, type PromptMode } from '@shared/types';
import { type ValidationResult } from '@shared/validation';

import type { GeneratingAction } from '@/hooks/use-generation-state';
import type { Logger } from '@/lib/logger';

/**
 * Common dependencies for generation actions.
 * Shared between Quick Vibes, Creative Boost, and other generation hooks.
 */
export type GenerationActionDeps = {
  isGenerating: boolean;
  currentSession: PromptSession | null;
  generateId: () => string;
  saveSession: (session: PromptSession) => Promise<void>;
  setGeneratingAction: (action: GeneratingAction) => void;
  setDebugInfo: (info: Partial<DebugInfo> | undefined) => void;
  setChatMessages: React.Dispatch<React.SetStateAction<ChatMessage[]>>;
  setValidation: (v: ValidationResult) => void;
};

/**
 * Creates SessionDeps from GenerationActionDeps.
 * Used internally by generation action hooks.
 */
export function createSessionDeps(
  deps: GenerationActionDeps,
  log: Logger
): SessionDeps {
  return {
    currentSession: deps.currentSession,
    generateId: deps.generateId,
    saveSession: deps.saveSession,
    setDebugInfo: deps.setDebugInfo,
    setChatMessages: deps.setChatMessages,
    setValidation: deps.setValidation,
    setGeneratingAction: deps.setGeneratingAction,
    log,
  };
}

/**
 * Options for executing a generation action.
 */
export type ExecuteGenerationOptions<TResult extends GenerationResultBase> = {
  /** The generating action type to set during execution */
  action: GeneratingAction;
  /** Async function that performs the API call */
  apiCall: () => Promise<TResult>;
  /** Original input to store in session */
  originalInput: string;
  /** Prompt mode for the session */
  promptMode: PromptMode;
  /** Mode-specific input to store (quickVibesInput or creativeBoostInput) */
  modeInput: ModeInputUpdate;
  /** Success message to show in chat */
  successMessage: string;
  /** Optional feedback text (for refine actions) */
  feedback?: string;
  /** Error context for logging (e.g., "generate Quick Vibes") */
  errorContext: string;
  /** Logger instance */
  log: Logger;
  /** Optional callback after successful completion */
  onSuccess?: () => void;
};

/**
 * Hook that provides a reusable execute function for generation actions.
 * Handles the common try/catch/finally pattern with proper state management.
 */
export interface UseGenerationActionResult {
  execute: <TResult extends GenerationResultBase>(
    options: ExecuteGenerationOptions<TResult>,
    sessionDeps: SessionDeps
  ) => Promise<void>;
}

export function useGenerationAction(deps: GenerationActionDeps): UseGenerationActionResult {
  const {
    isGenerating,
    setGeneratingAction,
    setChatMessages,
  } = deps;

  const execute = useCallback(async <TResult extends GenerationResultBase>(
    options: ExecuteGenerationOptions<TResult>,
    sessionDeps: SessionDeps
  ): Promise<void> => {
    if (isGenerating) return;

    const {
      action,
      apiCall,
      originalInput,
      promptMode,
      modeInput,
      successMessage,
      feedback,
      errorContext,
      log,
      onSuccess,
    } = options;

    try {
      setGeneratingAction(action);

      if (feedback) {
        addUserMessage(setChatMessages, feedback);
      }

      const result = await apiCall();

      if (!result?.prompt) {
        throw new Error(`Invalid result received from ${errorContext}`);
      }

      await completeSessionUpdate(
        sessionDeps,
        result,
        originalInput,
        promptMode,
        modeInput,
        successMessage,
        feedback
      );

      onSuccess?.();
    } catch (error: unknown) {
      handleGenerationError(error, errorContext, setChatMessages, log);
    } finally {
      setGeneratingAction('none');
    }
  }, [isGenerating, setGeneratingAction, setChatMessages]);

  return { execute };
}
