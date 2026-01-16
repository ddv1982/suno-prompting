import { type AIEngine } from '@bun/ai';
import { GenerateCreativeBoostSchema, RefineCreativeBoostSchema } from '@shared/schemas';
import { enforceTraceSizeCap } from '@shared/trace';

import { createTraceRuntime, withErrorHandling, log } from './utils';
import { validate } from './validated';

import type { RPCHandlers } from '@shared/types';

type CreativeBoostHandlers = Pick<RPCHandlers, 'generateCreativeBoost' | 'refineCreativeBoost'>;

export function createCreativeBoostHandlers(aiEngine: AIEngine): CreativeBoostHandlers {
  return {
    generateCreativeBoost: async (params) => {
      const {
        creativityLevel,
        seedGenres,
        sunoStyles,
        description,
        lyricsTopic,
        withWordlessVocals,
        maxMode,
        withLyrics
      } = validate(GenerateCreativeBoostSchema, params);

      return withErrorHandling('generateCreativeBoost', async () => {
        const versionId = Bun.randomUUIDv7();
        const runtime = createTraceRuntime(aiEngine, versionId, 'generate.creativeBoost', 'creativeBoost');

        runtime.trace?.addRunEvent('run.start', 'generate.creativeBoost');
        const result = await aiEngine.generateCreativeBoost(
          creativityLevel,
          seedGenres,
          sunoStyles,
          description,
          lyricsTopic,
          withWordlessVocals,
          maxMode,
          withLyrics,
          runtime
        );
        runtime.trace?.addRunEvent('run.end', 'success');

        const debugTrace = runtime.trace ? enforceTraceSizeCap(runtime.trace.finalize()) : result.debugTrace;

        log.info('generateCreativeBoost:result', {
          versionId,
          promptLength: result.text.length,
          hasLyrics: !!result.lyrics,
          hasTitle: !!result.title
        });
        return {
          prompt: result.text,
          title: result.title ?? 'Creative Boost',
          lyrics: result.lyrics,
          versionId,
          debugTrace
        };
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
        withWordlessVocals,
        maxMode,
        withLyrics,
        targetGenreCount,
      } = validate(RefineCreativeBoostSchema, params);

      return withErrorHandling('refineCreativeBoost', async () => {
        const versionId = Bun.randomUUIDv7();
        const runtime = createTraceRuntime(aiEngine, versionId, 'generate.creativeBoost', 'creativeBoost');

        runtime.trace?.addRunEvent('run.start', 'refine.creativeBoost');
        const result = await aiEngine.refineCreativeBoost(
          currentPrompt,
          currentTitle,
          currentLyrics,
          feedback,
          lyricsTopic,
          description,
          seedGenres,
          sunoStyles,
          withWordlessVocals,
          maxMode,
          withLyrics,
          targetGenreCount,
          runtime
        );
        runtime.trace?.addRunEvent('run.end', 'success');

        const debugTrace = runtime.trace ? enforceTraceSizeCap(runtime.trace.finalize()) : result.debugTrace;

        log.info('refineCreativeBoost:result', {
          versionId,
          promptLength: result.text.length,
          hasLyrics: !!result.lyrics
        });
        return {
          prompt: result.text,
          title: result.title ?? currentTitle,
          lyrics: result.lyrics,
          versionId,
          debugTrace
        };
      }, { feedback });
    }
  };
}
