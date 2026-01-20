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
import { type PromptSession, type PromptMode, type TraceRun } from '@shared/types';
import { type ValidationResult } from '@shared/validation';

import type { GeneratingAction } from '@/hooks/use-generation-state';
import type { Logger } from '@/lib/logger';

/**
 * Common dependencies for generation actions.
 * Shared between Quick Vibes, Creative Boost, and other generation hooks.
 */
export interface GenerationActionDeps {
  isGenerating: boolean;
  currentSession: PromptSession | null;
  generateId: () => string;
  saveSession: (session: PromptSession) => Promise<void>;
  setGeneratingAction: (action: GeneratingAction) => void;
  setDebugTrace: (trace: TraceRun | undefined) => void;
  setChatMessages: React.Dispatch<React.SetStateAction<ChatMessage[]>>;
  setValidation: (v: ValidationResult) => void;
  showToast: (message: string, type: 'success' | 'error' | 'warning') => void;
  /** Start optimistic UI feedback */
  startOptimistic?: (action: GeneratingAction) => void;
  /** Complete optimistic UI (server confirmed) */
  completeOptimistic?: () => void;
  /** Error during generation, reset optimistic UI */
  errorOptimistic?: () => void;
}

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
    setDebugTrace: deps.setDebugTrace,
    setChatMessages: deps.setChatMessages,
    setValidation: deps.setValidation,
    setGeneratingAction: deps.setGeneratingAction,
    showToast: deps.showToast,
    log,
  };
}

/**
 * Options for executing a generation action.
 */
export interface ExecuteGenerationOptions<TResult extends GenerationResultBase> {
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
}

/**
 * Hook that provides a reusable execute function for generation actions.
 * Handles the common try/catch/finally pattern with proper state management.
 * Returns true on success, false on failure or if already generating.
 */
export interface UseGenerationActionResult {
  execute: <TResult extends GenerationResultBase>(
    options: ExecuteGenerationOptions<TResult>,
    sessionDeps: SessionDeps
  ) => Promise<boolean>;
}

export function useGenerationAction(deps: GenerationActionDeps): UseGenerationActionResult {
  const {
    isGenerating,
    setGeneratingAction,
    setChatMessages,
    startOptimistic,
    completeOptimistic,
    errorOptimistic,
  } = deps;

  const execute = useCallback(async <TResult extends GenerationResultBase>(
    options: ExecuteGenerationOptions<TResult>,
    sessionDeps: SessionDeps
  ): Promise<boolean> => {
    if (isGenerating) return false;

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
      // Start optimistic UI immediately
      startOptimistic?.(action);
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

      // Complete optimistic UI on success
      completeOptimistic?.();
      onSuccess?.();
      return true;
    } catch (error: unknown) {
      // Reset optimistic UI on error
      errorOptimistic?.();
      handleGenerationError(error, errorContext, setChatMessages, sessionDeps.showToast, log);
      return false;
    } finally {
      setGeneratingAction('none');
    }
  }, [isGenerating, setGeneratingAction, setChatMessages, startOptimistic, completeOptimistic, errorOptimistic]);

  return { execute };
}
