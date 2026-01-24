import { createLogger } from '@bun/logger';
import { maybeCreateTraceCollector, type TraceCollector } from '@bun/trace';
import { createSeededRng } from '@shared/utils/random';

import type { PromptMode, TraceRunAction } from '@shared/types';

const log = createLogger('RPC');

export type ActionMeta = Record<string, unknown>;

/**
 * Runtime context for trace collection during handler execution.
 */
export interface TraceRuntime {
  readonly trace?: TraceCollector;
  readonly rng?: () => number;
}

/**
 * Interface for objects that can report debug mode status.
 */
interface DebugModeProvider {
  isDebugMode: () => boolean;
}

/**
 * Creates a trace runtime for collecting debug information during handler execution.
 * Returns empty object when debug mode is disabled for zero overhead.
 *
 * @param provider - Object with isDebugMode method (typically AIEngine)
 * @param versionId - Unique ID for this generation run
 * @param action - The trace action type (e.g., 'generate.full', 'remix.title')
 * @param promptMode - The prompt mode context for this trace
 */
export function createTraceRuntime(
  provider: DebugModeProvider,
  versionId: string,
  action: TraceRunAction,
  promptMode: PromptMode
): TraceRuntime {
  const enabled = provider.isDebugMode();
  if (!enabled) return {};

  const seed = crypto.getRandomValues(new Uint32Array(1))[0] ?? 1;
  const rng = createSeededRng(seed);

  const trace = maybeCreateTraceCollector(true, {
    runId: versionId,
    action,
    promptMode,
    rng: { seed, algorithm: 'mulberry32' },
  });

  return { trace, rng };
}

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
