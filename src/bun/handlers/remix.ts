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
import { enforceTraceSizeCap } from '@shared/trace';
import { validatePrompt } from '@shared/validation';

import { createTraceRuntime, withErrorHandling, log } from './utils';
import { validate } from './validated';

import type { TraceCollector } from '@bun/trace';
import type { RPCHandlers, TraceRun, TraceRunAction } from '@shared/types';

type RemixHandlers = Pick<
  RPCHandlers,
  'remixInstruments' | 'remixGenre' | 'remixMood' | 'remixStyleTags' | 'remixRecording' | 'remixTitle' | 'remixLyrics'
>;

type RemixActionResult = { prompt: string; versionId: string; validation: ReturnType<typeof validatePrompt>; debugTrace?: TraceRun };

async function runRemixAction(
  aiEngine: AIEngine,
  name: string,
  action: TraceRunAction,
  operation: (trace?: TraceCollector, rng?: () => number) => RemixResult
): Promise<RemixActionResult> {
  return withErrorHandling(name, async () => {
    const versionId = Bun.randomUUIDv7();
    const runtime = createTraceRuntime(aiEngine, versionId, action, 'full');

    runtime.trace?.addRunEvent('run.start', action);
    const result = operation(runtime.trace, runtime.rng);
    runtime.trace?.addRunEvent('run.end', 'success');

    const debugTrace = runtime.trace ? enforceTraceSizeCap(runtime.trace.finalize()) : undefined;
    const validation = validatePrompt(result.text);
    log.info(`${name}:result`, { versionId, promptLength: result.text.length });
    return { prompt: result.text, versionId, validation, debugTrace };
  });
}

async function runSingleFieldRemix<T>(name: string, operation: () => Promise<T>): Promise<T> {
  return withErrorHandling(name, operation);
}

export function createRemixHandlers(aiEngine: AIEngine): RemixHandlers {
  return {
    // All prompt remix actions call deterministic functions with trace support
    remixInstruments: async (params) => {
      const { currentPrompt, originalInput } = validate(RemixInstrumentsSchema, params);
      return runRemixAction(aiEngine, 'remixInstruments', 'remix.instruments', (trace, rng) =>
        remixInstruments(currentPrompt, originalInput, trace, rng)
      );
    },
    remixGenre: async (params) => {
      const { currentPrompt, targetGenreCount } = validate(RemixGenreSchema, params);
      return runRemixAction(aiEngine, 'remixGenre', 'remix.genre', (trace, rng) =>
        remixGenre(currentPrompt, { targetGenreCount }, trace, rng)
      );
    },
    remixMood: async (params) => {
      const { currentPrompt } = validate(RemixMoodSchema, params);
      return runRemixAction(aiEngine, 'remixMood', 'remix.mood', (trace, rng) =>
        remixMoodInPrompt(currentPrompt, trace, rng)
      );
    },
    remixStyleTags: async (params) => {
      const { currentPrompt } = validate(RemixStyleTagsSchema, params);
      return runRemixAction(aiEngine, 'remixStyleTags', 'remix.styleTags', (trace, rng) =>
        remixStyleTags(currentPrompt, trace, rng)
      );
    },
    remixRecording: async (params) => {
      const { currentPrompt } = validate(RemixRecordingSchema, params);
      return runRemixAction(aiEngine, 'remixRecording', 'remix.recording', (trace, rng) =>
        remixRecording(currentPrompt, trace, rng)
      );
    },
    // Title uses LLM when available - includes trace support for debug mode
    remixTitle: async (params) => {
      const { currentPrompt, originalInput, currentLyrics } = validate(RemixTitleSchema, params);
      return withErrorHandling('remixTitle', async () => {
        const versionId = Bun.randomUUIDv7();
        const runtime = createTraceRuntime(aiEngine, versionId, 'remix.title', 'full');

        runtime.trace?.addRunEvent('run.start', 'remix.title');
        const result = await aiEngine.remixTitle(currentPrompt, originalInput, currentLyrics, runtime);
        runtime.trace?.addRunEvent('run.end', 'success');

        const debugTrace = runtime.trace ? enforceTraceSizeCap(runtime.trace.finalize()) : undefined;
        return { title: result.title, debugTrace };
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
