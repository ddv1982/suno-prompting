import { createLogger } from '@bun/logger';
import { buildApplicationMenu, installApplicationMenu } from '@bun/menu';

import type { BrowserWindow } from 'electrobun/bun';

const log = createLogger('MenuBootstrap');

type InstallReason = 'initial' | 'retry' | 'focus';
type TimeoutHandle = ReturnType<typeof setTimeout>;
type ScheduleTimeout = (handler: () => void, timeoutMs: number) => TimeoutHandle;
type CancelTimeout = (handle: TimeoutHandle) => void;

export interface MenuBootstrap {
  installInitial(): void;
  attachWindow(window: BrowserWindow): void;
  dispose(): void;
}

const RETRY_DELAYS_MS = [75, 200, 500, 1200] as const;
const FOCUS_REAPPLY_WINDOW_MS = 60_000;
const MAX_FOCUS_REAPPLIES = 6;
const FOCUS_DEBOUNCE_MS = 300;

interface MenuBootstrapOptions {
  platform?: NodeJS.Platform;
  now?: () => number;
  setTimeoutFn?: ScheduleTimeout;
  clearTimeoutFn?: CancelTimeout;
  retryDelaysMs?: readonly number[];
  focusReapplyWindowMs?: number;
  maxFocusReapplies?: number;
  focusDebounceMs?: number;
}

interface FocusReapplyCheck {
  isMacOS: boolean;
  isDisposed: boolean;
  now: number;
  createdAt: number;
  focusReapplyWindowMs: number;
  focusReapplyCount: number;
  maxFocusReapplies: number;
  sinceLastInstallMs: number;
  focusDebounceMs: number;
}

interface MenuBootstrapRuntimeConfig {
  getNow: () => number;
  scheduleTimeout: ScheduleTimeout;
  cancelTimeout: CancelTimeout;
  retryDelaysMs: readonly number[];
  focusReapplyWindowMs: number;
  maxFocusReapplies: number;
  focusDebounceMs: number;
  isMacOS: boolean;
}

function resolveRuntimeConfig(options: MenuBootstrapOptions): MenuBootstrapRuntimeConfig {
  const getNow = options.now ?? Date.now;
  const scheduleTimeout: ScheduleTimeout =
    options.setTimeoutFn ??
    ((handler: () => void, timeoutMs: number) => setTimeout(handler, timeoutMs));
  const cancelTimeout: CancelTimeout =
    options.clearTimeoutFn ??
    ((handle: TimeoutHandle) => {
      clearTimeout(handle);
    });

  return {
    getNow,
    scheduleTimeout,
    cancelTimeout,
    retryDelaysMs: options.retryDelaysMs ?? RETRY_DELAYS_MS,
    focusReapplyWindowMs: options.focusReapplyWindowMs ?? FOCUS_REAPPLY_WINDOW_MS,
    maxFocusReapplies: options.maxFocusReapplies ?? MAX_FOCUS_REAPPLIES,
    focusDebounceMs: options.focusDebounceMs ?? FOCUS_DEBOUNCE_MS,
    isMacOS: (options.platform ?? process.platform) === 'darwin',
  };
}

function canRunFocusReapply(check: FocusReapplyCheck): boolean {
  if (!check.isMacOS || check.isDisposed) return false;

  const elapsedMs = check.now - check.createdAt;
  if (elapsedMs > check.focusReapplyWindowMs) {
    log.info('menu:focus:ignored', { reason: 'outside-window', elapsedMs });
    return false;
  }

  if (check.focusReapplyCount >= check.maxFocusReapplies) {
    log.info('menu:focus:ignored', {
      reason: 'max-reached',
      focusReapplyCount: check.focusReapplyCount,
      elapsedMs,
    });
    return false;
  }

  if (check.sinceLastInstallMs < check.focusDebounceMs) {
    log.info('menu:focus:ignored', {
      reason: 'debounced',
      sinceLastInstallMs: check.sinceLastInstallMs,
      elapsedMs,
    });
    return false;
  }

  return true;
}

export function createMenuBootstrap(
  appName: string,
  options: MenuBootstrapOptions = {}
): MenuBootstrap {
  const menu = buildApplicationMenu(appName);
  const {
    getNow,
    scheduleTimeout,
    cancelTimeout,
    retryDelaysMs,
    focusReapplyWindowMs,
    maxFocusReapplies,
    focusDebounceMs,
    isMacOS,
  } = resolveRuntimeConfig(options);
  const createdAt = getNow();

  const retryTimers = new Set<TimeoutHandle>();

  let isDisposed = false;
  let initialInstalled = false;
  let windowAttached = false;
  let installInFlight = false;
  let focusReapplyCount = 0;
  let lastFocusInstallAt = Number.NEGATIVE_INFINITY;

  const cleanupTimer = (timer: TimeoutHandle): void => {
    cancelTimeout(timer);
    retryTimers.delete(timer);
  };

  const runInstallAttempt = (reason: InstallReason, index?: number): void => {
    if (isDisposed) return;
    if (installInFlight) {
      log.warn('menu:install:skipped', { reason, index, cause: 'in-flight' });
      return;
    }

    installInFlight = true;
    const elapsedMs = getNow() - createdAt;
    log.info('menu:install:attempt', { reason, index, elapsedMs });

    try {
      installApplicationMenu(menu);
      log.info('menu:install:success', { reason, index, elapsedMs });
    } catch (error: unknown) {
      log.error('menu:install:failed', error, { reason, index, elapsedMs });
    } finally {
      installInFlight = false;
    }
  };

  const installFromFocus = (): void => {
    const now = getNow();
    const sinceLastInstallMs = now - lastFocusInstallAt;
    if (
      !canRunFocusReapply({
        isMacOS,
        isDisposed,
        now,
        createdAt,
        focusReapplyWindowMs,
        focusReapplyCount,
        maxFocusReapplies,
        sinceLastInstallMs,
        focusDebounceMs,
      })
    ) {
      return;
    }

    focusReapplyCount += 1;
    lastFocusInstallAt = now;
    runInstallAttempt('focus', focusReapplyCount);
  };

  return {
    installInitial(): void {
      if (initialInstalled || isDisposed) return;

      initialInstalled = true;
      runInstallAttempt('initial');

      if (!isMacOS) return;

      retryDelaysMs.forEach((delayMs, idx) => {
        const timer = scheduleTimeout(() => {
          retryTimers.delete(timer);
          runInstallAttempt('retry', idx + 1);
        }, delayMs);
        retryTimers.add(timer);
      });
    },

    attachWindow(window: BrowserWindow): void {
      if (!isMacOS || isDisposed || windowAttached) return;
      windowAttached = true;
      window.on('focus', () => {
        installFromFocus();
      });
      log.info('menu:focus:attached');
    },

    dispose(): void {
      if (isDisposed) return;

      isDisposed = true;
      for (const timer of retryTimers) {
        cleanupTimer(timer);
      }
      retryTimers.clear();
      log.info('menu:bootstrap:disposed');
    },
  };
}
