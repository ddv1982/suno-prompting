import { type AIEngine, type GenerationResult } from '@bun/ai';
import { GenerateQuickVibesSchema, RefineQuickVibesSchema } from '@shared/schemas';
import { enforceTraceSizeCap } from '@shared/trace';

import { createTraceRuntime, withErrorHandling, log, type ActionMeta, type TraceRuntime } from './utils';
import { validate } from './validated';

import type { RPCHandlers } from '@shared/types';
import type { TraceRunAction } from '@shared/types/trace';

type QuickVibesHandlers = Pick<RPCHandlers, 'generateQuickVibes' | 'refineQuickVibes'>;

async function runQuickVibesAction(
  aiEngine: AIEngine,
  actionName: string,
  traceAction: TraceRunAction,
  meta: ActionMeta,
  operation: (runtime: TraceRuntime) => Promise<GenerationResult>
): Promise<{ prompt: string; title?: string; versionId: string; debugTrace?: GenerationResult['debugTrace']; storyModeFallback?: boolean }> {
  return withErrorHandling(actionName, async () => {
    const versionId = Bun.randomUUIDv7();
    const runtime = createTraceRuntime(aiEngine, versionId, traceAction, 'quickVibes');

    runtime.trace?.addRunEvent('run.start', traceAction);
    const result = await operation(runtime);
    runtime.trace?.addRunEvent('run.end', 'success');

    const debugTrace = runtime.trace ? enforceTraceSizeCap(runtime.trace.finalize()) : result.debugTrace;

    log.info(`${actionName}:result`, {
      versionId,
      promptLength: result.text.length,
      hasTitle: !!result.title,
      storyModeFallback: result.storyModeFallback
    });
    return {
      prompt: result.text,
      title: result.title,
      versionId,
      debugTrace,
      storyModeFallback: result.storyModeFallback
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
