/**
 * Shared structured logger for consistent logging across the app.
 * Used by both Bun backend and React frontend.
 */

type LogData = Record<string, unknown>;
type LogLevel = 'info' | 'warn' | 'error' | 'silent';

const LOG_LEVEL_ORDER: Record<LogLevel, number> = {
  info: 0,
  warn: 1,
  error: 2,
  silent: 3,
};

export interface Logger {
  info: (action: string, data?: LogData) => void;
  warn: (action: string, data?: LogData) => void;
  error: (action: string, error: unknown, data?: LogData) => void;
}

function readEnv(key: string): string | undefined {
  if (typeof process === 'undefined') {
    return undefined;
  }
  return process.env[key];
}

function parseLogLevel(value: string | undefined): LogLevel | undefined {
  if (!value) return undefined;
  if (value === 'info' || value === 'warn' || value === 'error' || value === 'silent') {
    return value;
  }
  return undefined;
}

function defaultLogLevel(): LogLevel {
  const explicitLevel =
    parseLogLevel(readEnv('LOG_LEVEL')) ?? parseLogLevel(readEnv('TEST_LOG_LEVEL'));
  if (explicitLevel) {
    return explicitLevel;
  }

  if (readEnv('NODE_ENV') === 'test' && readEnv('VERBOSE_TEST_LOGS') !== '1') {
    return 'warn';
  }

  return 'info';
}

let currentLogLevel: LogLevel = defaultLogLevel();

function shouldLog(level: Exclude<LogLevel, 'silent'>): boolean {
  return LOG_LEVEL_ORDER[level] >= LOG_LEVEL_ORDER[currentLogLevel];
}

export function setLogLevel(level: LogLevel): void {
  currentLogLevel = level;
}

export function getLogLevel(): LogLevel {
  return currentLogLevel;
}

function formatMessage(namespace: string, action: string, data?: LogData): string {
  const prefix = `[${namespace}] ${action}`;
  if (!data || Object.keys(data).length === 0) {
    return prefix;
  }
  return `${prefix} ${JSON.stringify(data)}`;
}

// Cache for logger instances to avoid recreating them
const loggerCache = new Map<string, Logger>();

/**
 * Creates a namespaced logger instance.
 * Caches instances for reuse to avoid unnecessary object creation.
 *
 * @param namespace - The namespace/module name for log prefixing
 * @returns A logger instance with info, warn, and error methods
 *
 * @example
 * const log = createLogger('Storage');
 * log.info('save:start', { id: '123' });
 * log.error('save:failed', new Error('disk full'));
 */
export function createLogger(namespace: string): Logger {
  const cached = loggerCache.get(namespace);
  if (cached) return cached;

  const logger: Logger = {
    info(action: string, data?: LogData) {
      if (!shouldLog('info')) return;
      console.log(formatMessage(namespace, action, data));
    },
    warn(action: string, data?: LogData) {
      if (!shouldLog('warn')) return;
      console.warn(formatMessage(namespace, action, data));
    },
    error(action: string, error: unknown, data?: LogData) {
      if (!shouldLog('error')) return;
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error(formatMessage(namespace, action, { ...data, error: errorMessage }));
    },
  };

  loggerCache.set(namespace, logger);
  return logger;
}
