import { type AIEngine } from '@bun/ai';
import { GenerateCreativeBoostSchema, RefineCreativeBoostSchema } from '@shared/schemas';

import { createHandlerRunner } from './utils';
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
        maxMode,
        withLyrics,
      } = validate(GenerateCreativeBoostSchema, params);

      return createHandlerRunner(
        aiEngine,
        'generateCreativeBoost',
        'generate.creativeBoost',
        'creativeBoost',
        { creativityLevel, seedGenresCount: seedGenres.length },
        (runtime) =>
          aiEngine.generateCreativeBoost(
            creativityLevel,
            seedGenres,
            sunoStyles,
            description,
            lyricsTopic,
            maxMode,
            withLyrics,
            runtime
          ),
        (result, _runtime, versionId) => ({
          prompt: result.text,
          title: result.title ?? 'Creative Boost',
          lyrics: result.lyrics,
          versionId,
          debugTrace: result.debugTrace,
          storyModeFallback: result.storyModeFallback,
        })
      );
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

      return createHandlerRunner(
        aiEngine,
        'refineCreativeBoost',
        'generate.creativeBoost',
        'creativeBoost',
        { feedback },
        (runtime) =>
          aiEngine.refineCreativeBoost(
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
            runtime
          ),
        (result, _runtime, versionId) => ({
          prompt: result.text,
          title: result.title ?? currentTitle,
          lyrics: result.lyrics,
          versionId,
          debugTrace: result.debugTrace,
          storyModeFallback: result.storyModeFallback,
        })
      );
    },
  };
}
