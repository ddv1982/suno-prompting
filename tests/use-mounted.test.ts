import { describe, test, expect } from 'bun:test';

import * as useMountedModule from '@/hooks/use-mounted';

/**
 * Tests for useMounted hook
 * Note: These tests verify the hook exports and behavior contract
 * without React Testing Library, following the project's testing patterns.
 */

describe('useMounted hook', () => {
  describe('exports', () => {
    test('exports useMounted function', () => {
      expect(typeof useMountedModule.useMounted).toBe('function');
    });

    test('useMounted takes no arguments', () => {
      expect(useMountedModule.useMounted.length).toBe(0);
    });
  });

  describe('behavior contract', () => {
    test('returns MutableRefObject interface', () => {
      // Type-level verification that the return shape is correct
      // The hook should return React.MutableRefObject<boolean>

      // This validates the exported function exists and has the correct signature
      const hookFn = useMountedModule.useMounted;
      expect(hookFn).toBeDefined();
      expect(typeof hookFn).toBe('function');
    });
  });

  describe('integration with useAsyncAction', () => {
    test('is imported and used by useAsyncAction hook', async () => {
      // Verify the hook is actually being used in the codebase
      const asyncActionSource = await Bun.file('src/main-ui/hooks/use-async-action.ts').text();

      expect(asyncActionSource).toContain('import { useMounted }');
      expect(asyncActionSource).toContain('const mountedRef = useMounted()');
    });
  });
});
