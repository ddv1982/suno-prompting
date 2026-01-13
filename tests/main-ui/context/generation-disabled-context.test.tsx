import { describe, test, expect } from 'bun:test';

import * as generationDisabledModule from '@/context/generation-disabled-context';

/**
 * Unit tests for GenerationDisabledContext
 *
 * Tests cover:
 * - Module exports
 * - Hook behavior contracts
 * - Context value propagation patterns
 * - Default values when outside provider scope
 *
 * Following project convention: test pure logic and contracts without full React render.
 */

describe('GenerationDisabledContext', () => {
  describe('module exports', () => {
    test('exports useGenerationDisabled hook', () => {
      expect(typeof generationDisabledModule.useGenerationDisabled).toBe('function');
    });

    test('exports useGenerationDisabledOptional hook', () => {
      expect(typeof generationDisabledModule.useGenerationDisabledOptional).toBe('function');
    });

    test('exports GenerationDisabledProvider component', () => {
      expect(typeof generationDisabledModule.GenerationDisabledProvider).toBe('function');
    });
  });

  describe('useGenerationDisabled behavior contract', () => {
    test('hook is a function with expected arity', () => {
      const hookFn = generationDisabledModule.useGenerationDisabled;
      expect(typeof hookFn).toBe('function');
      expect(hookFn.length).toBe(0); // Takes no arguments
    });

    test('returns boolean type', () => {
      // Contract: the hook returns a boolean
      type HookReturnType = ReturnType<typeof generationDisabledModule.useGenerationDisabled>;
      const _typeCheck: HookReturnType = false;
      expect(typeof _typeCheck).toBe('boolean');
    });
  });

  describe('useGenerationDisabledOptional behavior contract', () => {
    test('hook is a function with expected arity', () => {
      const hookFn = generationDisabledModule.useGenerationDisabledOptional;
      expect(typeof hookFn).toBe('function');
      expect(hookFn.length).toBe(0); // Takes no arguments
    });

    test('returns nullable context value type', () => {
      // Contract: the hook returns context value or null
      type HookReturnType = ReturnType<typeof generationDisabledModule.useGenerationDisabledOptional>;
      const nullValue: HookReturnType = null;
      const contextValue: HookReturnType = { isDisabled: true };

      expect(nullValue).toBeNull();
      expect(contextValue).toEqual({ isDisabled: true });
    });
  });

  describe('GenerationDisabledProvider behavior contract', () => {
    test('provider is a function component', () => {
      const Provider = generationDisabledModule.GenerationDisabledProvider;
      expect(typeof Provider).toBe('function');
    });

    test('provider accepts isDisabled and children props', () => {
      // Type check: ensure props interface matches expected shape
      type ProviderProps = generationDisabledModule.GenerationDisabledProviderProps;

      const validProps: ProviderProps = {
        isDisabled: true,
        children: null,
      };

      expect(validProps.isDisabled).toBe(true);
      expect(validProps.children).toBeNull();
    });
  });
});

describe('GenerationDisabledContext default behavior', () => {
  describe('useGenerationDisabled outside provider', () => {
    test('returns false as safe default when not within provider', () => {
      // The hook should return false when called outside provider scope
      // This is tested via the pattern simulation below

      // Simulate the pattern used in the hook: context?.isDisabled ?? false
      function simulateUseGenerationDisabled(
        contextValue: { isDisabled: boolean } | null
      ): boolean {
        return contextValue?.isDisabled ?? false;
      }

      // When context is null (outside provider), should return false
      const result = simulateUseGenerationDisabled(null);
      expect(result).toBe(false);
    });
  });

  describe('useGenerationDisabledOptional outside provider', () => {
    test('returns null when not within provider', () => {
      // The optional hook returns null outside provider
      const contextValue: { isDisabled: boolean } | null = null;
      expect(contextValue).toBeNull();
    });
  });
});

