import { createLogger } from '@bun/logger';
import { maybeCreateTraceCollector } from '@bun/trace';
import { enforceTraceSizeCap } from '@shared/trace';
import { createSeededRng } from '@shared/utils/random';

import type { GenerationResult } from '@bun/ai';
import type { TraceRuntime } from '@bun/ai/generation/types';
import type { PromptMode, TraceRunAction } from '@shared/types';

const log = createLogger('RPC');

export type ActionMeta = Record<string, unknown>;

// Re-export TraceRuntime for backwards compatibility
export type { TraceRuntime };

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

export type HandlerResultTransformer<TResult, TReturn> = (result: TResult, runtime: TraceRuntime, versionId: string) => TReturn;

/**
 * Creates a standardized handler runner that handles common RPC handler patterns:
 * - Creates unique version ID
 * - Creates trace runtime (when debug mode enabled)
 * - Adds trace events (run.start, run.end)
 * - Enforces trace size cap
 * - Logs results
 *
 * @param aiEngine - The AI engine instance
 * @param actionName - Name of the action (for logging)
 * @param traceAction - Trace action type
 * @param promptMode - Prompt mode for trace context
 * @param meta - Additional metadata for logging
 * @param operation - The async operation to execute with runtime
 * @param transformResult - Optional function to transform the result before returning
 * @returns Promise with transformed result
 */
export async function createHandlerRunner<TResult extends GenerationResult, TReturn = Pick<GenerationResult, 'text' | 'title' | 'debugTrace' | 'storyModeFallback'> & { prompt: string; versionId: string }>(
  aiEngine: { isDebugMode: () => boolean },
  actionName: string,
  traceAction: TraceRunAction,
  promptMode: PromptMode,
  meta: ActionMeta,
  operation: (runtime: TraceRuntime) => Promise<TResult>,
  transformResult?: HandlerResultTransformer<TResult, TReturn>
): Promise<TReturn> {
  return withErrorHandling(actionName, async () => {
    const versionId = Bun.randomUUIDv7();
    const runtime = createTraceRuntime(aiEngine, versionId, traceAction, promptMode);

    runtime.trace?.addRunEvent('run.start', traceAction);
    const result = await operation(runtime);
    runtime.trace?.addRunEvent('run.end', 'success');

    const debugTrace = runtime.trace ? enforceTraceSizeCap(runtime.trace.finalize()) : result.debugTrace;

    const defaultTransform: HandlerResultTransformer<TResult, TReturn> = (result, _runtime, versionId) => {
      return {
        prompt: result.text,
        title: result.title,
        versionId,
        debugTrace,
        storyModeFallback: result.storyModeFallback,
      } as TReturn;
    };

    const transformedResult = transformResult
      ? transformResult(result, runtime, versionId)
      : defaultTransform(result, runtime, versionId);

    log.info(`${actionName}:result`, {
      versionId,
      promptLength: result.text.length,
      hasTitle: !!result.title,
      storyModeFallback: result.storyModeFallback,
    });

    return transformedResult;
  }, meta);
}

export { log };
