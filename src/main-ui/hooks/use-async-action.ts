import { useState, useCallback } from 'react';

import { useMounted } from '@/hooks/use-mounted';
import { getErrorMessage } from '@shared/errors';

/**
 * Result type for useAsyncAction hook.
 * Provides loading state, error handling, and an execute function.
 */
export interface AsyncActionResult<TArgs extends unknown[], TReturn> {
  /** Whether the action is currently executing */
  isLoading: boolean;
  /** Error message if the last execution failed, null otherwise */
  error: string | null;
  /** Execute the async action */
  execute: (...args: TArgs) => Promise<TReturn | undefined>;
  /** Clear the current error state */
  clearError: () => void;
}

/**
 * Hook for managing async operations with loading and error states.
 * Provides consistent error handling and loading state management.
 *
 * @param action - The async function to execute
 * @returns Object with loading state, error, execute function, and clearError
 *
 * @example
 * ```typescript
 * const { isLoading, error, execute, clearError } = useAsyncAction(
 *   async (userId: string) => {
 *     const result = await api.fetchUser(userId);
 *     return result;
 *   }
 * );
 *
 * // Execute the action
 * const user = await execute('123');
 *
 * // In JSX
 * {isLoading && <Spinner />}
 * {error && <ErrorMessage message={error} onDismiss={clearError} />}
 * ```
 */
export function useAsyncAction<TArgs extends unknown[], TReturn>(
  action: (...args: TArgs) => Promise<TReturn>
): AsyncActionResult<TArgs, TReturn> {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Track if component is mounted to prevent state updates after unmount
  const mountedRef = useMounted();

  const execute = useCallback(async (...args: TArgs): Promise<TReturn | undefined> => {
    setIsLoading(true);
    setError(null);
    
    try {
      const result = await action(...args);
      if (mountedRef.current) {
        setIsLoading(false);
      }
      return result;
    } catch (e: unknown) {
      const message = getErrorMessage(e, 'An unexpected error occurred');
      if (mountedRef.current) {
        setError(message);
        setIsLoading(false);
      }
      throw e;
    }
  }, [action, mountedRef]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    isLoading,
    error,
    execute,
    clearError,
  };
}

/**
 * Variant of useAsyncAction that doesn't re-throw errors.
 * Useful when you want to handle errors purely through the error state.
 *
 * @param action - The async function to execute
 * @returns Object with loading state, error, execute function, and clearError
 *
 * @example
 * ```typescript
 * const { isLoading, error, execute } = useAsyncActionSafe(
 *   async () => {
 *     const result = await api.dangerousOperation();
 *     return result;
 *   }
 * );
 *
 * // Execute without try/catch - errors are captured in error state
 * await execute();
 * if (error) {
 *   console.log('Operation failed:', error);
 * }
 * ```
 */
export function useAsyncActionSafe<TArgs extends unknown[], TReturn>(
  action: (...args: TArgs) => Promise<TReturn>
): AsyncActionResult<TArgs, TReturn> {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const mountedRef = useMounted();

  const execute = useCallback(async (...args: TArgs): Promise<TReturn | undefined> => {
    setIsLoading(true);
    setError(null);
    
    try {
      const result = await action(...args);
      if (mountedRef.current) {
        setIsLoading(false);
      }
      return result;
    } catch (e: unknown) {
      const message = getErrorMessage(e, 'An unexpected error occurred');
      if (mountedRef.current) {
        setError(message);
        setIsLoading(false);
      }
      return undefined;
    }
  }, [action, mountedRef]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    isLoading,
    error,
    execute,
    clearError,
  };
}
