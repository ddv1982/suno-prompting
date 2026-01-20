import { useState, useEffect } from 'react';

/**
 * Hook that debounces a value, returning the debounced value after the specified delay.
 * Useful for expensive computations or API calls that shouldn't run on every keystroke.
 *
 * @param value - The value to debounce
 * @param delay - The delay in milliseconds (default: 300ms)
 * @returns The debounced value
 *
 * @example
 * ```typescript
 * const [searchQuery, setSearchQuery] = useState('');
 * const debouncedQuery = useDebounce(searchQuery, 300);
 *
 * // Validation runs on debounced value
 * const validation = useMemo(
 *   () => validatePrompt(debouncedQuery),
 *   [debouncedQuery]
 * );
 *
 * // Check if currently debouncing
 * const isDebouncing = searchQuery !== debouncedQuery;
 * ```
 */
export function useDebounce<T>(value: T, delay = 300): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(timer);
    };
  }, [value, delay]);

  return debouncedValue;
}

/**
 * Hook that returns both the debounced value and a flag indicating if debouncing is in progress.
 * Useful when you need to show a loading indicator while waiting for debounce.
 *
 * @param value - The value to debounce
 * @param delay - The delay in milliseconds (default: 300ms)
 * @returns Object with debouncedValue and isDebouncing flag
 *
 * @example
 * ```typescript
 * const { debouncedValue, isDebouncing } = useDebouncedValue(input, 300);
 *
 * return (
 *   <>
 *     <Input value={input} onChange={setInput} />
 *     {isDebouncing && <Spinner size="sm" />}
 *     <ValidationResult input={debouncedValue} />
 *   </>
 * );
 * ```
 */
export function useDebouncedValue<T>(value: T, delay = 300): {
  debouncedValue: T;
  isDebouncing: boolean;
} {
  const debouncedValue = useDebounce(value, delay);

  return {
    debouncedValue,
    isDebouncing: value !== debouncedValue,
  };
}
