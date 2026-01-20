/**
 * Utility for intentional fire-and-forget promise execution.
 * Makes the intent explicit and provides consistent error logging.
 *
 * Use this instead of `void promise.catch(...)` pattern to clearly
 * signal that the promise result is intentionally ignored.
 *
 * @module shared/fire-and-forget
 */

import { createLogger } from '@shared/logger';

const log = createLogger('FireAndForget');

/**
 * Execute a promise without awaiting, logging any errors.
 * Use for non-critical operations where failure is acceptable
 * (e.g., persisting UI preferences, analytics, etc.).
 *
 * @param promise - The promise to execute
 * @param context - Context string for error logging (e.g., 'setPromptMode')
 *
 * @example
 * // Instead of:
 * void rpcClient.setPromptMode({ promptMode }).catch(e => log.error('failed', e));
 *
 * // Use:
 * fireAndForget(rpcClient.setPromptMode({ promptMode }), 'setPromptMode');
 */
export function fireAndForget(promise: Promise<unknown>, context: string): void {
  promise.catch((error: unknown) => {
    log.error(`${context}:failed`, error);
  });
}
