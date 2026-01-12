import { type AIEngine, type GenerationResult } from '@bun/ai';
import { GenerateInitialSchema, RefinePromptSchema } from '@shared/schemas';
import { validatePrompt } from '@shared/validation';

import { withErrorHandling, log, type ActionMeta } from './utils';
import { validate } from './validated';
import { validateSunoStylesLimit, validateGenreStylesMutualExclusivity } from './validation';

import type { RPCHandlers } from '@shared/types';

type GenerationHandlers = Pick<RPCHandlers, 'generateInitial' | 'refinePrompt'>;

async function runAndValidate(
  action: 'generateInitial' | 'refinePrompt',
  meta: ActionMeta,
  operation: () => Promise<GenerationResult>
): Promise<{ prompt: string; title?: string; lyrics?: string; versionId: string; validation: ReturnType<typeof validatePrompt>; debugInfo?: GenerationResult['debugInfo'] }> {
  return withErrorHandling(action, async () => {
    const result = await operation();
    const versionId = Bun.randomUUIDv7();
    const validation = validatePrompt(result.text);
    log.info(`${action}:result`, { versionId, isValid: validation.isValid, promptLength: result.text.length });
    return {
      prompt: result.text,
      title: result.title,
      lyrics: result.lyrics,
      versionId,
      validation,
      debugInfo: result.debugInfo
    };
  }, meta);
}

export function createGenerationHandlers(aiEngine: AIEngine): GenerationHandlers {
  return {
    generateInitial: async (params) => {
      const { description, lockedPhrase, lyricsTopic, genreOverride, sunoStyles = [] } = validate(GenerateInitialSchema, params);
      
      // Validate Suno styles limit
      validateSunoStylesLimit(sunoStyles);
      
      // Validate mutual exclusivity: genreOverride and sunoStyles cannot both be present
      if (genreOverride && sunoStyles.length > 0) {
        validateGenreStylesMutualExclusivity([genreOverride], sunoStyles);
      }
      
      return runAndValidate('generateInitial', { description, genreOverride, sunoStylesCount: sunoStyles.length }, () =>
        aiEngine.generateInitial({ description, lockedPhrase, lyricsTopic, genreOverride, sunoStyles })
      );
    },
    refinePrompt: async (params) => {
      const { currentPrompt, feedback, lockedPhrase, currentTitle, currentLyrics, lyricsTopic, genreOverride, sunoStyles = [] } = validate(RefinePromptSchema, params);
      
      // Validate Suno styles limit
      validateSunoStylesLimit(sunoStyles);
      
      // Validate mutual exclusivity: genreOverride and sunoStyles cannot both be present
      if (genreOverride && sunoStyles.length > 0) {
        validateGenreStylesMutualExclusivity([genreOverride], sunoStyles);
      }
      
      return runAndValidate('refinePrompt', { feedback, sunoStylesCount: sunoStyles.length }, () =>
        aiEngine.refinePrompt({
          currentPrompt,
          currentTitle: currentTitle ?? 'Untitled',
          feedback,
          currentLyrics,
          lockedPhrase,
          lyricsTopic,
          genreOverride,
          sunoStyles,
        })
      );
    },
  };
}
