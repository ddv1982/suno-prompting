import { describe, expect, mock, test } from 'bun:test';
import { createElement } from 'react';
import { act } from 'react-test-renderer';

import { useAsyncAction, useAsyncActionSafe } from '@/hooks/use-async-action';

import { renderWithAct, unmountWithAct } from '../helpers/react-test-renderer';

import type { AsyncActionResult } from '@/hooks/use-async-action';
import type { ReactElement } from 'react';
import type { ReactTestRenderer } from 'react-test-renderer';

type HookResult = AsyncActionResult<[string], string>;
type AsyncActionFn = (...args: [string]) => Promise<string>;

interface HarnessHandle {
  renderer: ReactTestRenderer;
  latest: { current: HookResult | null };
}

interface DeferredPromise<T> {
  promise: Promise<T>;
  resolve: (value: T) => void;
  reject: (error?: unknown) => void;
}

function createDeferredPromise<T>(): DeferredPromise<T> {
  let resolve!: (value: T) => void;
  let reject!: (error?: unknown) => void;

  const promise = new Promise<T>((resolvePromise, rejectPromise) => {
    resolve = resolvePromise;
    reject = rejectPromise;
  });

  return { promise, resolve, reject };
}

function renderHarness(action: AsyncActionFn, safe = false): HarnessHandle {
  const latest: { current: HookResult | null } = { current: null };

  function Harness(): ReactElement | null {
    latest.current = safe ? useAsyncActionSafe(action) : useAsyncAction(action);
    return null;
  }

  const renderer = renderWithAct(createElement(Harness));
  return { renderer, latest };
}

describe('useAsyncAction', () => {
  test('sets loading while pending and returns the resolved value', async () => {
    const deferred = createDeferredPromise<string>();
    const action = mock((_input: string) => deferred.promise) as AsyncActionFn;
    const { latest } = renderHarness(action);

    let pendingExecution!: Promise<string | undefined>;
    act(() => {
      pendingExecution = latest.current!.execute('alpha');
    });

    expect(latest.current?.isLoading).toBe(true);
    expect(latest.current?.error).toBeNull();

    let resolvedValue: string | undefined;
    await act(async () => {
      deferred.resolve('resolved-value');
      resolvedValue = await pendingExecution;
    });

    expect(resolvedValue).toBe('resolved-value');
    expect(latest.current?.isLoading).toBe(false);
    expect(latest.current?.error).toBeNull();
    expect(action).toHaveBeenCalledWith('alpha');
  });

  test('rethrows failures and clearError resets error state', async () => {
    const action = mock(async () => {
      throw new Error('operation failed');
    }) as AsyncActionFn;
    const { latest } = renderHarness(action);

    await act(async () => {
      await expect(latest.current!.execute('beta')).rejects.toThrow('operation failed');
    });

    expect(latest.current?.isLoading).toBe(false);
    expect(latest.current?.error).toContain('operation failed');

    act(() => {
      latest.current!.clearError();
    });

    expect(latest.current?.error).toBeNull();
  });
});

describe('useAsyncActionSafe', () => {
  test('captures failure in state and returns undefined without throwing', async () => {
    const action = mock(async () => {
      throw new Error('safe failure');
    }) as AsyncActionFn;
    const { latest } = renderHarness(action, true);

    let result: string | undefined;
    await act(async () => {
      result = await latest.current!.execute('gamma');
    });

    expect(result).toBeUndefined();
    expect(latest.current?.isLoading).toBe(false);
    expect(latest.current?.error).toContain('safe failure');

    act(() => {
      latest.current!.clearError();
    });

    expect(latest.current?.error).toBeNull();
  });

  test('does not attempt state updates after unmount while action is in-flight', async () => {
    const deferred = createDeferredPromise<string>();
    const action = mock((_input: string) => deferred.promise) as AsyncActionFn;
    const { renderer, latest } = renderHarness(action, true);

    let pendingExecution!: Promise<string | undefined>;
    act(() => {
      pendingExecution = latest.current!.execute('delta');
    });

    expect(latest.current?.isLoading).toBe(true);

    await unmountWithAct(renderer);

    await act(async () => {
      deferred.resolve('late-result');
      await expect(pendingExecution).resolves.toBe('late-result');
    });

    expect(action).toHaveBeenCalledWith('delta');
  });
});
