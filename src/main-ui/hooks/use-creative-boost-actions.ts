import { useCallback } from 'react';
import { api } from '@/services/rpc';
import { type PromptSession, type PromptVersion, type DebugInfo, type CreativeBoostInput } from '@shared/types';
import { EMPTY_VALIDATION, type ValidationResult } from '@shared/validation';
import { buildChatMessages, type ChatMessage } from '@/lib/chat-utils';
import { createLogger } from '@/lib/logger';
import type { GeneratingAction } from '@/hooks/use-generation-state';

const log = createLogger('CreativeBoost');

const buildSavedCreativeBoostInput = (input: CreativeBoostInput): CreativeBoostInput => ({
  creativityLevel: input.creativityLevel,
  seedGenres: input.seedGenres,
  sunoStyles: input.sunoStyles,
  description: input.description,
  lyricsTopic: input.lyricsTopic,
  withWordlessVocals: input.withWordlessVocals,
});

const buildCreativeBoostOriginalInput = (input: CreativeBoostInput): string => {
  return [
    `[creativity: ${input.creativityLevel}%]`,
    input.seedGenres.length > 0 ? `[genres: ${input.seedGenres.join(', ')}]` : null,
    input.sunoStyles.length > 0 ? `[suno-styles: ${input.sunoStyles.join(', ')}]` : null,
    input.description || null,
  ].filter(Boolean).join(' ') || 'Creative Boost';
};

type CreativeBoostActionsConfig = {
  isGenerating: boolean;
  currentSession: PromptSession | null;
  generateId: () => string;
  saveSession: (session: PromptSession) => Promise<void>;
  setGeneratingAction: (action: GeneratingAction) => void;
  setDebugInfo: (info: Partial<DebugInfo> | undefined) => void;
  setChatMessages: React.Dispatch<React.SetStateAction<ChatMessage[]>>;
  setValidation: (v: ValidationResult) => void;
  setPendingInput: (input: string) => void;
  showToast: (message: string, type: 'success' | 'error') => void;
  creativeBoostInput: CreativeBoostInput;
  maxMode: boolean;
  lyricsMode: boolean;
};

