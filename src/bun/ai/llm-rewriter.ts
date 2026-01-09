import { generateText, type LanguageModel } from 'ai';

import { createLogger } from '@bun/logger';
import { APP_CONSTANTS } from '@shared/constants';

const log = createLogger('LLMRewriter');

const MAX_CHARS = APP_CONSTANTS.MAX_PROMPT_CHARS;

export async function condenseWithDedup(
  text: string,
  repeatedWords: string[],
  getModel: () => LanguageModel
): Promise<string> {
  try {
    const { text: condensed } = await generateText({
      model: getModel(),
      system: [
        'Rewrite the given music prompt to remove word repetition while preserving meaning and musical quality.',
        'Return ONLY the rewritten prompt text.',
        'Do NOT include explanations, meta-instructions, prefaces, or quotes.',
        'Do NOT mention repetition-removal, condensing, or "output only" in the result.',
      ].join(' '),
      prompt: `PROMPT_TO_REWRITE:\n<<<\n${text}\n>>>\n\nREPEATED_WORDS:\n${repeatedWords.join(', ')}`,
      maxRetries: 2,
      abortSignal: AbortSignal.timeout(APP_CONSTANTS.AI.TIMEOUT_MS),
    });
    return condensed.trim();
  } catch (error: unknown) {
    log.warn('condenseWithDedup:failed', { error: error instanceof Error ? error.message : 'Unknown error' });
    return text;
  }
}

export async function condense(
  text: string,
  getModel: () => LanguageModel
): Promise<string> {
  const targetChars = MAX_CHARS - 50;

  try {
    const { text: condensed } = await generateText({
      model: getModel(),
      system: [
        `Rewrite the given music prompt to be under ${targetChars} characters while preserving musical quality and key details.`,
        'Return ONLY the rewritten prompt text.',
        'Do NOT include explanations, meta-instructions, prefaces, or quotes.',
        'Do NOT mention condensing, character counts, or "output only" in the result.',
      ].join(' '),
      prompt: `PROMPT_TO_REWRITE:\n<<<\n${text}\n>>>`,
      maxRetries: 2,
      abortSignal: AbortSignal.timeout(APP_CONSTANTS.AI.TIMEOUT_MS),
    });
    return condensed.trim();
  } catch (error: unknown) {
    log.warn('condense:failed', { error: error instanceof Error ? error.message : 'Unknown error' });
    return text;
  }
}

export async function rewriteWithoutMeta(
  text: string,
  getModel: () => LanguageModel
): Promise<string> {
  try {
    const { text: rewritten } = await generateText({
      model: getModel(),
      system: [
        'Rewrite the given music prompt text.',
        'Remove any meta-instructions or assistant chatter.',
        'Return ONLY the final prompt text.',
      ].join(' '),
      prompt: `PROMPT_TO_REWRITE:\n<<<\n${text}\n>>>`,
      maxRetries: 1,
      abortSignal: AbortSignal.timeout(APP_CONSTANTS.AI.TIMEOUT_MS),
    });
    return rewritten.trim();
  } catch (error: unknown) {
    log.warn('rewriteWithoutMeta:failed', { error: error instanceof Error ? error.message : 'Unknown error' });
    return text;
  }
}
