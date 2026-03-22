import { isMaxFormat, isStructuredPrompt } from '@/lib/max-format';
import {
  handleGenerationError,
  addUserMessage,
  buildFullPromptOriginalInput,
  completeSessionUpdate,
} from '@/lib/session-helpers';
import { rpcClient, unwrapOrThrowResult } from '@/services/rpc-client';

import type { ChatMessage } from '@/lib/chat-utils';
import type { Logger } from '@/lib/logger';
import type { RefinementType, StyleChanges, TraceRun } from '@shared/types';

function shouldSkipGeneration(
  isGenerating: boolean,
  promptMode: string,
  hasPrompt: boolean
): boolean {
  return isGenerating || (promptMode === 'quickVibes' && hasPrompt);
}

function shouldAttemptMaxConversion(isInitial: boolean, maxMode: boolean, input: string): boolean {
  return isInitial && maxMode && isStructuredPrompt(input) && !isMaxFormat(input);
}

interface ConversionCallbacks {
  createConversionSession: (o: string, c: string, v: string, d?: TraceRun) => Promise<void>;
  setPendingInput: (v: string) => void;
  setLyricsTopic: (v: string) => void;
  showToast: (m: string, t: 'success' | 'error') => void;
}

async function tryMaxConversion(input: string, cb: ConversionCallbacks): Promise<boolean> {
  const conv = await rpcClient.convertToMaxFormat({ text: input });
  if (!conv.ok) return false;
  if (!conv.value.convertedPrompt || !conv.value.wasConverted) return false;
  await cb.createConversionSession(
    input,
    conv.value.convertedPrompt,
    conv.value.versionId,
    conv.value.debugTrace
  );
  cb.setPendingInput('');
  cb.setLyricsTopic('');
  cb.showToast('Converted to Max Mode format', 'success');
  return true;
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

function addUserMessageIfRefine(
  isInitial: boolean,
  setChatMessages: React.Dispatch<React.SetStateAction<ChatMessage[]>>,
  input: string
): void {
  if (!isInitial) addUserMessage(setChatMessages, input);
}

interface GenerateContext {
  isInitial: boolean;
  currentPrompt: string;
  currentTitle?: string;
  currentLyrics?: string;
}

function buildGenerateContext(
  currentSession: { currentPrompt?: string; currentTitle?: string; currentLyrics?: string } | null
): GenerateContext {
  const currentPrompt = currentSession?.currentPrompt || '';
  return {
    isInitial: !currentPrompt,
    currentPrompt,
    currentTitle: currentSession?.currentTitle,
    currentLyrics: currentSession?.currentLyrics,
  };
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
  addUserMessageIfRefine(ctx.isInitial, deps.setChatMessages, input);
  const conversionCallbacks = {
    createConversionSession: deps.createConversionSession,
    setPendingInput: deps.setPendingInput,
    setLyricsTopic: deps.setLyricsTopic,
    showToast: deps.showToast,
  };
  if (
    shouldAttemptMaxConversion(ctx.isInitial, deps.maxMode, input) &&
    (await tryMaxConversion(input, conversionCallbacks))
  ) {
    return true;
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
    if (
      shouldSkipGeneration(deps.isGenerating, deps.promptMode, !!deps.currentSession?.currentPrompt)
    ) {
      return false;
    }

    const ctx = buildGenerateContext(deps.currentSession);
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
