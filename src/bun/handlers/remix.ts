import { type AIEngine, type GenerationResult } from '@bun/ai';
import {
  RemixInstrumentsSchema,
  RemixGenreSchema,
  RemixMoodSchema,
  RemixStyleTagsSchema,
  RemixRecordingSchema,
  RemixTitleSchema,
  RemixLyricsSchema,
} from '@shared/schemas';
import { validatePrompt } from '@shared/validation';

import { withErrorHandling, log } from './utils';
import { validate } from './validated';

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
    // All prompt remix actions are now synchronous (deterministic, no LLM)
    remixInstruments: async (params) => {
      const { currentPrompt, originalInput } = validate(RemixInstrumentsSchema, params);
      return runRemixAction('remixInstruments', () => Promise.resolve(aiEngine.remixInstruments(currentPrompt, originalInput)));
    },
    remixGenre: async (params) => {
      const { currentPrompt } = validate(RemixGenreSchema, params);
      return runRemixAction('remixGenre', () => Promise.resolve(aiEngine.remixGenre(currentPrompt)));
    },
    remixMood: async (params) => {
      const { currentPrompt } = validate(RemixMoodSchema, params);
      return runRemixAction('remixMood', () => Promise.resolve(aiEngine.remixMood(currentPrompt)));
    },
    remixStyleTags: async (params) => {
      const { currentPrompt } = validate(RemixStyleTagsSchema, params);
      return runRemixAction('remixStyleTags', () => Promise.resolve(aiEngine.remixStyleTags(currentPrompt)));
    },
    remixRecording: async (params) => {
      const { currentPrompt } = validate(RemixRecordingSchema, params);
      return runRemixAction('remixRecording', () => Promise.resolve(aiEngine.remixRecording(currentPrompt)));
    },
    // Title is now synchronous (deterministic, no LLM)
    remixTitle: async (params) => {
      const { currentPrompt, originalInput } = validate(RemixTitleSchema, params);
      return runSingleFieldRemix('remixTitle', () => Promise.resolve(aiEngine.remixTitle(currentPrompt, originalInput)));
    },
    // Lyrics still uses LLM
    remixLyrics: async (params) => {
      const { currentPrompt, originalInput, lyricsTopic } = validate(RemixLyricsSchema, params);
      return runSingleFieldRemix('remixLyrics', async () => {
        const result = await aiEngine.remixLyrics(currentPrompt, originalInput, lyricsTopic);
        return { lyrics: result.lyrics };
      });
    },
  };
}
