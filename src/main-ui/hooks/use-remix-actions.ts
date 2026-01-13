import { useCallback, useMemo } from 'react';

import { executePromptRemix, executeSingleFieldRemix, type RemixExecutorDeps } from '@/lib/remix-executor';
import { rpcClient, type RpcError } from '@/services/rpc-client';
import { type ValidationResult } from '@shared/validation';

import { type GeneratingAction } from './use-generation-state';

function formatRpcError(error: RpcError): string {
  return error.message;
}

function unwrapOrThrow<T>(result: { ok: true; value: T } | { ok: false; error: RpcError }): T {
  if (result.ok) return result.value;
  throw new Error(formatRpcError(result.error));
}

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
  const makePromptRemix = useCallback((action: GeneratingAction, method: keyof typeof rpcClient, label: string, msg: string) => async () => {
    if (!currentSession?.currentPrompt) return;
    await executePromptRemix(
      deps,
      action as Exclude<GeneratingAction, 'none' | 'generate' | 'remix'>,
      async () => {
        const raw = await (rpcClient[method] as (p: { currentPrompt: string }) => Promise<{ ok: true; value: { prompt: string; versionId: string; validation: ValidationResult } } | { ok: false; error: RpcError }>)({ currentPrompt: currentSession.currentPrompt });
        return unwrapOrThrow(raw);
      },
      label,
      msg
    );
  }, [currentSession, deps]);

  /**
   * Special handler for genre remix that preserves genre count in Creative Boost mode.
   */
  const handleRemixGenre = useCallback(async () => {
    if (!currentSession?.currentPrompt) return;
    
    await executePromptRemix(
      deps,
      'remixGenre',
      async () => {
        const result = await rpcClient.remixGenre({ currentPrompt: currentSession.currentPrompt });
        return unwrapOrThrow(result);
      },
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
    await executePromptRemix(
      deps,
      'remixInstruments',
      async () => {
        const result = await rpcClient.remixInstruments({ currentPrompt: currentSession.currentPrompt, originalInput: currentSession.originalInput });
        return unwrapOrThrow(result);
      },
      'instruments remix',
      'Instruments remixed.'
    );
  }, [currentSession, deps]);

  const handleRemixTitle = useCallback(async () => {
    if (!currentSession?.currentPrompt || !currentSession?.originalInput) return;
    await executeSingleFieldRemix(
      deps,
      'remixTitle',
      async () => {
        const result = await rpcClient.remixTitle({ currentPrompt: currentSession.currentPrompt, originalInput: currentSession.originalInput });
        return unwrapOrThrow(result);
      },
      (r) => ({ currentTitle: r.title }),
      'title remix',
      'Title remixed.'
    );
  }, [currentSession, deps]);

  const handleRemixLyrics = useCallback(async () => {
    if (!currentSession?.currentPrompt || !currentSession?.originalInput) return;
    await executeSingleFieldRemix(
      deps,
      'remixLyrics',
      async () => {
        const result = await rpcClient.remixLyrics({ currentPrompt: currentSession.currentPrompt, originalInput: currentSession.originalInput, lyricsTopic: currentSession.lyricsTopic });
        return unwrapOrThrow(result);
      },
      (r) => ({ currentLyrics: r.lyrics }),
      'lyrics remix',
      'Lyrics remixed.'
    );
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
