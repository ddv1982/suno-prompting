import { type AIEngine, type GenerationResult } from '@bun/ai';
import { validatePrompt } from '@shared/validation';

import { withErrorHandling, log } from './utils';

import type { RPCHandlers } from '@shared/types';

type RemixHandlers = Pick<
  RPCHandlers,
  'remixInstruments' | 'remixGenre' | 'remixMood' | 'remixStyleTags' | 'remixRecording' | 'remixTitle' | 'remixLyrics'
>;

async function runRemixAction(
  name: string,
  operation: () => Promise<GenerationResult>
): Promise<{ prompt: string; versionId: string; validation: ReturnType<typeof validatePrompt> }> {
  return withErrorHandling(name, async () => {
    const result = await operation();
    const versionId = Bun.randomUUIDv7();
    const validation = validatePrompt(result.text);
    log.info(`${name}:result`, { versionId, promptLength: result.text.length });
    return { prompt: result.text, versionId, validation };
  });
}

async function runSingleFieldRemix<T>(name: string, operation: () => Promise<T>): Promise<T> {
  return withErrorHandling(name, operation);
}

export function createRemixHandlers(aiEngine: AIEngine): RemixHandlers {
  return {
    remixInstruments: async ({ currentPrompt, originalInput }) => {
      return runRemixAction('remixInstruments', () => aiEngine.remixInstruments(currentPrompt, originalInput));
    },
    remixGenre: async ({ currentPrompt }) => {
      return runRemixAction('remixGenre', () => aiEngine.remixGenre(currentPrompt));
    },
    remixMood: async ({ currentPrompt }) => {
      return runRemixAction('remixMood', () => aiEngine.remixMood(currentPrompt));
    },
    remixStyleTags: async ({ currentPrompt }) => {
      return runRemixAction('remixStyleTags', () => aiEngine.remixStyleTags(currentPrompt));
    },
    remixRecording: async ({ currentPrompt }) => {
      return runRemixAction('remixRecording', () => aiEngine.remixRecording(currentPrompt));
    },
    remixTitle: async ({ currentPrompt, originalInput }) => {
      return runSingleFieldRemix('remixTitle', async () => {
        const result = await aiEngine.remixTitle(currentPrompt, originalInput);
        return { title: result.title };
      });
    },
    remixLyrics: async ({ currentPrompt, originalInput, lyricsTopic }) => {
      return runSingleFieldRemix('remixLyrics', async () => {
        const result = await aiEngine.remixLyrics(currentPrompt, originalInput, lyricsTopic);
        return { lyrics: result.lyrics };
      });
    },
  };
}
