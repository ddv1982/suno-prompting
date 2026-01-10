import { createLogger } from '@bun/logger';

const log = createLogger('RPC');

export type ActionMeta = Record<string, unknown>;

export async function withErrorHandling<T>(
  actionName: string,
  operation: () => Promise<T>,
  meta?: ActionMeta
): Promise<T> {
  log.info(actionName, meta);
  try {
    const result = await operation();
    log.info(`${actionName}:complete`);
    return result;
  } catch (error: unknown) {
    log.error(`${actionName}:failed`, error);
    throw error;
  }
}

export { log };
