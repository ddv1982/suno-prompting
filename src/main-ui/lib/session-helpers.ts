import { buildChatMessages, type ChatMessage } from '@/lib/chat-utils';
import {
  getErrorMessage,
  ValidationError,
  OllamaTimeoutError,
  OllamaUnavailableError,
  OllamaModelMissingError,
  AIGenerationError,
  StorageError,
  InvariantError,
} from '@shared/errors';
import { nowISO } from '@shared/utils';
import { EMPTY_VALIDATION, type ValidationResult } from '@shared/validation';

import type { GeneratingAction } from '@/hooks/use-generation-state';
import type { Logger } from '@/lib/logger';
import type { PromptSession, PromptVersion, PromptMode, QuickVibesInput, CreativeBoostInput, TraceRun } from '@shared/types';

/**
 * Build originalInput for Full Prompt mode.
 * Ensures remix actions always work by never returning an empty string.
 * Without this, empty descriptions with genre/topic would cause remix buttons to silently fail
 * (they check `if (!currentSession?.originalInput) return;`).
 */
export function buildFullPromptOriginalInput(
  description: string,
  genreOverride?: string,
  lyricsTopic?: string
): string {
  return [
    genreOverride ? `[genre: ${genreOverride}]` : null,
    lyricsTopic?.trim() ? `[topic: ${lyricsTopic.trim()}]` : null,
    description || null,
  ].filter(Boolean).join(' ') || 'Full Prompt';
}

/**
 * Maps error types to toast variants.
 * Critical errors → 'error' (red toast)
 * Warnings → 'warning' (orange toast)
 */
export function getErrorToastType(error: unknown): 'error' | 'warning' {
  // Warnings (recoverable, user-fixable)
  if (error instanceof ValidationError) return 'warning';
  if (error instanceof OllamaTimeoutError) return 'warning';
  
  // All other errors are critical
  if (error instanceof OllamaUnavailableError) return 'error';
  if (error instanceof OllamaModelMissingError) return 'error';
  if (error instanceof AIGenerationError) return 'error';
  if (error instanceof StorageError) return 'error';
  if (error instanceof InvariantError) return 'error';
  
  // Default: treat unknown errors as critical
  return 'error';
}

export interface GenerationResultBase {
  prompt: string;
  title?: string;
  lyrics?: string;
  versionId: string;
  debugTrace?: TraceRun;
  /** Flag indicating Story Mode fell back to deterministic output */
  storyModeFallback?: boolean;
}

export interface ModeInputUpdate {
  quickVibesInput?: QuickVibesInput;
  creativeBoostInput?: CreativeBoostInput;
}

export interface SessionDeps {
  currentSession: PromptSession | null;
  generateId: () => string;
  saveSession: (session: PromptSession) => Promise<void>;
  setDebugTrace: (trace: TraceRun | undefined) => void;
  setChatMessages: React.Dispatch<React.SetStateAction<ChatMessage[]>>;
  setValidation: (v: ValidationResult) => void;
  setGeneratingAction: (action: GeneratingAction) => void;
  showToast: (message: string, type: 'success' | 'error' | 'warning') => void;
  log: Logger;
}

/**
 * Creates a new version entry for the session history
 */
export function createVersion(
  result: GenerationResultBase,
  feedback?: string
): PromptVersion {
  return {
    id: result.versionId,
    content: result.prompt,
    title: result.title,
    lyrics: result.lyrics,
    feedback,
    timestamp: nowISO(),
    debugTrace: result.debugTrace,
  };
}

/**
 * Creates or updates a session with new generation result.
 * Handles both new session creation and existing session updates.
 * Internal helper - use completeSessionUpdate for the full flow.
 */
function createOrUpdateSession(
  currentSession: PromptSession | null,
  result: GenerationResultBase,
  originalInput: string,
  promptMode: PromptMode,
  generateId: () => string,
  modeInput: ModeInputUpdate,
  feedback?: string
): { session: PromptSession; isNew: boolean } {
  const now = nowISO();
  const newVersion = createVersion(result, feedback);
  const isNew = !currentSession;

  const session: PromptSession = isNew
    ? {
        id: generateId(),
        originalInput,
        currentPrompt: result.prompt,
        currentTitle: result.title,
        currentLyrics: result.lyrics,
        versionHistory: [newVersion],
        createdAt: now,
        updatedAt: now,
        promptMode,
        ...modeInput,
      }
    : {
        ...currentSession,
        currentPrompt: result.prompt,
        currentTitle: result.title,
        currentLyrics: result.lyrics,
        versionHistory: [...currentSession.versionHistory, newVersion],
        updatedAt: now,
        promptMode,
        ...modeInput,
      };

  return { session, isNew };
}

/**
 * Updates chat messages after generation
 */
export function updateChatMessagesAfterGeneration(
  setChatMessages: React.Dispatch<React.SetStateAction<ChatMessage[]>>,
  session: PromptSession,
  isNew: boolean,
  successMessage: string
): void {
  if (isNew) {
    setChatMessages(buildChatMessages(session));
  } else {
    setChatMessages(prev => [...prev, { role: "ai", content: successMessage }]);
  }
}

/**
 * Handles errors in generation/refine actions.
 * Logs the error, updates chat with error message, and shows toast notification.
 */
export function handleGenerationError(
  error: unknown,
  actionName: string,
  setChatMessages: React.Dispatch<React.SetStateAction<ChatMessage[]>>,
  showToast: (message: string, type: 'success' | 'error' | 'warning') => void,
  log: Logger
): void {
  const errorMessage = getErrorMessage(error, `Failed to ${actionName}`);
  log.error(`${actionName}:failed`, error);
  
  // Existing: Add to chat
  setChatMessages(prev => [
    ...prev,
    { role: "ai", content: `Error: ${errorMessage}.` },
  ]);
  
  // NEW: Show toast notification
  const toastType = getErrorToastType(error);
  showToast(errorMessage, toastType);
}

/**
 * Adds a user message to chat history
 */
export function addUserMessage(
  setChatMessages: React.Dispatch<React.SetStateAction<ChatMessage[]>>,
  content: string
): void {
  setChatMessages(prev => [...prev, { role: "user", content }]);
}

/**
 * Complete session update flow after successful generation.
 * Combines: debugTrace update, session create/update, chat update, validation reset, save.
 * Shows warning toast if Story Mode fell back to deterministic output.
 */
export async function completeSessionUpdate(
  deps: SessionDeps,
  result: GenerationResultBase,
  originalInput: string,
  promptMode: PromptMode,
  modeInput: ModeInputUpdate,
  successMessage: string,
  feedback?: string
): Promise<PromptSession> {
  const { currentSession, generateId, saveSession, setDebugTrace, setChatMessages, setValidation, showToast } = deps;
  
  setDebugTrace(result.debugTrace);
  
  const { session, isNew } = createOrUpdateSession(
    currentSession,
    result,
    originalInput,
    promptMode,
    generateId,
    modeInput,
    feedback
  );
  
  updateChatMessagesAfterGeneration(setChatMessages, session, isNew, successMessage);
  setValidation({ ...EMPTY_VALIDATION });
  await saveSession(session);
  
  // Show warning toast when Story Mode falls back to deterministic output
  if (result.storyModeFallback) {
    showToast('Story Mode unavailable - using standard format', 'warning');
  }
  
  return session;
}
