import { buildChatMessages, type ChatMessage } from '@/lib/chat-utils';
import { getErrorMessage } from '@shared/errors';
import { nowISO } from '@shared/utils';
import { EMPTY_VALIDATION, type ValidationResult } from '@shared/validation';

import type { GeneratingAction } from '@/hooks/use-generation-state';
import type { Logger } from '@/lib/logger';
import type { PromptSession, PromptVersion, PromptMode, QuickVibesInput, CreativeBoostInput, DebugInfo } from '@shared/types';

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

export type GenerationResultBase = {
  prompt: string;
  title?: string;
  lyrics?: string;
  versionId: string;
  debugInfo?: Partial<DebugInfo>;
};

export type ModeInputUpdate = {
  quickVibesInput?: QuickVibesInput;
  creativeBoostInput?: CreativeBoostInput;
};

export type SessionDeps = {
  currentSession: PromptSession | null;
  generateId: () => string;
  saveSession: (session: PromptSession) => Promise<void>;
  setDebugInfo: (info: Partial<DebugInfo> | undefined) => void;
  setChatMessages: React.Dispatch<React.SetStateAction<ChatMessage[]>>;
  setValidation: (v: ValidationResult) => void;
  setGeneratingAction: (action: GeneratingAction) => void;
  log: Logger;
};

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
 * Logs the error and updates chat with error message.
 */
export function handleGenerationError(
  error: unknown,
  actionName: string,
  setChatMessages: React.Dispatch<React.SetStateAction<ChatMessage[]>>,
  log: Logger
): void {
  const errorMessage = getErrorMessage(error, `Failed to ${actionName}`);
  log.error(`${actionName}:failed`, error);
  setChatMessages(prev => [
    ...prev,
    { role: "ai", content: `Error: ${errorMessage}.` },
  ]);
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
 * Combines: debugInfo update, session create/update, chat update, validation reset, save.
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
  const { currentSession, generateId, saveSession, setDebugInfo, setChatMessages, setValidation } = deps;
  
  setDebugInfo(result.debugInfo);
  
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
  
  return session;
}
