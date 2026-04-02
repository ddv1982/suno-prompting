import { z } from 'zod';

import { runAIRequest } from '@bun/ai/request-runner';
import { createLogger } from '@shared/logger';
import { getErrorMessage } from '@shared/errors';

import type { AIRequestOptions } from '@bun/ai/request-runner';

const log = createLogger('StructuredOutput');

function stripMarkdownFence(text: string): string {
  return text.replace(/^```(?:json)?\n?|\n?```$/g, '').trim();
}

export async function generateStructuredOutput<TSchema extends z.ZodType>(options: {
  schema: TSchema;
  request: AIRequestOptions;
}): Promise<z.infer<TSchema>> {
  const raw = await runAIRequest(options.request);

  try {
    return options.schema.parse(JSON.parse(stripMarkdownFence(raw)) as unknown);
  } catch (error: unknown) {
    log.warn('generateStructuredOutput:failed', {
      error: getErrorMessage(error),
      errorContext: options.request.errorContext,
    });
    throw error;
  }
}
