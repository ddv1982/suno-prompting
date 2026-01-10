import { useCallback, useMemo } from 'react';

import { executePromptRemix, executeSingleFieldRemix, type RemixExecutorDeps } from '@/lib/remix-executor';
import { api } from '@/services/rpc';
import { type ValidationResult } from '@shared/validation';

import { type GeneratingAction } from './use-generation-state';

export type RemixActions = {
  handleRemixInstruments: () => Promise<void>;
  handleRemixGenre: () => Promise<void>;
  handleRemixMood: () => Promise<void>;
  handleRemixStyleTags: () => Promise<void>;
  handleRemixRecording: () => Promise<void>;
  handleRemixTitle: () => Promise<void>;
  handleRemixLyrics: () => Promise<void>;
};

export function useRemixActions(deps: RemixExecutorDeps): RemixActions {
  const { currentSession } = deps;

  // Factory for prompt-only remix handlers (prompt → remixed prompt)
  const makePromptRemix = useCallback((action: GeneratingAction, method: keyof typeof api, label: string, msg: string) => async () => {
    if (!currentSession?.currentPrompt) return;
    await executePromptRemix(deps, action as Exclude<GeneratingAction, 'none' | 'generate' | 'remix'>, () => (api[method] as (p: string) => Promise<{ prompt: string; versionId: string; validation: ValidationResult }>)(currentSession.currentPrompt), label, msg);
  }, [currentSession, deps]);

  /**
   * Special handler for genre remix that preserves genre count in Creative Boost mode.
   */
  const handleRemixGenre = useCallback(async () => {
    if (!currentSession?.currentPrompt) return;
    
    const targetGenreCount = currentSession.promptMode === 'creativeBoost' && currentSession.creativeBoostInput?.seedGenres?.length
      ? currentSession.creativeBoostInput.seedGenres.length
      : undefined;
    
    await executePromptRemix(
      deps,
      'remixGenre',
      () => api.remixGenre(currentSession.currentPrompt, targetGenreCount),
      'genre remix',
      'Genre remixed.'
    );
  }, [currentSession, deps]);
  const handleRemixMood = useMemo(() => makePromptRemix('remixMood', 'remixMood', 'mood remix', 'Mood remixed.'), [makePromptRemix]);
  const handleRemixStyleTags = useMemo(() => makePromptRemix('remixStyleTags', 'remixStyleTags', 'style tags remix', 'Style tags remixed.'), [makePromptRemix]);
  const handleRemixRecording = useMemo(() => makePromptRemix('remixRecording', 'remixRecording', 'recording remix', 'Recording remixed.'), [makePromptRemix]);

  // Special case: remixInstruments needs originalInput
  const handleRemixInstruments = useCallback(async () => {
    if (!currentSession?.originalInput) return;
    await executePromptRemix(deps, 'remixInstruments', () => api.remixInstruments(currentSession.currentPrompt, currentSession.originalInput), 'instruments remix', 'Instruments remixed.');
  }, [currentSession, deps]);

  const handleRemixTitle = useCallback(async () => {
    if (!currentSession?.currentPrompt || !currentSession?.originalInput) return;
    await executeSingleFieldRemix(deps, 'remixTitle', () => api.remixTitle(currentSession.currentPrompt, currentSession.originalInput), (r) => ({ currentTitle: r.title }), 'title remix', 'Title remixed.');
  }, [currentSession, deps]);

  const handleRemixLyrics = useCallback(async () => {
    if (!currentSession?.currentPrompt || !currentSession?.originalInput) return;
    await executeSingleFieldRemix(deps, 'remixLyrics', () => api.remixLyrics(currentSession.currentPrompt, currentSession.originalInput, currentSession.lyricsTopic), (r) => ({ currentLyrics: r.lyrics }), 'lyrics remix', 'Lyrics remixed.');
  }, [currentSession, deps]);

  return {
    handleRemixInstruments,
    handleRemixGenre,
    handleRemixMood,
    handleRemixStyleTags,
    handleRemixRecording,
    handleRemixTitle,
    handleRemixLyrics,
  };
}