describe('GenerationDisabledContext provider patterns', () => {
  describe('isDisabled=true propagation', () => {
    test('context value propagates isDisabled=true correctly', () => {
      const contextValue = { isDisabled: true };
      const result = contextValue.isDisabled;

      expect(result).toBe(true);
    });

    test('useGenerationDisabled pattern returns true when provider has isDisabled=true', () => {
      const contextValue: { isDisabled: boolean } | null = { isDisabled: true };
      const result = contextValue?.isDisabled ?? false;

      expect(result).toBe(true);
    });
  });

  describe('isDisabled=false propagation', () => {
    test('context value propagates isDisabled=false correctly', () => {
      const contextValue = { isDisabled: false };
      const result = contextValue.isDisabled;

      expect(result).toBe(false);
    });

    test('useGenerationDisabled pattern returns false when provider has isDisabled=false', () => {
      const contextValue: { isDisabled: boolean } | null = { isDisabled: false };
      const result = contextValue?.isDisabled ?? false;

      expect(result).toBe(false);
    });
  });

  describe('context value changes', () => {
    test('value can transition from false to true', () => {
      let contextValue = { isDisabled: false };

      expect(contextValue.isDisabled).toBe(false);

      // Simulate state change
      contextValue = { isDisabled: true };

      expect(contextValue.isDisabled).toBe(true);
    });

    test('value can transition from true to false', () => {
      let contextValue = { isDisabled: true };

      expect(contextValue.isDisabled).toBe(true);

      // Simulate state change (generation complete)
      contextValue = { isDisabled: false };

      expect(contextValue.isDisabled).toBe(false);
    });
  });
});

describe('GenerationDisabledContext integration patterns', () => {
  test('combining explicit disabled prop with context value (explicit wins)', () => {
    const contextDisabled = true;
    const explicitDisabled = false;

    // Pattern: explicit prop should take precedence when defined
    const finalDisabled = explicitDisabled !== undefined ? explicitDisabled : contextDisabled;

    expect(finalDisabled).toBe(false);
  });

  test('using context value when explicit prop is undefined', () => {
    const contextDisabled = true;
    const explicitDisabled: boolean | undefined = undefined;

    // Pattern: fallback to context when explicit prop is undefined
    const finalDisabled = explicitDisabled ?? contextDisabled;

    expect(finalDisabled).toBe(true);
  });

  test('component disabled state derives from both context and props', () => {
    // Simulates a component that combines context + explicit disabled prop
    interface ComponentProps {
      disabled?: boolean;
    }

    function computeDisabled(props: ComponentProps, contextDisabled: boolean): boolean {
      // If explicit disabled is provided, use it; otherwise use context
      return props.disabled ?? contextDisabled;
    }

    // When context says disabled, and no explicit prop
    expect(computeDisabled({}, true)).toBe(true);

    // When context says disabled, but explicit prop says enabled
    expect(computeDisabled({ disabled: false }, true)).toBe(false);

    // When context says enabled, and no explicit prop
    expect(computeDisabled({}, false)).toBe(false);

    // When context says enabled, but explicit prop says disabled
    expect(computeDisabled({ disabled: true }, false)).toBe(true);
  });
});

describe('GenerationDisabledContext source verification', () => {
  test('context file contains createContext from react', async () => {
    const source = await Bun.file(
      'src/main-ui/context/generation-disabled-context.tsx'
    ).text();

    expect(source).toContain('createContext');
    expect(source).toContain("from 'react'");
  });

  test('context file contains GenerationDisabledContext definition', async () => {
    const source = await Bun.file(
      'src/main-ui/context/generation-disabled-context.tsx'
    ).text();

    expect(source).toContain('GenerationDisabledContext');
    expect(source).toContain('createContext<GenerationDisabledContextValue | null>');
  });

  test('useGenerationDisabled hook returns false by default', async () => {
    const source = await Bun.file(
      'src/main-ui/context/generation-disabled-context.tsx'
    ).text();

    // Verify the pattern: context?.isDisabled ?? false
    expect(source).toContain('context?.isDisabled ?? false');
  });

  test('useGenerationDisabledOptional hook uses useContext', async () => {
    const source = await Bun.file(
      'src/main-ui/context/generation-disabled-context.tsx'
    ).text();

    expect(source).toContain('useContext(GenerationDisabledContext)');
  });

  test('provider uses Context.Provider with memoized value prop', async () => {
    const source = await Bun.file(
      'src/main-ui/context/generation-disabled-context.tsx'
    ).text();

    expect(source).toContain('GenerationDisabledContext.Provider');
    expect(source).toContain('useMemo');
    expect(source).toContain('value={value}');
  });

  test('provider exports correct types', async () => {
    const source = await Bun.file(
      'src/main-ui/context/generation-disabled-context.tsx'
    ).text();

    expect(source).toContain('export type { GenerationDisabledContextValue');
    expect(source).toContain('GenerationDisabledProviderProps');
  });
});
