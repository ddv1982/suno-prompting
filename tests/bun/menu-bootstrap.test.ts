import { afterEach, beforeEach, describe, expect, mock, test } from 'bun:test';

type TimeoutHandle = ReturnType<typeof setTimeout>;
type ScheduleTimeout = (handler: () => void, timeoutMs: number) => TimeoutHandle;
type CancelTimeout = (handle: TimeoutHandle) => void;

interface ScheduledTimer {
  id: number;
  fireAtMs: number;
  cleared: boolean;
  callback: () => void;
}

const installApplicationMenuMock = mock((_menu: unknown) => {});
const buildApplicationMenuMock = mock((appName: string) => [
  { label: appName, submenu: [{ role: 'quit' }] },
  { label: 'Edit', submenu: [{ role: 'copy' }] },
]);

let nowMs = 1_000;
let nextTimerId = 1;
let scheduledTimers: ScheduledTimer[] = [];

const mockNow = (): number => nowMs;

const setTimeoutMock: ScheduleTimeout = (callback, timeoutMs): TimeoutHandle => {
  const timer: ScheduledTimer = {
    id: nextTimerId++,
    fireAtMs: nowMs + Math.max(0, timeoutMs),
    cleared: false,
    callback: () => {
      callback();
    },
  };
  scheduledTimers.push(timer);
  return timer.id as unknown as TimeoutHandle;
};

const clearTimeoutMock: CancelTimeout = (handle): void => {
  const id = handle as unknown as number;
  const timer = scheduledTimers.find((entry) => entry.id === id);
  if (timer) timer.cleared = true;
};

function resetScheduler(): void {
  nowMs = 1_000;
  nextTimerId = 1;
  scheduledTimers = [];
}

function advanceTimeBy(deltaMs: number): void {
  if (deltaMs < 0) throw new Error('deltaMs must be >= 0');
  const target = nowMs + deltaMs;
  nowMs = target;

  while (true) {
    const due = scheduledTimers
      .filter((timer) => !timer.cleared && timer.fireAtMs <= nowMs)
      .sort((a, b) => a.fireAtMs - b.fireAtMs);

    if (due.length === 0) return;

    for (const timer of due) {
      timer.cleared = true;
      timer.callback();
    }
  }
}

async function loadMenuBootstrapModule() {
  await mock.module('@bun/menu', () => ({
    buildApplicationMenu: buildApplicationMenuMock,
    installApplicationMenu: installApplicationMenuMock,
  }));

  const moduleUrl = new URL('../../src/bun/menu-bootstrap.ts', import.meta.url).href;
  return import(`${moduleUrl}?test=${Date.now()}-${Math.random()}`);
}

beforeEach(() => {
  resetScheduler();
  installApplicationMenuMock.mockReset();
  buildApplicationMenuMock.mockReset();
  buildApplicationMenuMock.mockImplementation((appName: string) => [
    { label: appName, submenu: [{ role: 'quit' }] },
    { label: 'Edit', submenu: [{ role: 'copy' }] },
  ]);
});

afterEach(() => {
  mock.restore();
});

describe('menu bootstrap', () => {
  test('installs initial menu and runs macOS bounded retries in order', async () => {
    const { createMenuBootstrap } = await loadMenuBootstrapModule();
    const bootstrap = createMenuBootstrap('Suno Prompting App', {
      platform: 'darwin',
      now: mockNow,
      setTimeoutFn: setTimeoutMock,
      clearTimeoutFn: clearTimeoutMock,
      retryDelaysMs: [10, 20, 40],
    });

    bootstrap.installInitial();

    expect(buildApplicationMenuMock).toHaveBeenCalledTimes(1);
    expect(buildApplicationMenuMock).toHaveBeenCalledWith('Suno Prompting App');
    expect(installApplicationMenuMock).toHaveBeenCalledTimes(1);

    advanceTimeBy(9);
    expect(installApplicationMenuMock).toHaveBeenCalledTimes(1);

    advanceTimeBy(1);
    expect(installApplicationMenuMock).toHaveBeenCalledTimes(2);

    advanceTimeBy(10);
    expect(installApplicationMenuMock).toHaveBeenCalledTimes(3);

    advanceTimeBy(20);
    expect(installApplicationMenuMock).toHaveBeenCalledTimes(4);
  });

  test('non-mac path stays single-shot and does not attach focus handler', async () => {
    const { createMenuBootstrap } = await loadMenuBootstrapModule();
    const onMock = mock((_name: string, _handler: (event: unknown) => void) => {});
    const bootstrap = createMenuBootstrap('Suno Prompting App', {
      platform: 'linux',
      now: mockNow,
      setTimeoutFn: setTimeoutMock,
      clearTimeoutFn: clearTimeoutMock,
      retryDelaysMs: [10, 20, 40],
    });

    bootstrap.installInitial();
    bootstrap.attachWindow({ on: onMock } as unknown as import('electrobun/bun').BrowserWindow);

    advanceTimeBy(100);

    expect(installApplicationMenuMock).toHaveBeenCalledTimes(1);
    expect(onMock).not.toHaveBeenCalled();
  });

  test('focus-based reapply is bounded by debounce, max count, and startup window', async () => {
    const { createMenuBootstrap } = await loadMenuBootstrapModule();
    let focusHandler: (() => void) | undefined;
    const onMock = mock((name: string, handler: (event: unknown) => void) => {
      if (name === 'focus') {
        focusHandler = () => handler({});
      }
    });

    const bootstrap = createMenuBootstrap('Suno Prompting App', {
      platform: 'darwin',
      now: mockNow,
      setTimeoutFn: setTimeoutMock,
      clearTimeoutFn: clearTimeoutMock,
      retryDelaysMs: [],
      maxFocusReapplies: 2,
      focusDebounceMs: 300,
      focusReapplyWindowMs: 1_000,
    });

    bootstrap.installInitial();
    bootstrap.attachWindow({ on: onMock } as unknown as import('electrobun/bun').BrowserWindow);

    expect(focusHandler).toBeDefined();
    focusHandler?.();
    expect(installApplicationMenuMock).toHaveBeenCalledTimes(2);

    focusHandler?.();
    expect(installApplicationMenuMock).toHaveBeenCalledTimes(2);

    advanceTimeBy(300);
    focusHandler?.();
    expect(installApplicationMenuMock).toHaveBeenCalledTimes(3);

    advanceTimeBy(300);
    focusHandler?.();
    expect(installApplicationMenuMock).toHaveBeenCalledTimes(3);

    advanceTimeBy(1_001);
    focusHandler?.();
    expect(installApplicationMenuMock).toHaveBeenCalledTimes(3);
  });

  test('dispose clears pending retries', async () => {
    const { createMenuBootstrap } = await loadMenuBootstrapModule();
    const bootstrap = createMenuBootstrap('Suno Prompting App', {
      platform: 'darwin',
      now: mockNow,
      setTimeoutFn: setTimeoutMock,
      clearTimeoutFn: clearTimeoutMock,
      retryDelaysMs: [10, 20, 40],
    });

    bootstrap.installInitial();
    bootstrap.dispose();
    advanceTimeBy(100);

    expect(installApplicationMenuMock).toHaveBeenCalledTimes(1);
  });
});
