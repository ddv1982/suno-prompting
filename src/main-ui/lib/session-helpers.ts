import type { PromptSession, PromptVersion, PromptMode, QuickVibesInput, CreativeBoostInput, DebugInfo } from '@shared/types';
import { EMPTY_VALIDATION, type ValidationResult } from '@shared/validation';
import { buildChatMessages, type ChatMessage } from '@/lib/chat-utils';

export type GenerationResultBase = {
  prompt: string;
  title?: string;
  lyrics?: string;
  versionId: string;
  debugInfo?: Partial<DebugInfo>;
};

export type SessionUpdateParams = {
  currentSession: PromptSession | null;
  result: GenerationResultBase;
  originalInput: string;
  promptMode: PromptMode;
  generateId: () => string;
  feedback?: string;
};

export type ModeInputUpdate = {
  quickVibesInput?: QuickVibesInput;
  creativeBoostInput?: CreativeBoostInput;
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
    timestamp: new Date().toISOString(),
  };
}

/**
 * Creates or updates a session with new generation result
 */
export function createOrUpdateSession(
  params: SessionUpdateParams,
  modeInput: ModeInputUpdate
): { session: PromptSession; isNew: boolean } {
  const { currentSession, result, originalInput, promptMode, generateId, feedback } = params;
  const now = new Date().toISOString();
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
 * Handles errors in generation/refine actions
 */
export function handleGenerationError(
  error: unknown,
  actionName: string,
  setChatMessages: React.Dispatch<React.SetStateAction<ChatMessage[]>>,
  log: { error: (msg: string, err: unknown) => void }
): string {
  const errorMessage = error instanceof Error ? error.message : `Failed to ${actionName}`;
  log.error(`${actionName}:failed`, error);
  setChatMessages(prev => [
    ...prev,
    { role: "ai", content: `Error: ${errorMessage}.` },
  ]);
  return errorMessage;
}

/**
 * Common post-generation cleanup
 */
export function postGenerationCleanup(
  setValidation: (v: ValidationResult) => void,
  setGeneratingAction: (action: 'none') => void
): void {
  setValidation({ ...EMPTY_VALIDATION });
  setGeneratingAction('none');
}
