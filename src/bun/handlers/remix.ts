import { type AIEngine } from '@bun/ai';
import {
  remixGenre,
  remixInstruments,
  remixMoodInPrompt,
  remixRecording,
  remixStyleTags,
  type RemixResult,
} from '@bun/prompt/deterministic';
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
  operation: () => RemixResult
): Promise<{ prompt: string; versionId: string; validation: ReturnType<typeof validatePrompt> }> {
  return withErrorHandling(name, async () => {
    const result = operation();
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
    // All prompt remix actions call deterministic functions directly (no LLM)
    remixInstruments: async (params) => {
      const { currentPrompt, originalInput } = validate(RemixInstrumentsSchema, params);
      return runRemixAction('remixInstruments', () => remixInstruments(currentPrompt, originalInput));
    },
    remixGenre: async (params) => {
      const { currentPrompt, targetGenreCount } = validate(RemixGenreSchema, params);
      return runRemixAction('remixGenre', () => remixGenre(currentPrompt, { targetGenreCount }));
    },
    remixMood: async (params) => {
      const { currentPrompt } = validate(RemixMoodSchema, params);
      return runRemixAction('remixMood', () => remixMoodInPrompt(currentPrompt));
    },
    remixStyleTags: async (params) => {
      const { currentPrompt } = validate(RemixStyleTagsSchema, params);
      return runRemixAction('remixStyleTags', () => remixStyleTags(currentPrompt));
    },
    remixRecording: async (params) => {
      const { currentPrompt } = validate(RemixRecordingSchema, params);
      return runRemixAction('remixRecording', () => remixRecording(currentPrompt));
    },
    // Title uses LLM when lyrics mode is enabled, otherwise deterministic (via AIEngine)
    remixTitle: async (params) => {
      const { currentPrompt, originalInput } = validate(RemixTitleSchema, params);
      return runSingleFieldRemix('remixTitle', async () => {
        return aiEngine.remixTitle(currentPrompt, originalInput);
      });
    },
    // Lyrics still uses LLM (via AIEngine)
    remixLyrics: async (params) => {
      const { currentPrompt, originalInput, lyricsTopic } = validate(RemixLyricsSchema, params);
      return runSingleFieldRemix('remixLyrics', async () => {
        const result = await aiEngine.remixLyrics(currentPrompt, originalInput, lyricsTopic);
        return { lyrics: result.lyrics };
      });
    },
  };
}
