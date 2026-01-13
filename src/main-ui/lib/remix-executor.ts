import { createLogger } from '@/lib/logger';
import { handleGenerationError, createVersion } from '@/lib/session-helpers';
import { nowISO } from '@shared/utils';

import type { GeneratingAction } from '@/hooks/use-generation-state';
import type { ChatMessage } from '@/lib/chat-utils';
import type { PromptSession, TraceRun } from '@shared/types';
import type { ValidationResult } from '@shared/validation';

const log = createLogger('RemixExecutor');

export interface RemixExecutorDeps {
  isGenerating: boolean;
  currentSession: PromptSession | null;
  generateId: () => string;
  saveSession: (session: PromptSession) => Promise<void>;
  setGeneratingAction: (action: GeneratingAction) => void;
  setDebugTrace: (trace: TraceRun | undefined) => void;
  setChatMessages: React.Dispatch<React.SetStateAction<ChatMessage[]>>;
  setValidation: (v: ValidationResult) => void;
  showToast: (message: string, type: 'success' | 'error' | 'warning') => void;
}

/**
 * Executes a prompt remix action (changes the prompt text)
 */
export async function executePromptRemix(
  deps: RemixExecutorDeps,
  action: Exclude<GeneratingAction, 'none' | 'generate' | 'remix'>,
  apiCall: () => Promise<{ prompt: string; versionId: string; validation: ValidationResult }>,
  feedbackLabel: string,
  successMessage: string
): Promise<void> {
  const { isGenerating, currentSession, saveSession, setGeneratingAction, setDebugTrace, setChatMessages, setValidation, showToast } = deps;

  if (isGenerating || !currentSession?.currentPrompt) return;

  try {
    setGeneratingAction(action);
    setDebugTrace(undefined);
    const result = await apiCall();

    if (!result?.prompt) {
      throw new Error(`Invalid result received from ${feedbackLabel}`);
    }

    const newVersion = createVersion(
      { ...result, title: currentSession.currentTitle, lyrics: currentSession.currentLyrics },
      `[${feedbackLabel}]`
    );

    const updatedSession: PromptSession = {
      ...currentSession,
      currentPrompt: result.prompt,
      versionHistory: [...currentSession.versionHistory, newVersion],
      updatedAt: nowISO(),
    };

    setChatMessages((prev) => [...prev, { role: "ai", content: successMessage }]);
    setValidation(result.validation);
    await saveSession(updatedSession);
  } catch (error: unknown) {
    handleGenerationError(error, feedbackLabel, setChatMessages, showToast, log);
  } finally {
    setGeneratingAction('none');
  }
}

/**
 * Executes a single-field remix action (title or lyrics only, prompt unchanged)
 */
export async function executeSingleFieldRemix<T extends { title?: string; lyrics?: string }>(
  deps: RemixExecutorDeps,
  action: 'remixTitle' | 'remixLyrics',
  apiCall: () => Promise<T>,
  getUpdate: (r: T) => Partial<PromptSession>,
  label: string,
  successMessage: string
): Promise<void> {
  const { isGenerating, currentSession, generateId, saveSession, setGeneratingAction, setChatMessages, showToast } = deps;

  if (isGenerating || !currentSession) return;

  try {
    setGeneratingAction(action);
    const result = await apiCall();
    const update = getUpdate(result);
    
    const newVersion = createVersion({
      prompt: currentSession.currentPrompt,
      versionId: generateId(),
      title: update.currentTitle ?? currentSession.currentTitle,
      lyrics: update.currentLyrics ?? currentSession.currentLyrics,
    }, `[${label}]`);

    const updatedSession: PromptSession = {
      ...currentSession,
      ...update,
      versionHistory: [...currentSession.versionHistory, newVersion],
      updatedAt: nowISO(),
    };

    setChatMessages((prev) => [...prev, { role: "ai", content: successMessage }]);
    await saveSession(updatedSession);
  } catch (error: unknown) {
    handleGenerationError(error, label, setChatMessages, showToast, log);
  } finally {
    setGeneratingAction('none');
  }
}
