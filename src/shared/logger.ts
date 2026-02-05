/**
 * Shared structured logger for consistent logging across the app.
 * Used by both Bun backend and React frontend.
 */

type LogData = Record<string, unknown>;

export interface Logger {
  info: (action: string, data?: LogData) => void;
  warn: (action: string, data?: LogData) => void;
  error: (action: string, error: unknown, data?: LogData) => void;
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
      console.log(formatMessage(namespace, action, data));
    },
    warn(action: string, data?: LogData) {
      console.warn(formatMessage(namespace, action, data));
    },
    error(action: string, error: unknown, data?: LogData) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error(formatMessage(namespace, action, { ...data, error: errorMessage }));
    },
  };

  loggerCache.set(namespace, logger);
  return logger;
}
