/**
 * Unit tests for useOptimisticGeneration hook.
 * Tests module exports and integration patterns.
 *
 * @module tests/unit/hooks/use-optimistic-generation
 */
import { describe, expect, test } from 'bun:test';

import { useOptimisticGeneration } from '@/hooks/use-optimistic-generation';

describe('useOptimisticGeneration module', () => {
  test('exports useOptimisticGeneration function', () => {
    expect(typeof useOptimisticGeneration).toBe('function');
  });
});

describe('Integration with GenerationActionDeps', () => {
  test('optimistic methods are optional in GenerationActionDeps', async () => {
    // Read the source file to verify the type contract
    const source = await Bun.file('src/main-ui/hooks/use-generation-action.ts').text();

    // Verify the types are marked as optional (with ?)
    expect(source).toContain('startOptimistic?: (action: GeneratingAction) => void');
    expect(source).toContain('completeOptimistic?: () => void');
    expect(source).toContain('errorOptimistic?: () => void');
  });

  test('execute function calls optimistic methods with optional chaining', async () => {
    const source = await Bun.file('src/main-ui/hooks/use-generation-action.ts').text();

    // Verify optional chaining is used
    expect(source).toContain('startOptimistic?.(action)');
    expect(source).toContain('completeOptimistic?.()');
    expect(source).toContain('errorOptimistic?.()');
  });
});

describe('Integration with GenerationStateProvider', () => {
  test('generation state context includes optimistic state', async () => {
    const source = await Bun.file('src/main-ui/context/generation/generation-state-context.tsx').text();

    // Verify optimistic state is included
    expect(source).toContain('useOptimisticGeneration');
    expect(source).toContain('isOptimistic: optimistic.isOptimistic');
    expect(source).toContain('showSkeleton: optimistic.showSkeleton');
    expect(source).toContain('startOptimistic: optimistic.startOptimistic');
    expect(source).toContain('completeOptimistic: optimistic.completeOptimistic');
    expect(source).toContain('errorOptimistic: optimistic.errorOptimistic');
  });

  test('context types include optimistic properties', async () => {
    const source = await Bun.file('src/main-ui/context/generation/types.ts').text();

    // Verify types include optimistic properties
    expect(source).toContain('isOptimistic: boolean');
    expect(source).toContain('showSkeleton: boolean');
    expect(source).toContain('startOptimistic: (action: GeneratingAction) => void');
    expect(source).toContain('completeOptimistic: () => void');
    expect(source).toContain('errorOptimistic: () => void');
  });
});
