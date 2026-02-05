import { createContext, useContext, useMemo } from 'react';

import type { ReactElement, ReactNode } from 'react';

/**
 * Context value for generation disabled state.
 * Provides a centralized boolean indicating whether controls should be disabled.
 *
 * ## autoDisable Convention
 *
 * Components that support the `autoDisable` prop follow this convention:
 *
 * - **UI primitives** (Input, Textarea, Button, Switch, Slider, Combobox, ToggleRow):
 *   `autoDisable` defaults to `false` (opt-in). These are generic building blocks
 *   that shouldn't assume context usage.
 *
 * - **Domain form components** (MoodCategoryCombobox, GenreMultiSelect, SunoStylesMultiSelect):
 *   `autoDisable` defaults to `true`. These are purpose-built for generation panels
 *   and should auto-disable when generation is in progress.
 *
 * The `useAutoDisable` hook centralizes this logic. See `@/hooks/use-auto-disable.ts`.
 */
interface GenerationDisabledContextValue {
  /** Whether controls should be disabled (generation in progress) */
  isDisabled: boolean;
}

const GenerationDisabledContext = createContext<GenerationDisabledContextValue | null>(null);

/**
 * Hook to consume the generation disabled state.
 * Returns `false` as safe default when used outside provider scope.
 *
 * @example
 * ```tsx
 * function MyControl() {
 *   const isDisabled = useGenerationDisabled();
 *   return <button disabled={isDisabled}>Click me</button>;
 * }
 * ```
 */
export function useGenerationDisabled(): boolean {
  const context = useContext(GenerationDisabledContext);
  // Returns false if not within provider (safe default)
  return context?.isDisabled ?? false;
}

/**
 * Hook to optionally consume the generation disabled context.
 * Returns `null` when used outside provider scope.
 * Useful for components that need to distinguish between being outside provider
 * vs inside provider with isDisabled=false.
 *
 * @example
 * ```tsx
 * function MyControl() {
 *   const context = useGenerationDisabledOptional();
 *   if (context === null) {
 *     // Not within provider - handle accordingly
 *   }
 *   return <button disabled={context?.isDisabled ?? false}>Click me</button>;
 * }
 * ```
 */
export function useGenerationDisabledOptional(): GenerationDisabledContextValue | null {
  return useContext(GenerationDisabledContext);
}

interface GenerationDisabledProviderProps {
  /** Whether controls should be disabled */
  isDisabled: boolean;
  /** Child components that will have access to the disabled state */
  children: ReactNode;
}

/**
 * Provider component that propagates disabled state to child components.
 * Wrap generation panels with this provider to enable automatic disabled state
 * propagation to all interactive controls.
 *
 * @example
 * ```tsx
 * function GenerationPanel({ isGenerating }: { isGenerating: boolean }) {
 *   return (
 *     <GenerationDisabledProvider isDisabled={isGenerating}>
 *       <MyControls />
 *     </GenerationDisabledProvider>
 *   );
 * }
 * ```
 */
export function GenerationDisabledProvider({
  isDisabled,
  children,
}: GenerationDisabledProviderProps): ReactElement {
  const value = useMemo(() => ({ isDisabled }), [isDisabled]);

  return (
    <GenerationDisabledContext.Provider value={value}>
      {children}
    </GenerationDisabledContext.Provider>
  );
}

export type { GenerationDisabledContextValue, GenerationDisabledProviderProps };
