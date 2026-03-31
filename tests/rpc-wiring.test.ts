import { afterEach, beforeEach, describe, expect, mock, test } from 'bun:test';
import { mkdtemp, rm } from 'fs/promises';
import { tmpdir } from 'os';
import { join } from 'path';

import { flushMicrotasks } from './helpers/react-test-renderer';

const setApplicationMenuMock = mock((_menu: unknown) => {});
const browserWindowMock = mock((_options: unknown) => {});

let callOrder: string[] = [];
let capturedRequests: Record<string, unknown> | null = null;
let originalHome: string | undefined;
let tempHomeDir: string | null = null;

function resetHarnessState(): void {
  callOrder = [];
  capturedRequests = null;
  setApplicationMenuMock.mockReset();
  browserWindowMock.mockReset();
}

beforeEach(async () => {
  originalHome = process.env.HOME;
  tempHomeDir = await mkdtemp(join(tmpdir(), 'suno-rpc-wiring-home-'));
  process.env.HOME = tempHomeDir;
  resetHarnessState();
});

afterEach(async () => {
  mock.restore();
  resetHarnessState();

  if (originalHome === undefined) {
    delete process.env.HOME;
  } else {
    process.env.HOME = originalHome;
  }

  if (tempHomeDir) {
    await rm(tempHomeDir, { recursive: true, force: true });
  }

  tempHomeDir = null;
});

async function loadMainIndexModule(): Promise<void> {
  const aiSpecifier = new URL('../src/bun/ai/index.ts', import.meta.url).href;

  const aiFactory = () => ({
    AIEngine: class AIEngineMock {
      initialize(_config: unknown): void {
        callOrder.push('ai.initialize');
      }
    },
  });

  await mock.module('@bun/ai', aiFactory);
  await mock.module(aiSpecifier, aiFactory);

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
      return {
        on: (_event: string, _handler: () => void) => {},
      };
    },
  }));

  const moduleUrl = new URL('../src/bun/index.ts', import.meta.url).href;
  await import(`${moduleUrl}?wiring=${Date.now()}-${Math.random()}`);

  for (let attempt = 0; attempt < 20 && !callOrder.includes('window.create'); attempt += 1) {
    await flushMicrotasks(4);
    await new Promise((resolve) => setTimeout(resolve, 0));
  }
}

describe('RPC wiring', () => {
  test('wires Story Mode endpoints and installs application menu before first BrowserWindow', async () => {
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
