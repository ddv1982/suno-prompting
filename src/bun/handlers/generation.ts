import { type AIEngine, type GenerationResult } from '@bun/ai';
import { GenerateInitialSchema, RefinePromptSchema } from '@shared/schemas';
import { enforceTraceSizeCap } from '@shared/trace';
import { validatePrompt } from '@shared/validation';

import { createTraceRuntime, withErrorHandling, log, type ActionMeta, type TraceRuntime } from './utils';
import { validate } from './validated';
import { validateSunoStylesLimit, validateGenreStylesMutualExclusivity } from './validation';

import type { RPCHandlers } from '@shared/types';

type GenerationHandlers = Pick<RPCHandlers, 'generateInitial' | 'refinePrompt'>;

async function runAndValidate(
  aiEngine: AIEngine,
  action: 'generateInitial' | 'refinePrompt',
  meta: ActionMeta,
  operation: (runtime: TraceRuntime) => Promise<GenerationResult>
): Promise<{ prompt: string; title?: string; lyrics?: string; versionId: string; validation: ReturnType<typeof validatePrompt>; debugTrace?: GenerationResult['debugTrace'] }> {
  return withErrorHandling(action, async () => {
    const versionId = Bun.randomUUIDv7();

    const traceAction = action === 'generateInitial' ? 'generate.full' : 'refine';
    const runtime = createTraceRuntime(aiEngine, versionId, traceAction, 'full');

    runtime.trace?.addRunEvent('run.start', traceAction);
    const result = await operation(runtime);
    runtime.trace?.addRunEvent('run.end', 'success');

    const debugTrace = runtime.trace ? enforceTraceSizeCap(runtime.trace.finalize()) : undefined;
    const validation = validatePrompt(result.text);
    log.info(`${action}:result`, { versionId, isValid: validation.isValid, promptLength: result.text.length });
    return {
      prompt: result.text,
      title: result.title,
      lyrics: result.lyrics,
      versionId,
      validation,
      debugTrace,
    };
  }, meta);
}

export function createGenerationHandlers(aiEngine: AIEngine): GenerationHandlers {
  return {
    generateInitial: async (params) => {
      const { description, lockedPhrase, lyricsTopic, genreOverride, sunoStyles = [] } = validate(GenerateInitialSchema, params);
      
      // Validate Suno styles limit
      validateSunoStylesLimit(sunoStyles);
      
      // Validate mutual exclusivity: genreOverride and sunoStyles cannot both be present
      if (genreOverride && sunoStyles.length > 0) {
        validateGenreStylesMutualExclusivity([genreOverride], sunoStyles);
      }
      
      return runAndValidate(aiEngine, 'generateInitial', { description, genreOverride, sunoStylesCount: sunoStyles.length }, (runtime) =>
        aiEngine.generateInitial({ description, lockedPhrase, lyricsTopic, genreOverride, sunoStyles }, runtime)
      );
    },
    refinePrompt: async (params) => {
      const {
        currentPrompt,
        feedback = '',
        lockedPhrase,
        currentTitle,
        currentLyrics,
        lyricsTopic,
        genreOverride,
        sunoStyles = [],
        refinementType,
        styleChanges,
      } = validate(RefinePromptSchema, params);
      
      // Validate Suno styles limit
      validateSunoStylesLimit(sunoStyles);
      
      // Validate mutual exclusivity: genreOverride and sunoStyles cannot both be present
      if (genreOverride && sunoStyles.length > 0) {
        validateGenreStylesMutualExclusivity([genreOverride], sunoStyles);
      }
      
      return runAndValidate(aiEngine, 'refinePrompt', { feedback, sunoStylesCount: sunoStyles.length, refinementType }, (runtime) =>
        aiEngine.refinePrompt({
          currentPrompt,
          currentTitle: currentTitle ?? 'Untitled',
          feedback,
          currentLyrics,
          lockedPhrase,
          lyricsTopic,
          genreOverride,
          sunoStyles,
          refinementType,
          styleChanges,
        }, runtime)
      );
    },
  };
}
