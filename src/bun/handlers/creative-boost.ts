import { type AIEngine, type GenerationResult } from '@bun/ai';
import { GenerateCreativeBoostSchema, RefineCreativeBoostSchema } from '@shared/schemas';
import { enforceTraceSizeCap } from '@shared/trace';

import { createTraceRuntime, withErrorHandling, log, type TraceRuntime } from './utils';
import { validate } from './validated';

import type { RPCHandlers } from '@shared/types';

type CreativeBoostHandlers = Pick<RPCHandlers, 'generateCreativeBoost' | 'refineCreativeBoost'>;

/** Build the response object from a Creative Boost generation result */
function buildCreativeBoostResponse(
  result: GenerationResult,
  runtime: TraceRuntime,
  versionId: string,
  defaultTitle: string
): { prompt: string; title: string; lyrics?: string; versionId: string; debugTrace?: GenerationResult['debugTrace']; storyModeFallback?: boolean } {
  const debugTrace = runtime.trace ? enforceTraceSizeCap(runtime.trace.finalize()) : result.debugTrace;
  return {
    prompt: result.text,
    title: result.title ?? defaultTitle,
    lyrics: result.lyrics,
    versionId,
    debugTrace,
    storyModeFallback: result.storyModeFallback,
  };
}

export function createCreativeBoostHandlers(aiEngine: AIEngine): CreativeBoostHandlers {
  return {
    generateCreativeBoost: async (params) => {
      const {
        creativityLevel,
        seedGenres,
        sunoStyles,
        description,
        lyricsTopic,
        maxMode,
        withLyrics
      } = validate(GenerateCreativeBoostSchema, params);

      return withErrorHandling('generateCreativeBoost', async () => {
        const versionId = Bun.randomUUIDv7();
        const runtime = createTraceRuntime(aiEngine, versionId, 'generate.creativeBoost', 'creativeBoost');

        runtime.trace?.addRunEvent('run.start', 'generate.creativeBoost');
        const result = await aiEngine.generateCreativeBoost(
          creativityLevel, seedGenres, sunoStyles, description, lyricsTopic,
          maxMode, withLyrics, runtime
        );
        runtime.trace?.addRunEvent('run.end', 'success');

        log.info('generateCreativeBoost:result', {
          versionId, promptLength: result.text.length, hasLyrics: !!result.lyrics,
          hasTitle: !!result.title, storyModeFallback: result.storyModeFallback
        });
        return buildCreativeBoostResponse(result, runtime, versionId, 'Creative Boost');
      }, { creativityLevel, seedGenresCount: seedGenres.length });
    },
    refineCreativeBoost: async (params) => {
      const {
        currentPrompt,
        currentTitle,
        currentLyrics,
        feedback,
        lyricsTopic,
        description,
        seedGenres,
        sunoStyles,
        maxMode,
        withLyrics,
        targetGenreCount,
      } = validate(RefineCreativeBoostSchema, params);

      return withErrorHandling('refineCreativeBoost', async () => {
        const versionId = Bun.randomUUIDv7();
        const runtime = createTraceRuntime(aiEngine, versionId, 'generate.creativeBoost', 'creativeBoost');

        runtime.trace?.addRunEvent('run.start', 'refine.creativeBoost');
        const result = await aiEngine.refineCreativeBoost(
          currentPrompt, currentTitle, currentLyrics, feedback, lyricsTopic, description,
          seedGenres, sunoStyles, maxMode, withLyrics, targetGenreCount, runtime
        );
        runtime.trace?.addRunEvent('run.end', 'success');

        log.info('refineCreativeBoost:result', {
          versionId, promptLength: result.text.length, hasLyrics: !!result.lyrics,
          storyModeFallback: result.storyModeFallback
        });
        return buildCreativeBoostResponse(result, runtime, versionId, currentTitle);
      }, { feedback });
    }
  };
}
