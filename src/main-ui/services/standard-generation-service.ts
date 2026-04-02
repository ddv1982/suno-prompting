import { isMaxFormat } from '@shared/max-format';
import { isStructuredPrompt } from '@shared/prompt-utils';
import {
  handleGenerationError,
  addUserMessage,
  buildFullPromptOriginalInput,
  completeSessionUpdate,
} from '@/lib/session-helpers';
import { rpcClient, unwrapOrThrowResult } from '@/services/rpc-client';

import type { ChatMessage } from '@/lib/chat-utils';
import type { Logger } from '@shared/logger';
import type { RefinementType, StyleChanges, TraceRun } from '@shared/types';

function shouldAttemptMaxConversion(isInitial: boolean, maxMode: boolean, input: string): boolean {
  return isInitial && maxMode && isStructuredPrompt(input) && !isMaxFormat(input);
}

interface GenerateParams {
  input: string;
  lockedPhrase?: string;
  topic?: string;
  genre?: string;
}

interface RefineParams extends GenerateParams {
  currentPrompt: string;
  currentTitle?: string;
  currentLyrics?: string;
  refinementType?: RefinementType;
  styleChanges?: StyleChanges;
}

type ApiParams = GenerateParams & { sunoStyles?: string[] };

async function callGenerateApi(
  isInitial: boolean,
  p: ApiParams | (RefineParams & { sunoStyles?: string[] })
): Promise<{
  prompt: string;
  versionId: string;
  validation: unknown;
  debugTrace?: TraceRun;
  title?: string;
  lyrics?: string;
}> {
  if (isInitial) {
    const result = await rpcClient.generateInitial({
      description: p.input,
      lockedPhrase: p.lockedPhrase,
      lyricsTopic: p.topic,
      genreOverride: p.genre,
      sunoStyles: p.sunoStyles,
    });
    return unwrapOrThrowResult(result);
  }

  const rp = p as RefineParams & { sunoStyles?: string[] };
  const refinementType =
    rp.refinementType && rp.refinementType !== 'none' ? rp.refinementType : 'combined';
  const result = await rpcClient.refinePrompt({
    currentPrompt: rp.currentPrompt,
    feedback: rp.input || undefined,
    lockedPhrase: rp.lockedPhrase,
    currentTitle: rp.currentTitle,
    currentLyrics: rp.currentLyrics,
    lyricsTopic: rp.topic,
    genreOverride: rp.genre,
    sunoStyles: rp.sunoStyles,
    refinementType,
    styleChanges: rp.styleChanges,
  });
  return unwrapOrThrowResult(result);
}

interface GenerateContext {
  isInitial: boolean;
  currentPrompt: string;
  currentTitle?: string;
  currentLyrics?: string;
}

export interface StandardGenerationServiceDeps {
  currentSession: {
    currentPrompt?: string;
    currentTitle?: string;
    currentLyrics?: string;
    originalInput?: string;
    lyricsTopic?: string;
  } | null;
  promptMode: string;
  isGenerating: boolean;
  maxMode: boolean;
  lyricsTopic: string;
  advancedSelection: { seedGenres: string[]; sunoStyles: string[] };
  getEffectiveLockedPhrase: () => string | undefined;
  setPendingInput: (value: string) => void;
  setLyricsTopic: (value: string) => void;
  setGeneratingAction: (value: 'none' | 'generate' | 'remix') => void;
  setChatMessages: React.Dispatch<React.SetStateAction<ChatMessage[]>>;
  showToast: (message: string, type: 'success' | 'error' | 'warning') => void;
  createConversionSession: (o: string, c: string, v: string, d?: TraceRun) => Promise<void>;
  deps: Parameters<typeof completeSessionUpdate>[0];
  log: Logger;
}

function buildGenerationApiParams(
  deps: StandardGenerationServiceDeps,
  input: string,
  ctx: GenerateContext,
  refinementType?: RefinementType,
  styleChanges?: StyleChanges
): ApiParams | (RefineParams & { sunoStyles?: string[] }) {
  const lockedPhrase = deps.getEffectiveLockedPhrase();
  const topic = deps.lyricsTopic?.trim() || undefined;
  const genre = deps.advancedSelection.seedGenres[0];
  const sunoStyles =
    deps.advancedSelection.sunoStyles.length > 0 ? deps.advancedSelection.sunoStyles : undefined;

  return {
    input,
    lockedPhrase,
    topic,
    genre,
    sunoStyles,
    refinementType,
    styleChanges,
    ...ctx,
  };
}

