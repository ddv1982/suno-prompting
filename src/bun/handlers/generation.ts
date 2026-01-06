import { type AIEngine, type GenerationResult } from '@bun/ai';
import { GenerateInitialSchema, RefinePromptSchema } from '@shared/schemas';
import { validatePrompt } from '@shared/validation';

import { withErrorHandling, log, type ActionMeta } from './utils';
import { validate } from './validated';

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
      const { description, lockedPhrase, lyricsTopic, genreOverride } = validate(GenerateInitialSchema, params);
      return runAndValidate('generateInitial', { description, genreOverride }, () =>
        aiEngine.generateInitial(description, lockedPhrase, lyricsTopic, genreOverride)
      );
    },
    refinePrompt: async (params) => {
      const { currentPrompt, feedback, lockedPhrase, currentTitle, currentLyrics, lyricsTopic, genreOverride } = validate(RefinePromptSchema, params);
      return runAndValidate('refinePrompt', { feedback, genreOverride }, () =>
        aiEngine.refinePrompt(currentPrompt, feedback, lockedPhrase, currentTitle, currentLyrics, lyricsTopic, genreOverride)
      );
    },
  };
}
