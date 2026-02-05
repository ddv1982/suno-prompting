/**
 * Creative Boost Length Enforcement
 *
 * Character limit enforcement utilities.
 *
 * @module ai/creative-boost/helpers/length
 */

import { condense } from '@bun/ai/llm-rewriter';
import { createLogger } from '@bun/logger';
import { enforceLengthLimit } from '@bun/prompt/postprocess';
import { APP_CONSTANTS } from '@shared/constants';

import type { LanguageModel } from 'ai';

const log = createLogger('CreativeBoostHelpers');
const MAX_CHARS = APP_CONSTANTS.MAX_PROMPT_CHARS;

/**
 * Enforces max character limit on prompt text.
 * Condenses text using LLM if it exceeds the limit.
 */
export async function enforceMaxLength(
  text: string,
  getModel: () => LanguageModel,
  ollamaEndpoint?: string
): Promise<string> {
  if (text.length <= MAX_CHARS) {
    return text;
  }
  log.info('enforceMaxLength:processing', { originalLength: text.length, maxChars: MAX_CHARS });
  const result = await enforceLengthLimit(text, MAX_CHARS, (t) =>
    condense(t, getModel, ollamaEndpoint)
  );
  if (result.length < text.length) {
    log.info('enforceMaxLength:reduced', { newLength: result.length });
  }
  return result;
}
