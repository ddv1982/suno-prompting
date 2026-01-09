import { z } from 'zod';

import { ValidationError } from '@shared/errors';

/**
 * Extracts error message from Zod error.
 * Zod v4 uses issues array instead of errors.
 */
function extractZodError(error: z.ZodError): { field?: string; message: string } {
  const issues = error.issues;
  const firstIssue = issues[0];
  if (firstIssue) {
    return {
      field: firstIssue.path.join('.') || undefined,
      message: firstIssue.message,
    };
  }
  return { message: 'Validation failed' };
}

/**
 * Wraps a handler function with Zod schema validation.
 * Parses input with the schema before passing to handler.
 * Throws ValidationError on validation failure.
 */
export function validated<S extends z.ZodType, R>(
  schema: S,
  handler: (params: z.infer<S>) => Promise<R>
): (params: unknown) => Promise<R> {
  return async (params: unknown): Promise<R> => {
    try {
      const validatedParams = schema.parse(params);
      return await handler(validatedParams);
    } catch (error: unknown) {
      if (error instanceof z.ZodError) {
        const { field, message } = extractZodError(error);
        throw new ValidationError(message, field);
      }
      throw error;
    }
  };
}

/**
 * Validates input against a schema and returns the parsed result.
 * Useful for inline validation without the wrapper pattern.
 */
export function validate<S extends z.ZodType>(
  schema: S,
  input: unknown
): z.infer<S> {
  try {
    return schema.parse(input);
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      const { field, message } = extractZodError(error);
      throw new ValidationError(message, field);
    }
    throw error;
  }
}
