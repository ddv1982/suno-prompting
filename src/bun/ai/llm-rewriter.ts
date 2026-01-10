import { callLLM } from '@bun/ai/llm-utils';
import { createLogger } from '@bun/logger';
import { APP_CONSTANTS } from '@shared/constants';

import type { LanguageModel } from 'ai';

const log = createLogger('LLMRewriter');

const MAX_CHARS = APP_CONSTANTS.MAX_PROMPT_CHARS;

export async function condenseWithDedup(
  text: string,
  repeatedWords: string[],
  getModel: () => LanguageModel,
  ollamaEndpoint?: string
): Promise<string> {
  try {
    const condensed = await callLLM({
      getModel,
      systemPrompt: [
        'Rewrite the given music prompt to remove word repetition while preserving meaning and musical quality.',
        'Return ONLY the rewritten prompt text.',
        'Do NOT include explanations, meta-instructions, prefaces, or quotes.',
        'Do NOT mention repetition-removal, condensing, or "output only" in the result.',
      ].join(' '),
      userPrompt: `PROMPT_TO_REWRITE:\n<<<\n${text}\n>>>\n\nREPEATED_WORDS:\n${repeatedWords.join(', ')}`,
      errorContext: 'condense with dedup',
      ollamaEndpoint,
      maxRetries: 2,
    });
    return condensed.trim();
  } catch (error: unknown) {
    log.warn('condenseWithDedup:failed', { error: error instanceof Error ? error.message : 'Unknown error' });
    return text;
  }
}

export async function condense(
  text: string,
  getModel: () => LanguageModel,
  ollamaEndpoint?: string
): Promise<string> {
  const targetChars = MAX_CHARS - 50;

  try {
    const condensed = await callLLM({
      getModel,
      systemPrompt: [
        `Rewrite the given music prompt to be under ${targetChars} characters while preserving musical quality and key details.`,
        'Return ONLY the rewritten prompt text.',
        'Do NOT include explanations, meta-instructions, prefaces, or quotes.',
        'Do NOT mention condensing, character counts, or "output only" in the result.',
      ].join(' '),
      userPrompt: `PROMPT_TO_REWRITE:\n<<<\n${text}\n>>>`,
      errorContext: 'condense prompt',
      ollamaEndpoint,
      maxRetries: 2,
    });
    return condensed.trim();
  } catch (error: unknown) {
    log.warn('condense:failed', { error: error instanceof Error ? error.message : 'Unknown error' });
    return text;
  }
}

export async function rewriteWithoutMeta(
  text: string,
  getModel: () => LanguageModel,
  ollamaEndpoint?: string
): Promise<string> {
  try {
    const rewritten = await callLLM({
      getModel,
      systemPrompt: [
        'Rewrite the given music prompt text.',
        'Remove any meta-instructions or assistant chatter.',
        'Return ONLY the final prompt text.',
      ].join(' '),
      userPrompt: `PROMPT_TO_REWRITE:\n<<<\n${text}\n>>>`,
      errorContext: 'rewrite without meta',
      ollamaEndpoint,
      maxRetries: 1,
    });
    return rewritten.trim();
  } catch (error: unknown) {
    log.warn('rewriteWithoutMeta:failed', { error: error instanceof Error ? error.message : 'Unknown error' });
    return text;
  }
}
