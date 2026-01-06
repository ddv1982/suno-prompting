import { type AIEngine } from '@bun/ai';
import { GenerateCreativeBoostSchema, RefineCreativeBoostSchema } from '@shared/schemas';

import { withErrorHandling, log } from './utils';
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
        const result = await aiEngine.generateCreativeBoost(
          creativityLevel,
          seedGenres,
          sunoStyles,
          description,
          lyricsTopic,
          withWordlessVocals,
          maxMode,
          withLyrics
        );
        const versionId = Bun.randomUUIDv7();
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
          debugInfo: result.debugInfo
        };
      }, { creativityLevel, seedGenresCount: seedGenres.length });
    },
    refineCreativeBoost: async (params) => {
      const {
        currentPrompt,
        currentTitle,
        feedback,
        lyricsTopic,
        description,
        seedGenres,
        sunoStyles,
        withWordlessVocals,
        maxMode,
        withLyrics
      } = validate(RefineCreativeBoostSchema, params);

      return withErrorHandling('refineCreativeBoost', async () => {
        const result = await aiEngine.refineCreativeBoost(
          currentPrompt,
          currentTitle,
          feedback,
          lyricsTopic,
          description,
          seedGenres,
          sunoStyles,
          withWordlessVocals,
          maxMode,
          withLyrics
        );
        const versionId = Bun.randomUUIDv7();
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
          debugInfo: result.debugInfo
        };
      }, { feedback });
    }
  };
}
