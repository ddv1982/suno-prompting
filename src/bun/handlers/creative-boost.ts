import { type AIEngine } from '@bun/ai';

import { withErrorHandling, log } from './utils';
import {
  validateCreativityLevel,
  validateGenreStylesMutualExclusivity,
  validateRequiredField,
  validateSeedGenresLimit,
  validateSunoStylesLimit,
} from './validation';

import type { RPCHandlers } from '@shared/types';

type CreativeBoostHandlers = Pick<RPCHandlers, 'generateCreativeBoost' | 'refineCreativeBoost'>;

export function createCreativeBoostHandlers(aiEngine: AIEngine): CreativeBoostHandlers {
  return {
    generateCreativeBoost: async ({
      creativityLevel,
      seedGenres,
      sunoStyles,
      description,
      lyricsTopic,
      withWordlessVocals,
      maxMode,
      withLyrics
    }) => {
      validateCreativityLevel(creativityLevel);
      validateSeedGenresLimit(seedGenres);
      validateSunoStylesLimit(sunoStyles);
      validateGenreStylesMutualExclusivity(seedGenres, sunoStyles);

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
    refineCreativeBoost: async ({
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
    }) => {
      validateRequiredField(currentPrompt, 'currentPrompt', 'Current prompt is required for refinement');
      validateRequiredField(currentTitle, 'currentTitle', 'Current title is required for refinement');
      validateSunoStylesLimit(sunoStyles);
      validateGenreStylesMutualExclusivity(seedGenres, sunoStyles);

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
