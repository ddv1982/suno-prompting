import { type AIEngine, type GenerationResult } from '@bun/ai';
import { GenerateQuickVibesSchema, RefineQuickVibesSchema } from '@shared/schemas';

import { withErrorHandling, log, type ActionMeta } from './utils';
import { validate } from './validated';

import type { RPCHandlers } from '@shared/types';

type QuickVibesHandlers = Pick<RPCHandlers, 'generateQuickVibes' | 'refineQuickVibes'>;

async function runQuickVibesAction(
  actionName: string,
  meta: ActionMeta,
  operation: () => Promise<GenerationResult>
): Promise<{ prompt: string; title?: string; versionId: string; debugInfo?: GenerationResult['debugInfo'] }> {
  return withErrorHandling(actionName, async () => {
    const result = await operation();
    const versionId = Bun.randomUUIDv7();
    log.info(`${actionName}:result`, {
      versionId,
      promptLength: result.text.length,
      hasTitle: !!result.title
    });
    return {
      prompt: result.text,
      title: result.title,
      versionId,
      debugInfo: result.debugInfo
    };
  }, meta);
}

export function createQuickVibesHandlers(aiEngine: AIEngine): QuickVibesHandlers {
  return {
    generateQuickVibes: async (params) => {
      const { category, customDescription, withWordlessVocals, sunoStyles } = validate(GenerateQuickVibesSchema, params);

      return runQuickVibesAction(
        'generateQuickVibes',
        { category, customDescription, withWordlessVocals, sunoStylesCount: sunoStyles.length },
        () => aiEngine.generateQuickVibes(category, customDescription, withWordlessVocals, sunoStyles)
      );
    },
    refineQuickVibes: async (params) => {
      const { currentPrompt, currentTitle, description, feedback, withWordlessVocals, category, sunoStyles } = validate(RefineQuickVibesSchema, params);

      return runQuickVibesAction(
        'refineQuickVibes',
        { feedback, withWordlessVocals, category, sunoStylesCount: sunoStyles.length },
        () => aiEngine.refineQuickVibes({
          currentPrompt,
          currentTitle,
          description,
          feedback,
          withWordlessVocals,
          category,
          sunoStyles,
        })
      );
    },
  };
}
