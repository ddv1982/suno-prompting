/**
 * Result type for explicit error handling without exceptions.
 * Use for operations that can fail in expected ways.
 */

/**
 * Represents either a successful value or an error.
 * Forces callers to handle both cases explicitly.
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
 */
export type Result<T, E = Error> =
  | { readonly ok: true; readonly value: T }
  | { readonly ok: false; readonly error: E };

/**
 * Creates a successful Result containing a value.
 */
export function Ok<T>(value: T): Result<T, never> {
  return { ok: true, value };
}

/**
 * Creates a failed Result containing an error.
 */
export function Err<E>(error: E): Result<never, E> {
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
 */
export function map<T, U, E>(
  result: Result<T, E>,
  fn: (value: T) => U
): Result<U, E> {
  if (result.ok) {
    return Ok(fn(result.value));
  }
  return result;
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
