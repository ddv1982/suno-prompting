import { type AIEngine } from '@bun/ai';
import { convertToMaxFormat } from '@bun/prompt/max-conversion';

import { withErrorHandling, log } from './utils';

import type { RPCHandlers } from '@shared/types';

type MaxConversionHandlers = Pick<RPCHandlers, 'convertToMaxFormat'>;

export function createMaxConversionHandlers(aiEngine: AIEngine): MaxConversionHandlers {
  return {
    convertToMaxFormat: async ({ text }) => {
      return withErrorHandling('convertToMaxFormat', async () => {
        const result = await convertToMaxFormat(text, aiEngine.getModel.bind(aiEngine));
        const versionId = Bun.randomUUIDv7();
        log.info('convertToMaxFormat:result', {
          versionId,
          wasConverted: result.wasConverted,
          promptLength: result.convertedPrompt.length
        });
        return {
          convertedPrompt: result.convertedPrompt,
          wasConverted: result.wasConverted,
          versionId,
          debugInfo: result.debugInfo,
        };
      }, { textLength: text.length });
    },
  };
}
