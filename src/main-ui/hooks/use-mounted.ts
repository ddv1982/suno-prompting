import { useEffect, useRef } from 'react';

/**
 * Track whether the component is currently mounted.
 * Useful for preventing state updates after component unmounts.
 *
 * @returns A ref that is true while mounted, false after unmount
 *
 * @example
 * ```typescript
 * const mountedRef = useMounted();
 *
 * const fetchData = async () => {
 *   const data = await api.fetch();
 *   if (mountedRef.current) {
 *     setState(data); // Only update if still mounted
 *   }
 * };
 * ```
 */
export function useMounted(): { readonly current: boolean } {
  const mountedRef = useRef(true);

  useEffect(() => {
    return () => {
      // Type assertion needed as we're modifying it internally
      (mountedRef as { current: boolean }).current = false;
    };
  }, []);

  return mountedRef;
}
