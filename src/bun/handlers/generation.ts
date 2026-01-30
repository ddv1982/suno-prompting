import { type AIEngine } from '@bun/ai';
import { GenerateInitialSchema, RefinePromptSchema } from '@shared/schemas';
import { validatePrompt } from '@shared/validation';

import { createHandlerRunner } from './utils';
import { validate } from './validated';
import { validateSunoStylesLimit, validateGenreStylesMutualExclusivity } from './validation';

import type { RPCHandlers } from '@shared/types';

type GenerationHandlers = Pick<RPCHandlers, 'generateInitial' | 'refinePrompt'>;

export function createGenerationHandlers(aiEngine: AIEngine): GenerationHandlers {
  return {
    generateInitial: async (params) => {
      const { description, lockedPhrase, lyricsTopic, genreOverride, sunoStyles = [] } = validate(GenerateInitialSchema, params);

      validateSunoStylesLimit(sunoStyles);
      if (genreOverride && sunoStyles.length > 0) {
        validateGenreStylesMutualExclusivity([genreOverride], sunoStyles);
      }

      const traceAction = 'generate.full';
      return createHandlerRunner(
        aiEngine,
        'generateInitial',
        traceAction,
        'full',
        { description, genreOverride, sunoStylesCount: sunoStyles.length },
        (runtime) => aiEngine.generateInitial({ description, lockedPhrase, lyricsTopic, genreOverride, sunoStyles }, runtime),
        (result, _runtime, versionId) => ({
          prompt: result.text,
          title: result.title,
          lyrics: result.lyrics,
          versionId,
          validation: validatePrompt(result.text),
          debugTrace: result.debugTrace,
          storyModeFallback: result.storyModeFallback,
        })
      );
    },
    refinePrompt: async (params) => {
      const {
        currentPrompt,
        feedback = '',
        lockedPhrase,
        currentTitle,
        currentLyrics,
        lyricsTopic,
        genreOverride,
        sunoStyles = [],
        refinementType,
        styleChanges,
      } = validate(RefinePromptSchema, params);

      validateSunoStylesLimit(sunoStyles);
      if (genreOverride && sunoStyles.length > 0) {
        validateGenreStylesMutualExclusivity([genreOverride], sunoStyles);
      }

      const traceAction = 'refine';
      return createHandlerRunner(
        aiEngine,
        'refinePrompt',
        traceAction,
        'full',
        { feedback, sunoStylesCount: sunoStyles.length, refinementType },
        (runtime) => aiEngine.refinePrompt({
          currentPrompt,
          currentTitle: currentTitle ?? 'Untitled',
          feedback,
          currentLyrics,
          lockedPhrase,
          lyricsTopic,
          genreOverride,
          sunoStyles,
          refinementType,
          styleChanges,
        }, runtime),
        (result, _runtime, versionId) => ({
          prompt: result.text,
          title: result.title,
          lyrics: result.lyrics,
          versionId,
          validation: validatePrompt(result.text),
          debugTrace: result.debugTrace,
          storyModeFallback: result.storyModeFallback,
        })
      );
    },
  };
}
