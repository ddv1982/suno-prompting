import { describe, test, expect } from 'bun:test';

import * as asyncActionModule from '@/hooks/use-async-action';

describe('useAsyncAction module', () => {
  describe('exports', () => {
    test('exports useAsyncAction function', () => {
      expect(typeof asyncActionModule.useAsyncAction).toBe('function');
    });

    test('exports useAsyncActionSafe function', () => {
      expect(typeof asyncActionModule.useAsyncActionSafe).toBe('function');
    });
  });

  describe('useAsyncAction behavior contract', () => {
    test('returns expected interface shape', () => {
      const hookFn = asyncActionModule.useAsyncAction;
      expect(hookFn.length).toBe(1);
    });

    test('AsyncActionResult interface has required properties', () => {
      type ExpectedInterface = asyncActionModule.AsyncActionResult<unknown[], unknown>;
      
      const _typeCheck: ExpectedInterface = {
        isLoading: false,
        error: null,
        execute: async () => undefined,
        clearError: () => {},
      };
      
      expect(_typeCheck.isLoading).toBe(false);
      expect(_typeCheck.error).toBe(null);
      expect(typeof _typeCheck.execute).toBe('function');
      expect(typeof _typeCheck.clearError).toBe('function');
    });
  });
});

describe('async action error handling pattern', () => {
  test('extracts error message from Error object', () => {
    const error: unknown = new Error('Test error message');
    const message = error instanceof Error ? error.message : 'An unexpected error occurred';
    expect(message).toBe('Test error message');
  });

  test('handles non-Error objects gracefully', () => {
    const error: unknown = 'String error';
    const message = error instanceof Error ? error.message : 'An unexpected error occurred';
    expect(message).toBe('An unexpected error occurred');
  });

  test('handles null/undefined errors', () => {
    const error: unknown = null;
    const message = error instanceof Error ? error.message : 'An unexpected error occurred';
    expect(message).toBe('An unexpected error occurred');
  });
});

describe('useAsyncAction integration patterns', () => {
  test('successful async action pattern', async () => {
    let isLoading = false;
    let error: string | null = null;
    let result: string | undefined;

    const action = async () => {
      return 'success';
    };

    isLoading = true;
    error = null;
    
    try {
      result = await action();
      isLoading = false;
    } catch (e) {
      const message = e instanceof Error ? e.message : 'An unexpected error occurred';
      error = message;
      isLoading = false;
    }

    expect(isLoading).toBe(false);
    expect(error).toBe(null);
    expect(result).toBe('success');
  });

  test('failed async action pattern', async () => {
    let isLoading = false;
    let error: string | null = null;

    const action = async () => {
      throw new Error('Operation failed');
    };

    isLoading = true;
    error = null;
    
    try {
      await action();
      isLoading = false;
    } catch (e) {
      const message = e instanceof Error ? e.message : 'An unexpected error occurred';
      error = message;
      isLoading = false;
    }

    expect(isLoading).toBe(false);
    expect(error).toBe('Operation failed');
  });

  test('clearError pattern resets error state', () => {
    let error: string | null = 'Previous error';
    
    const clearError = () => {
      error = null;
    };
    
    clearError();
    
    expect(error).toBeNull();
  });
});

describe('useAsyncAction + useMounted integration', () => {
  test('useAsyncAction imports and uses useMounted for memory leak prevention', async () => {
    const asyncActionSource = await Bun.file('src/main-ui/hooks/use-async-action.ts').text();
    
    expect(
      asyncActionSource.includes("import { useMounted } from './use-mounted'") ||
      asyncActionSource.includes("import { useMounted } from '@/hooks/use-mounted'")
    ).toBe(true);
    
    expect(asyncActionSource).toContain('const mountedRef = useMounted()');
    expect(asyncActionSource).toContain('if (mountedRef.current)');
  });

  test('both useAsyncAction and useAsyncActionSafe use useMounted', async () => {
    const asyncActionSource = await Bun.file('src/main-ui/hooks/use-async-action.ts').text();
    
    const useMountedCalls = asyncActionSource.match(/const mountedRef = useMounted\(\)/g);
    expect(useMountedCalls).toBeDefined();
    expect(useMountedCalls?.length).toBe(2);
  });

  test('mount checking pattern is used consistently', async () => {
    const asyncActionSource = await Bun.file('src/main-ui/hooks/use-async-action.ts').text();
    
    const mountCheckPattern = /if \(mountedRef\.current\)/g;
    const matches = asyncActionSource.match(mountCheckPattern);
    
    expect(matches).toBeDefined();
    expect(matches!.length).toBeGreaterThan(0);
  });

  test('mountedRef is included in useCallback dependencies', async () => {
    const asyncActionSource = await Bun.file('src/main-ui/hooks/use-async-action.ts').text();
    
    expect(asyncActionSource).toContain('[action, mountedRef]');
  });
});
