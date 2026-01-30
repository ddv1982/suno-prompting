import { type AIEngine } from '@bun/ai';
import { GenerateQuickVibesSchema, RefineQuickVibesSchema } from '@shared/schemas';

import { createHandlerRunner } from './utils';
import { validate } from './validated';

import type { RPCHandlers } from '@shared/types';

type QuickVibesHandlers = Pick<RPCHandlers, 'generateQuickVibes' | 'refineQuickVibes'>;

export function createQuickVibesHandlers(aiEngine: AIEngine): QuickVibesHandlers {
  return {
    generateQuickVibes: async (params) => {
      const { category, customDescription, sunoStyles } = validate(GenerateQuickVibesSchema, params);

      return createHandlerRunner(
        aiEngine,
        'generateQuickVibes',
        'generate.quickVibes',
        'quickVibes',
        { category, customDescription, sunoStylesCount: sunoStyles.length },
        (runtime) => aiEngine.generateQuickVibes(category, customDescription, sunoStyles, runtime)
      );
    },
    refineQuickVibes: async (params) => {
      const { currentPrompt, currentTitle, description, feedback, category, sunoStyles } = validate(RefineQuickVibesSchema, params);

      return createHandlerRunner(
        aiEngine,
        'refineQuickVibes',
        'generate.quickVibes',
        'quickVibes',
        { feedback, category, sunoStylesCount: sunoStyles.length },
        (runtime) => aiEngine.refineQuickVibes({
          currentPrompt,
          currentTitle,
          description,
          feedback,
          category,
          sunoStyles,
        }, runtime)
      );
    },
  };
}
