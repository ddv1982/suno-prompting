import { useGenerationDisabled } from '@/context/generation-disabled-context';

/**
 * Hook to compute the effective disabled state for components that support autoDisable.
 *
 * This centralizes the disabled state logic:
 * - Explicit `disabled={true}` always wins (component-specific disable like isDirectMode)
 * - If `autoDisable` is true, uses the GenerationDisabledProvider context
 * - Otherwise uses the disabled prop value
 *
 * Note: `disabled={false}` does NOT override autoDisable context. This allows
 * components to pass `disabled={isDirectMode}` while still respecting the
 * generation/LLM availability state from context.
 *
 * @param disabled - Explicit disabled prop from component
 * @param autoDisable - Whether to use context-based disabling
 * @returns The effective disabled state
 *
 * @example
 * ```tsx
 * function MyInput({ disabled, autoDisable = false }: Props) {
 *   const isDisabled = useAutoDisable(disabled, autoDisable);
 *   return <input disabled={isDisabled} />;
 * }
 * ```
 */
export function useAutoDisable(disabled: boolean | undefined, autoDisable: boolean): boolean {
  const contextDisabled = useGenerationDisabled();

  // Explicit disabled=true always wins
  if (disabled === true) return true;

  // If autoDisable, use context
  if (autoDisable) return contextDisabled;

  // Otherwise use disabled prop (false or undefined → false)
  return disabled ?? false;
}
