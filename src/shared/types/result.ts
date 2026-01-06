/**
 * Result type for explicit error handling without exceptions.
 * Use for operations that can fail in expected ways.
 *
 * @module shared/types/result
 */

/**
 * Represents either a successful value or an error.
 * Forces callers to handle both cases explicitly.
 *
 * Error results can optionally include a fallback value that can be used
 * when the operation fails but a default behavior is acceptable.
 *
 * @typeParam T - The type of the success value
 * @typeParam E - The type of the error (defaults to Error)
 *
 * @example
 * async function parseJson(text: string): Promise<Result<Data, string>> {
 *   try {
 *     return Ok(JSON.parse(text));
 *   } catch {
 *     return Err('Invalid JSON');
 *   }
 * }
 *
 * const result = await parseJson(input);
 * if (result.ok) {
 *   console.log(result.value);
 * } else {
 *   console.error(result.error);
 * }
 *
 * @example
 * // Using fallback for graceful degradation
 * function convertPrompt(text: string): Result<string, Error> {
 *   try {
 *     return Ok(transform(text));
 *   } catch (error) {
 *     // Return error with original text as fallback
 *     return Err(error as Error, text);
 *   }
 * }
 *
 * const result = convertPrompt(input);
 * const output = result.ok ? result.value : (result.fallback ?? input);
 */
export type Result<T, E = Error> =
  | { readonly ok: true; readonly value: T }
  | { readonly ok: false; readonly error: E; readonly fallback?: T };

/**
 * Creates a successful Result containing a value.
 */
export function Ok<T>(value: T): Result<T, never> {
  return { ok: true, value };
}

/**
 * Creates a failed Result containing an error.
 *
 * @param error - The error value
 * @param fallback - Optional fallback value to use if the caller wants to recover
 * @returns A failed Result with the error and optional fallback
 *
 * @example
 * // Error without fallback
 * const result = Err(new Error('Failed'));
 *
 * @example
 * // Error with fallback for graceful degradation
 * const result = Err(new Error('Conversion failed'), originalText);
 */
export function Err<E, T = never>(error: E, fallback?: T): Result<T, E> {
  if (fallback !== undefined) {
    return { ok: false, error, fallback };
  }
  return { ok: false, error };
}

/**
 * Type guard to check if a Result is successful.
 */
export function isOk<T, E>(result: Result<T, E>): result is { ok: true; value: T } {
  return result.ok;
}

/**
 * Type guard to check if a Result is an error.
 */
export function isErr<T, E>(result: Result<T, E>): result is { ok: false; error: E } {
  return !result.ok;
}

/**
 * Unwraps a Result, returning the value or throwing the error.
 * Use when you want to propagate errors as exceptions.
 */
export function unwrap<T, E extends Error>(result: Result<T, E>): T {
  if (result.ok) {
    return result.value;
  }
  throw result.error;
}

/**
 * Unwraps a Result, returning the value or a default.
 */
export function unwrapOr<T, E>(result: Result<T, E>, defaultValue: T): T {
  if (result.ok) {
    return result.value;
  }
  return defaultValue;
}

/**
 * Maps the value of a successful Result.
 * Note: Fallback values are not preserved through map transformations.
 */
export function map<T, U, E>(
  result: Result<T, E>,
  fn: (value: T) => U
): Result<U, E> {
  if (result.ok) {
    return Ok(fn(result.value));
  }
  // Return error without fallback since T cannot be mapped to U
  return Err(result.error);
}

/**
 * Maps the error of a failed Result.
 */
export function mapErr<T, E, F>(
  result: Result<T, E>,
  fn: (error: E) => F
): Result<T, F> {
  if (!result.ok) {
    return Err(fn(result.error));
  }
  return result;
}

/**
 * Wraps a function that may throw into one that returns a Result.
 */
export function tryCatch<T, E = Error>(
  fn: () => T,
  mapError?: (error: unknown) => E
): Result<T, E> {
  try {
    return Ok(fn());
  } catch (error) {
    if (mapError) {
      return Err(mapError(error));
    }
    return Err(error as E);
  }
}

/**
 * Wraps an async function that may throw into one that returns a Result.
 */
export async function tryCatchAsync<T, E = Error>(
  fn: () => Promise<T>,
  mapError?: (error: unknown) => E
): Promise<Result<T, E>> {
  try {
    return Ok(await fn());
  } catch (error) {
    if (mapError) {
      return Err(mapError(error));
    }
    return Err(error as E);
  }
}

// =============================================================================
// Lowercase Aliases
// =============================================================================

/**
 * Helper to create success result (lowercase alias for Ok).
 *
 * @param data - The success value
 * @returns A successful Result containing the data
 *
 * @example
 * const result = ok({ converted: true });
 */
export const ok = Ok;

/**
 * Helper to create error result with optional fallback (lowercase alias for Err).
 *
 * @param error - The error value
 * @param fallback - Optional fallback value for graceful degradation
 * @returns A failed Result with the error and optional fallback
 *
 * @example
 * const result = err(new Error('Failed'), originalValue);
 */
export const err = Err;
