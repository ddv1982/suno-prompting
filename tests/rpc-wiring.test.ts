import { describe, expect, mock, test } from 'bun:test';

import { flushMicrotasks } from './helpers/react-test-renderer';

const setApplicationMenuMock = mock((_menu: unknown) => {});
const browserWindowMock = mock((_options: unknown) => {});

let callOrder: string[] = [];
let capturedRequests: Record<string, unknown> | null = null;

function resetHarnessState(): void {
  callOrder = [];
  capturedRequests = null;
  setApplicationMenuMock.mockReset();
  browserWindowMock.mockReset();
}

async function loadMainIndexModule(): Promise<void> {
  const aiSpecifier = new URL('../src/bun/ai/index.ts', import.meta.url).href;
  const storageSpecifier = new URL('../src/bun/storage.ts', import.meta.url).href;

  const aiFactory = () => ({
    AIEngine: class AIEngineMock {
      initialize(_config: unknown): void {
        callOrder.push('ai.initialize');
      }
    },
  });

  const storageFactory = () => ({
    StorageManager: class StorageManagerMock {
      async initialize(): Promise<void> {
        callOrder.push('storage.initialize');
      }

      async getConfig(): Promise<Record<string, unknown>> {
        callOrder.push('storage.getConfig');
        return {};
      }
    },
  });

  await mock.module('@bun/ai', aiFactory);
  await mock.module(aiSpecifier, aiFactory);
  await mock.module('@bun/storage', storageFactory);
  await mock.module(storageSpecifier, storageFactory);

  await mock.module('electrobun/bun', () => ({
    ApplicationMenu: {
      setApplicationMenu: (menu: unknown) => {
        callOrder.push('menu.install');
        setApplicationMenuMock(menu);
      },
    },
    BrowserView: {
      defineRPC: (config: { handlers: { requests: Record<string, unknown> } }) => {
        callOrder.push('rpc.define');
        capturedRequests = config.handlers.requests;
        return { request: {}, send: {} };
      },
    },
    BrowserWindow: function BrowserWindowMock(options: unknown) {
      callOrder.push('window.create');
      browserWindowMock(options);
    },
  }));

  const moduleUrl = new URL('../src/bun/index.ts', import.meta.url).href;
  await import(`${moduleUrl}?wiring=${Date.now()}-${Math.random()}`);
  await flushMicrotasks(8);
}

describe('RPC wiring', () => {
  test('wires Story Mode endpoints and installs application menu before first BrowserWindow', async () => {
    resetHarnessState();
    await loadMainIndexModule();

    expect(capturedRequests).not.toBeNull();
    expect(typeof capturedRequests?.getStoryMode).toBe('function');
    expect(typeof capturedRequests?.setStoryMode).toBe('function');

    const installIndex = callOrder.indexOf('menu.install');
    const firstWindowIndex = callOrder.indexOf('window.create');

    expect(installIndex).toBeGreaterThan(-1);
    expect(firstWindowIndex).toBeGreaterThan(-1);
    expect(installIndex).toBeLessThan(firstWindowIndex);
    expect(setApplicationMenuMock.mock.calls.length).toBeGreaterThanOrEqual(1);
    expect(browserWindowMock).toHaveBeenCalledTimes(1);
  });
});
