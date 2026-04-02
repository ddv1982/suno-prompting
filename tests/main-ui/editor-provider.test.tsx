import { afterEach, beforeEach, describe, expect, mock, test } from 'bun:test';
import { createElement } from 'react';
import { act } from 'react-test-renderer';

import { flushMicrotasks, renderWithAct } from '../helpers/react-test-renderer';
import { installGlobalModuleMocks } from '../setup';

import type { EditorContextType } from '@/context/editor';
import type { ReactNode } from 'react';

type RpcResult<T> = { ok: true; value: T } | { ok: false; error: { message: string } };

interface Deferred<T> {
  promise: Promise<T>;
  reject: (reason?: unknown) => void;
  resolve: (value: T | PromiseLike<T>) => void;
}

interface RpcClientShape {
  getPromptMode: (params: Record<string, never>) => Promise<RpcResult<{ promptMode: string }>>;
  setPromptMode: (params: { promptMode: string }) => Promise<RpcResult<{ success: boolean }>>;
  getCreativeBoostMode: (
    params: Record<string, never>
  ) => Promise<RpcResult<{ creativeBoostMode: string }>>;
  setCreativeBoostMode: (params: {
    creativeBoostMode: string;
  }) => Promise<RpcResult<{ success: boolean }>>;
}

let patchedRpcClient: RpcClientShape | null = null;
let originalGetPromptMode: RpcClientShape['getPromptMode'] | null = null;
let originalSetPromptMode: RpcClientShape['setPromptMode'] | null = null;
let originalGetCreativeBoostMode: RpcClientShape['getCreativeBoostMode'] | null = null;
let originalSetCreativeBoostMode: RpcClientShape['setCreativeBoostMode'] | null = null;

function createDeferred<T>(): Deferred<T> {
  let resolve!: Deferred<T>['resolve'];
  let reject!: Deferred<T>['reject'];
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

async function mockElectrobunView(): Promise<void> {
  await mock.module('electrobun/view', () => ({
    Electroview: Object.assign(
      function ElectroviewMock(_config: unknown) {
        void _config;
      },
      {
        defineRPC() {
          return {
            request: async () => ({}),
            send: () => {},
          };
        },
      }
    ),
  }));
}

async function loadEditorModule() {
  await mockElectrobunView();

  const rpcModuleUrl = new URL('../../src/main-ui/services/rpc-client/index.ts', import.meta.url)
    .href;
  const rpcModule = await import(rpcModuleUrl);
  const rpcClient = rpcModule.rpcClient as RpcClientShape;

  patchedRpcClient = rpcClient;
  originalGetPromptMode = rpcClient.getPromptMode;
  originalSetPromptMode = rpcClient.setPromptMode;
  originalGetCreativeBoostMode = rpcClient.getCreativeBoostMode;
  originalSetCreativeBoostMode = rpcClient.setCreativeBoostMode;

  rpcClient.getPromptMode = async () => ({ ok: true, value: { promptMode: 'full' } });
  rpcClient.setPromptMode = async () => ({ ok: true, value: { success: true } });
  rpcClient.getCreativeBoostMode = async () => ({
    ok: true,
    value: { creativeBoostMode: 'simple' },
  });
  rpcClient.setCreativeBoostMode = async () => ({ ok: true, value: { success: true } });

  const moduleUrl = new URL('../../src/main-ui/context/editor/index.ts', import.meta.url).href;
  return import(`${moduleUrl}?editor=${Date.now()}-${Math.random()}`);
}

beforeEach(async () => {
  mock.restore();
  await installGlobalModuleMocks();
});

afterEach(async () => {
  if (
    patchedRpcClient &&
    originalGetPromptMode &&
    originalSetPromptMode &&
    originalGetCreativeBoostMode &&
    originalSetCreativeBoostMode
  ) {
    patchedRpcClient.getPromptMode = originalGetPromptMode;
    patchedRpcClient.setPromptMode = originalSetPromptMode;
    patchedRpcClient.getCreativeBoostMode = originalGetCreativeBoostMode;
    patchedRpcClient.setCreativeBoostMode = originalSetCreativeBoostMode;
  }

  patchedRpcClient = null;
  originalGetPromptMode = null;
  originalSetPromptMode = null;
  originalGetCreativeBoostMode = null;
  originalSetCreativeBoostMode = null;
  mock.restore();
  await installGlobalModuleMocks();
});

describe('EditorProvider stale RPC protection', () => {
  test('older prompt mode failure does not overwrite a newer successful selection', async () => {
    const firstRequest = createDeferred<RpcResult<{ success: boolean }>>();
    const secondRequest = createDeferred<RpcResult<{ success: boolean }>>();
    let setPromptModeCalls = 0;

    const { EditorProvider, useEditorContext } = await loadEditorModule();
    if (!patchedRpcClient) {
      throw new Error('RPC client not patched');
    }

    patchedRpcClient.setPromptMode = async () => {
      setPromptModeCalls += 1;
      return setPromptModeCalls === 1 ? firstRequest.promise : secondRequest.promise;
    };

    let latestContext: EditorContextType | null = null;
    const getContext = (): EditorContextType => {
      if (!latestContext) throw new Error('Editor context not initialized');
      return latestContext;
    };

    function Probe(): ReactNode {
      latestContext = useEditorContext();
      return null;
    }

    renderWithAct(createElement(EditorProvider, null, createElement(Probe)));
    await flushMicrotasks(3);

    act(() => {
      getContext().setPromptMode('quickVibes');
      getContext().setPromptMode('creativeBoost');
    });

    await act(async () => {
      secondRequest.resolve({ ok: true, value: { success: true } });
    });
    await flushMicrotasks(2);

    expect(getContext().promptMode).toBe('creativeBoost');

    await act(async () => {
      firstRequest.resolve({ ok: false, error: { message: 'stale failure' } });
    });
    await flushMicrotasks(2);

    expect(getContext().promptMode).toBe('creativeBoost');
  });

  test('older creative boost mode failure does not overwrite a newer successful selection', async () => {
    const firstRequest = createDeferred<RpcResult<{ success: boolean }>>();
    const secondRequest = createDeferred<RpcResult<{ success: boolean }>>();
    let setCreativeBoostModeCalls = 0;

    const { EditorProvider, useEditorContext } = await loadEditorModule();
    if (!patchedRpcClient) {
      throw new Error('RPC client not patched');
    }

    patchedRpcClient.setCreativeBoostMode = async () => {
      setCreativeBoostModeCalls += 1;
      return setCreativeBoostModeCalls === 1 ? firstRequest.promise : secondRequest.promise;
    };

    let latestContext: EditorContextType | null = null;
    const getContext = (): EditorContextType => {
      if (!latestContext) throw new Error('Editor context not initialized');
      return latestContext;
    };

    function Probe(): ReactNode {
      latestContext = useEditorContext();
      return null;
    }

    renderWithAct(createElement(EditorProvider, null, createElement(Probe)));
    await flushMicrotasks(3);

    act(() => {
      getContext().setCreativeBoostMode('advanced');
      getContext().setCreativeBoostMode('simple');
    });

    await act(async () => {
      secondRequest.resolve({ ok: true, value: { success: true } });
    });
    await flushMicrotasks(2);

    expect(getContext().creativeBoostMode).toBe('simple');

    await act(async () => {
      firstRequest.resolve({ ok: false, error: { message: 'stale failure' } });
    });
    await flushMicrotasks(2);

    expect(getContext().creativeBoostMode).toBe('simple');
  });
});
