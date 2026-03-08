import { afterEach, beforeEach, describe, expect, mock, test } from 'bun:test';
import { createElement } from 'react';
import { act } from 'react-test-renderer';

import { flushMicrotasks, renderWithAct } from '../helpers/react-test-renderer';
import { installGlobalModuleMocks } from '../setup';

import type { SessionContextType } from '@/context/session-context';
import type { PromptSession } from '@shared/types';
import type { ReactNode } from 'react';

type RpcResult<T> = { ok: true; value: T } | { ok: false; error: unknown };

interface RpcClientShape {
  getHistory: (params: Record<string, never>) => Promise<RpcResult<{ sessions: PromptSession[] }>>;
  saveSession: (params: { session: PromptSession }) => Promise<RpcResult<{ success: boolean }>>;
  deleteSession: (params: { id: string }) => Promise<RpcResult<{ success: boolean }>>;
}

const existingSession: PromptSession = {
  id: '0f4f1b4b-737b-4f2c-bf3f-72aa0d6bc301',
  originalInput: 'existing input',
  currentPrompt: 'existing prompt',
  versionHistory: [
    {
      id: '0f4f1b4b-737b-4f2c-bf3f-72aa0d6bc302',
      content: 'existing prompt',
      timestamp: '2026-01-01T00:00:00Z',
    },
  ],
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-01T00:00:00Z',
};

const newSession: PromptSession = {
  id: '0f4f1b4b-737b-4f2c-bf3f-72aa0d6bc303',
  originalInput: 'new input',
  currentPrompt: 'new prompt',
  versionHistory: [
    {
      id: '0f4f1b4b-737b-4f2c-bf3f-72aa0d6bc304',
      content: 'new prompt',
      timestamp: '2026-01-01T00:01:00Z',
    },
  ],
  createdAt: '2026-01-01T00:01:00Z',
  updatedAt: '2026-01-01T00:01:00Z',
};

let patchedRpcClient: RpcClientShape | null = null;
let originalGetHistory: RpcClientShape['getHistory'] | null = null;
let originalSaveSession: RpcClientShape['saveSession'] | null = null;
let originalDeleteSession: RpcClientShape['deleteSession'] | null = null;
let getHistoryResult: RpcResult<{ sessions: PromptSession[] }> = {
  ok: true,
  value: { sessions: [existingSession] },
};
let saveSessionResult: RpcResult<{ success: boolean }> = { ok: true, value: { success: true } };
let deleteSessionResult: RpcResult<{ success: boolean }> = { ok: true, value: { success: true } };

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

async function loadSessionContextModule() {
  await mockElectrobunView();

  const rpcModuleUrl = new URL('../../src/main-ui/services/rpc-client/index.ts', import.meta.url)
    .href;
  const rpcModule = await import(rpcModuleUrl);
  const rpcClient = rpcModule.rpcClient as RpcClientShape;

  patchedRpcClient = rpcClient;
  originalGetHistory = rpcClient.getHistory;
  originalSaveSession = rpcClient.saveSession;
  originalDeleteSession = rpcClient.deleteSession;

  rpcClient.getHistory = async (_params: Record<string, never>) => getHistoryResult;
  rpcClient.saveSession = async (_params: { session: PromptSession }) => saveSessionResult;
  rpcClient.deleteSession = async (_params: { id: string }) => deleteSessionResult;

  const moduleUrl = new URL('../../src/main-ui/context/session-context.tsx', import.meta.url).href;
  return import(`${moduleUrl}?session=${Date.now()}-${Math.random()}`);
}

beforeEach(async () => {
  mock.restore();
  await installGlobalModuleMocks();
  getHistoryResult = { ok: true, value: { sessions: [existingSession] } };
  saveSessionResult = { ok: true, value: { success: true } };
  deleteSessionResult = { ok: true, value: { success: true } };
});

afterEach(async () => {
  if (patchedRpcClient && originalGetHistory && originalSaveSession && originalDeleteSession) {
    patchedRpcClient.getHistory = originalGetHistory;
    patchedRpcClient.saveSession = originalSaveSession;
    patchedRpcClient.deleteSession = originalDeleteSession;
  }

  patchedRpcClient = null;
  originalGetHistory = null;
  originalSaveSession = null;
  originalDeleteSession = null;
  mock.restore();
  await installGlobalModuleMocks();
});

describe('SessionProvider RPC failures', () => {
  test('saveSession does not mutate local state when persistence fails', async () => {
    saveSessionResult = {
      ok: false,
      error: { code: 'storage_error', message: 'disk full' },
    };

    const { SessionProvider, useSessionContext } = await loadSessionContextModule();
    let latestContext: SessionContextType | null = null;
    const getContext = (): SessionContextType => {
      if (!latestContext) {
        throw new Error('Session context not initialized');
      }
      return latestContext;
    };

    function Probe(): ReactNode {
      latestContext = useSessionContext();
      return null;
    }

    renderWithAct(createElement(SessionProvider, null, createElement(Probe)));
    await flushMicrotasks(3);

    expect(getContext().sessions).toEqual([existingSession]);

    await act(async () => {
      await getContext().saveSession(newSession);
    });
    await flushMicrotasks(2);

    expect(getContext().sessions).toEqual([existingSession]);
    expect(getContext().currentSession).toBeNull();
  });

  test('deleteSession keeps local state intact when persistence fails', async () => {
    deleteSessionResult = {
      ok: false,
      error: { code: 'storage_error', message: 'permission denied' },
    };

    const { SessionProvider, useSessionContext } = await loadSessionContextModule();
    let latestContext: SessionContextType | null = null;
    const getContext = (): SessionContextType => {
      if (!latestContext) {
        throw new Error('Session context not initialized');
      }
      return latestContext;
    };

    function Probe(): ReactNode {
      latestContext = useSessionContext();
      return null;
    }

    renderWithAct(createElement(SessionProvider, null, createElement(Probe)));
    await flushMicrotasks(3);

    await act(async () => {
      getContext().setCurrentSession(existingSession);
    });

    await act(async () => {
      await getContext().deleteSession(existingSession.id);
    });
    await flushMicrotasks(2);

    expect(getContext().sessions).toEqual([existingSession]);
    expect(getContext().currentSession?.id).toBe(existingSession.id);
  });
});