export function useCreativeBoostActions(config: CreativeBoostActionsConfig) {
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
    showToast,
    creativeBoostInput,
    maxMode,
    lyricsMode,
  } = config;

  const handleGenerateCreativeBoost = useCallback(async () => {
    if (isGenerating) return;

    try {
      setGeneratingAction('creativeBoost');
      const result = await api.generateCreativeBoost({
        creativityLevel: creativeBoostInput.creativityLevel,
        seedGenres: creativeBoostInput.seedGenres,
        sunoStyles: creativeBoostInput.sunoStyles,
        description: creativeBoostInput.description,
        lyricsTopic: creativeBoostInput.lyricsTopic,
        withWordlessVocals: creativeBoostInput.withWordlessVocals,
        maxMode,
        withLyrics: lyricsMode,
      });

      if (!result?.prompt) {
        throw new Error("Invalid result received from Creative Boost generation");
      }

      setDebugInfo(result.debugInfo);
      const now = new Date().toISOString();
      const originalInput = buildCreativeBoostOriginalInput(creativeBoostInput);

      const newVersion: PromptVersion = {
        id: result.versionId,
        content: result.prompt,
        title: result.title,
        lyrics: result.lyrics,
        timestamp: now,
      };

      const isNewSession = !currentSession;
      const updatedSession: PromptSession = isNewSession
        ? {
            id: generateId(),
            originalInput,
            currentPrompt: result.prompt,
            currentTitle: result.title,
            currentLyrics: result.lyrics,
            versionHistory: [newVersion],
            createdAt: now,
            updatedAt: now,
            promptMode: 'creativeBoost',
            creativeBoostInput: buildSavedCreativeBoostInput(creativeBoostInput),
          }
        : {
            ...currentSession,
            currentPrompt: result.prompt,
            currentTitle: result.title,
            currentLyrics: result.lyrics,
            versionHistory: [...currentSession.versionHistory, newVersion],
            updatedAt: now,
            promptMode: 'creativeBoost',
            creativeBoostInput: buildSavedCreativeBoostInput(creativeBoostInput),
          };

      if (isNewSession) {
        setChatMessages(buildChatMessages(updatedSession));
      } else {
        setChatMessages(prev => [...prev, { role: "ai", content: "Creative Boost prompt generated." }]);
      }

      setValidation({ ...EMPTY_VALIDATION });
      await saveSession(updatedSession);
      showToast('Creative Boost generated!', 'success');
    } catch (error) {
      log.error("generateCreativeBoost:failed", error);
      showToast(error instanceof Error ? error.message : "Failed to generate Creative Boost", 'error');
      setChatMessages(prev => [
        ...prev,
        { role: "ai", content: `Error: ${error instanceof Error ? error.message : "Failed to generate Creative Boost"}.` },
      ]);
    } finally {
      setGeneratingAction('none');
    }
  }, [isGenerating, currentSession, generateId, saveSession, creativeBoostInput, maxMode, lyricsMode, showToast, setGeneratingAction, setDebugInfo, setChatMessages, setValidation]);

  const handleRefineCreativeBoost = useCallback(async (feedback: string) => {
    if (isGenerating) return;
    if (!currentSession?.currentPrompt || !currentSession?.currentTitle) return;

    try {
      setGeneratingAction('creativeBoost');
      setChatMessages(prev => [...prev, { role: "user", content: feedback }]);

      const result = await api.refineCreativeBoost({
        currentPrompt: currentSession.currentPrompt,
        currentTitle: currentSession.currentTitle,
        feedback,
        lyricsTopic: creativeBoostInput.lyricsTopic,
        description: creativeBoostInput.description,
        seedGenres: creativeBoostInput.seedGenres,
        sunoStyles: creativeBoostInput.sunoStyles,
        withWordlessVocals: creativeBoostInput.withWordlessVocals,
        maxMode,
        withLyrics: lyricsMode,
      });

      if (!result?.prompt) {
        throw new Error("Invalid result received from Creative Boost refinement");
      }

      setDebugInfo(result.debugInfo);
      const now = new Date().toISOString();
      const newVersion: PromptVersion = {
        id: result.versionId,
        content: result.prompt,
        title: result.title,
        lyrics: result.lyrics,
        feedback,
        timestamp: now,
      };

      const updatedSession: PromptSession = {
        ...currentSession,
        currentPrompt: result.prompt,
        currentTitle: result.title,
        currentLyrics: result.lyrics,
        versionHistory: [...currentSession.versionHistory, newVersion],
        updatedAt: now,
        creativeBoostInput: buildSavedCreativeBoostInput(creativeBoostInput),
      };

      setChatMessages(prev => [...prev, { role: "ai", content: "Creative Boost prompt refined." }]);
      setValidation({ ...EMPTY_VALIDATION });
      await saveSession(updatedSession);
      setPendingInput("");
      showToast('Creative Boost refined!', 'success');
    } catch (error) {
      log.error("refineCreativeBoost:failed", error);
      showToast(error instanceof Error ? error.message : "Failed to refine Creative Boost", 'error');
      setChatMessages(prev => [
        ...prev,
        { role: "ai", content: `Error: ${error instanceof Error ? error.message : "Failed to refine Creative Boost"}.` },
      ]);
    } finally {
      setGeneratingAction('none');
    }
  }, [isGenerating, currentSession, creativeBoostInput, maxMode, lyricsMode, saveSession, setPendingInput, showToast, setGeneratingAction, setDebugInfo, setChatMessages, setValidation]);

  return {
    handleGenerateCreativeBoost,
    handleRefineCreativeBoost,
  };
}