async function executeGenerateFlow(
  deps: StandardGenerationServiceDeps,
  input: string,
  ctx: GenerateContext,
  refinementType?: RefinementType,
  styleChanges?: StyleChanges
): Promise<boolean> {
  if (!ctx.isInitial) addUserMessage(deps.setChatMessages, input);
  if (shouldAttemptMaxConversion(ctx.isInitial, deps.maxMode, input)) {
    const conversion = await rpcClient.convertToMaxFormat({ text: input });
    if (conversion.ok && conversion.value.convertedPrompt && conversion.value.wasConverted) {
      await deps.createConversionSession(
        input,
        conversion.value.convertedPrompt,
        conversion.value.versionId,
        conversion.value.debugTrace
      );
      deps.setPendingInput('');
      deps.setLyricsTopic('');
      deps.showToast('Converted to Max Mode format', 'success');
      return true;
    }
  }

  const apiParams = buildGenerationApiParams(deps, input, ctx, refinementType, styleChanges);
  const result = await callGenerateApi(ctx.isInitial, apiParams);
  if (!result?.prompt) throw new Error('Invalid result received from generation');

  const originalInput = buildFullPromptOriginalInput(input, apiParams.genre, apiParams.topic);
  await completeSessionUpdate(
    deps.deps,
    result,
    originalInput,
    'full',
    {},
    'Updated prompt generated.',
    ctx.isInitial ? undefined : input
  );
  deps.setPendingInput('');
  deps.setLyricsTopic('');
  return true;
}

async function executeRemixFlow(deps: StandardGenerationServiceDeps): Promise<void> {
  if (!deps.currentSession?.originalInput) return;

  const sunoStyles =
    deps.advancedSelection.sunoStyles.length > 0 ? deps.advancedSelection.sunoStyles : undefined;
  const result = unwrapOrThrowResult(
    await rpcClient.generateInitial({
      description: deps.currentSession.originalInput,
      lockedPhrase: deps.getEffectiveLockedPhrase(),
      lyricsTopic: deps.currentSession.lyricsTopic,
      genreOverride: deps.advancedSelection.seedGenres[0],
      sunoStyles,
    })
  );
  if (!result?.prompt) throw new Error('Invalid result received from remix');

  await completeSessionUpdate(
    deps.deps,
    result,
    deps.currentSession.originalInput,
    'full',
    {},
    'Remixed prompt generated.',
    '[remix]'
  );
}

export function createStandardGenerationService(deps: StandardGenerationServiceDeps): {
  handleGenerate: (
    input: string,
    refinementType?: RefinementType,
    styleChanges?: StyleChanges
  ) => Promise<boolean>;
  handleRemix: () => Promise<void>;
} {
  const handleGenerate = async (
    input: string,
    refinementType?: RefinementType,
    styleChanges?: StyleChanges
  ): Promise<boolean> => {
    const currentPrompt = deps.currentSession?.currentPrompt || '';
    if (deps.isGenerating || (deps.promptMode === 'quickVibes' && !!currentPrompt)) {
      return false;
    }

    const ctx: GenerateContext = {
      isInitial: !currentPrompt,
      currentPrompt,
      currentTitle: deps.currentSession?.currentTitle,
      currentLyrics: deps.currentSession?.currentLyrics,
    };
    deps.setGeneratingAction('generate');
    try {
      return await executeGenerateFlow(deps, input, ctx, refinementType, styleChanges);
    } catch (e: unknown) {
      handleGenerationError(e, 'generate prompt', deps.setChatMessages, deps.showToast, deps.log);
      return false;
    } finally {
      deps.setGeneratingAction('none');
    }
  };

  const handleRemix = async (): Promise<void> => {
    if (deps.isGenerating || !deps.currentSession?.originalInput) return;
    deps.setGeneratingAction('remix');
    try {
      await executeRemixFlow(deps);
    } catch (e: unknown) {
      handleGenerationError(e, 'remix prompt', deps.setChatMessages, deps.showToast, deps.log);
    } finally {
      deps.setGeneratingAction('none');
    }
  };

  return { handleGenerate, handleRemix };
}
