import { type AIEngine, type GenerationResult } from '@bun/ai';
import { createRng } from '@bun/instruments/services/random';
import { maybeCreateTraceCollector, type TraceCollector } from '@bun/trace';
import { GenerateQuickVibesSchema, RefineQuickVibesSchema } from '@shared/schemas';
import { enforceTraceSizeCap } from '@shared/trace';

import { withErrorHandling, log, type ActionMeta } from './utils';
import { validate } from './validated';

import type { RPCHandlers } from '@shared/types';
import type { TraceRunAction } from '@shared/types/trace';

type QuickVibesHandlers = Pick<RPCHandlers, 'generateQuickVibes' | 'refineQuickVibes'>;

type TraceRuntime = {
  readonly trace?: TraceCollector;
  readonly rng?: () => number;
};

function createTraceRuntime(
  aiEngine: AIEngine,
  versionId: string,
  action: TraceRunAction
): TraceRuntime {
  const enabled = aiEngine.isDebugMode();
  if (!enabled) return {};

  const seed = crypto.getRandomValues(new Uint32Array(1))[0] ?? 1;
  const rng = createRng(seed);

  const trace = maybeCreateTraceCollector(true, {
    runId: versionId,
    action,
    promptMode: 'quickVibes',
    rng: { seed, algorithm: 'mulberry32' },
  });

  return { trace, rng };
}

async function runQuickVibesAction(
  aiEngine: AIEngine,
  actionName: string,
  traceAction: TraceRunAction,
  meta: ActionMeta,
  operation: (runtime: TraceRuntime) => Promise<GenerationResult>
): Promise<{ prompt: string; title?: string; versionId: string; debugTrace?: GenerationResult['debugTrace'] }> {
  return withErrorHandling(actionName, async () => {
    const versionId = Bun.randomUUIDv7();
    const runtime = createTraceRuntime(aiEngine, versionId, traceAction);

    runtime.trace?.addRunEvent('run.start', traceAction);
    const result = await operation(runtime);
    runtime.trace?.addRunEvent('run.end', 'success');

    const debugTrace = runtime.trace ? enforceTraceSizeCap(runtime.trace.finalize()) : result.debugTrace;

    log.info(`${actionName}:result`, {
      versionId,
      promptLength: result.text.length,
      hasTitle: !!result.title
    });
    return {
      prompt: result.text,
      title: result.title,
      versionId,
      debugTrace
    };
  }, meta);
}

export function createQuickVibesHandlers(aiEngine: AIEngine): QuickVibesHandlers {
  return {
    generateQuickVibes: async (params) => {
      const { category, customDescription, withWordlessVocals, sunoStyles } = validate(GenerateQuickVibesSchema, params);

      return runQuickVibesAction(
        aiEngine,
        'generateQuickVibes',
        'generate.quickVibes',
        { category, customDescription, withWordlessVocals, sunoStylesCount: sunoStyles.length },
        (runtime) => aiEngine.generateQuickVibes(category, customDescription, withWordlessVocals, sunoStyles, runtime)
      );
    },
    refineQuickVibes: async (params) => {
      const { currentPrompt, currentTitle, description, feedback, withWordlessVocals, category, sunoStyles } = validate(RefineQuickVibesSchema, params);

      return runQuickVibesAction(
        aiEngine,
        'refineQuickVibes',
        'generate.quickVibes',
        { feedback, withWordlessVocals, category, sunoStylesCount: sunoStyles.length },
        (runtime) => aiEngine.refineQuickVibes({
          currentPrompt,
          currentTitle,
          description,
          feedback,
          withWordlessVocals,
          category,
          sunoStyles,
        }, runtime)
      );
    },
  };
}
