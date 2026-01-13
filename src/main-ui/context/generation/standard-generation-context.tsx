import { createContext, useContext, useCallback, useMemo, type ReactNode } from 'react';

import { useToast } from '@/components/ui/toast';
import { useEditorContext } from '@/context/editor-context';
import { useSessionContext } from '@/context/session-context';
import { useSettingsContext } from '@/context/settings-context';
import { createLogger } from '@/lib/logger';
import { isMaxFormat, isStructuredPrompt } from '@/lib/max-format';
import { handleGenerationError, addUserMessage, buildFullPromptOriginalInput, completeSessionUpdate } from '@/lib/session-helpers';
import { rpcClient, type RpcError } from '@/services/rpc-client';
import { type RefinementType, type StyleChanges, type TraceRun } from '@shared/types';

import { useGenerationStateContext } from './generation-state-context';
import { useSessionOperationsContext } from './session-operations-context';

import type { StandardGenerationContextValue } from './types';
import type { ChatMessage } from '@/lib/chat-utils';

const log = createLogger('StandardGeneration');
const StandardGenerationContext = createContext<StandardGenerationContextValue | null>(null);

function formatRpcError(error: RpcError): string {
  return error.message;
}

function shouldSkipGeneration(isGenerating: boolean, promptMode: string, hasPrompt: boolean): boolean {
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
  await cb.createConversionSession(input, conv.value.convertedPrompt, conv.value.versionId, conv.value.debugTrace);
  cb.setPendingInput(''); cb.setLyricsTopic(''); cb.showToast('Converted to Max Mode format', 'success');
  return true;
}

interface GenerateParams { input: string; lockedPhrase?: string; topic?: string; genre?: string }
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
): Promise<{ prompt: string; versionId: string; validation: unknown; debugTrace?: TraceRun; title?: string; lyrics?: string }> {
  if (isInitial) {
    return rpcClient.generateInitial({
      description: p.input,
      lockedPhrase: p.lockedPhrase,
      lyricsTopic: p.topic,
      genreOverride: p.genre,
      sunoStyles: p.sunoStyles,
    }).then((r) => {
      if (!r.ok) throw new Error(formatRpcError(r.error));
      return r.value;
    });
  }
  const rp = p as RefineParams & { sunoStyles?: string[] };
  // Determine refinement type for API call:
  // - 'none' is frontend-only (button disabled state) and should never reach here normally
  // - Default to 'combined' for backwards compatibility and as a safety fallback
  const refinementType = (rp.refinementType && rp.refinementType !== 'none') ? rp.refinementType : 'combined';
  return rpcClient.refinePrompt({
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
  }).then((r) => {
    if (!r.ok) throw new Error(formatRpcError(r.error));
    return r.value;
  });
}

function addUserMessageIfRefine(isInitial: boolean, setChatMessages: React.Dispatch<React.SetStateAction<ChatMessage[]>>, input: string): void {
  if (!isInitial) addUserMessage(setChatMessages, input);
}

interface GenerateContext {
  isInitial: boolean;
  currentPrompt: string;
  currentTitle?: string;
  currentLyrics?: string;
}

function buildGenerateContext(currentSession: { currentPrompt?: string; currentTitle?: string; currentLyrics?: string } | null): GenerateContext {
  const currentPrompt = currentSession?.currentPrompt || '';
  return {
    isInitial: !currentPrompt,
    currentPrompt,
    currentTitle: currentSession?.currentTitle,
    currentLyrics: currentSession?.currentLyrics,
  };
}

export function useStandardGenerationContext(): StandardGenerationContextValue {
  const ctx = useContext(StandardGenerationContext);
  if (!ctx) throw new Error('useStandardGenerationContext must be used within StandardGenerationProvider');
  return ctx;
}

export function StandardGenerationProvider({ children }: { children: ReactNode }): ReactNode {
  const { currentSession, saveSession, generateId } = useSessionContext();
  const { getEffectiveLockedPhrase, setPendingInput, lyricsTopic, setLyricsTopic, advancedSelection, promptMode } = useEditorContext();
  const { maxMode } = useSettingsContext();
  const { showToast } = useToast();
  const { isGenerating, setGeneratingAction, setChatMessages, setValidation, setDebugTrace } = useGenerationStateContext();
  const { createConversionSession } = useSessionOperationsContext();

  const deps = useMemo(() => ({
    currentSession,
    generateId,
    saveSession,
    setDebugTrace,
    setChatMessages,
    setValidation,
    setGeneratingAction,
    showToast,
    log,
  }), [
    currentSession,
    generateId,
    saveSession,
    setDebugTrace,
    setChatMessages,
    setValidation,
    setGeneratingAction,
    showToast,
  ]);

  const handleGenerate = useCallback(async (input: string, refinementType?: RefinementType, styleChanges?: StyleChanges): Promise<boolean> => {
    if (shouldSkipGeneration(isGenerating, promptMode, !!currentSession?.currentPrompt)) return false;
    const ctx = buildGenerateContext(currentSession);
    setGeneratingAction('generate');
    try {
      addUserMessageIfRefine(ctx.isInitial, setChatMessages, input);
      const conversionCallbacks = { createConversionSession, setPendingInput, setLyricsTopic, showToast };
      if (shouldAttemptMaxConversion(ctx.isInitial, maxMode, input) && await tryMaxConversion(input, conversionCallbacks)) return true;
      const lockedPhrase = getEffectiveLockedPhrase();
      const topic = lyricsTopic?.trim() || undefined;
      const genre = advancedSelection.seedGenres[0];
      const sunoStyles = advancedSelection.sunoStyles.length > 0 ? advancedSelection.sunoStyles : undefined;
      // Include refinementType and styleChanges for refine mode
      const apiParams = { input, lockedPhrase, topic, genre, sunoStyles, refinementType, styleChanges, ...ctx };
      const result = await callGenerateApi(ctx.isInitial, apiParams);
      if (!result?.prompt) throw new Error('Invalid result received from generation');
      const originalInput = buildFullPromptOriginalInput(input, genre, topic);
      await completeSessionUpdate(deps, result, originalInput, 'full', {}, 'Updated prompt generated.', ctx.isInitial ? undefined : input);
      setPendingInput(''); setLyricsTopic('');
      return true;
    } catch (e: unknown) { handleGenerationError(e, 'generate prompt', setChatMessages, showToast, log); return false; }
    finally { setGeneratingAction('none'); }
  }, [isGenerating, promptMode, currentSession, maxMode, getEffectiveLockedPhrase, lyricsTopic, advancedSelection, createConversionSession, setPendingInput, setLyricsTopic, showToast, deps, setChatMessages, setGeneratingAction]);

  const handleCopy = useCallback(() => { void navigator.clipboard.writeText(currentSession?.currentPrompt || ''); }, [currentSession?.currentPrompt]);

  const handleRemix = useCallback(async () => {
    if (isGenerating || !currentSession?.originalInput) return;
    setGeneratingAction('remix');
    try {
      const sunoStyles = advancedSelection.sunoStyles.length > 0 ? advancedSelection.sunoStyles : undefined;
      const result = await rpcClient.generateInitial({
        description: currentSession.originalInput,
        lockedPhrase: getEffectiveLockedPhrase(),
        lyricsTopic: currentSession.lyricsTopic,
        genreOverride: advancedSelection.seedGenres[0],
        sunoStyles,
      }).then((r) => {
        if (!r.ok) throw new Error(formatRpcError(r.error));
        return r.value;
      });
      if (!result?.prompt) throw new Error('Invalid result received from remix');
      await completeSessionUpdate(deps, result, currentSession.originalInput, 'full', {}, 'Remixed prompt generated.', '[remix]');
    } catch (e: unknown) { handleGenerationError(e, 'remix prompt', setChatMessages, showToast, log); }
    finally { setGeneratingAction('none'); }
  }, [isGenerating, currentSession, getEffectiveLockedPhrase, advancedSelection, deps, setChatMessages, showToast, setGeneratingAction]);

  const handleConversionComplete = useCallback(async (originalInput: string, convertedPrompt: string, versionId: string, debugTrace?: TraceRun) => {
    await createConversionSession(originalInput, convertedPrompt, versionId, debugTrace);
  }, [createConversionSession]);

  return <StandardGenerationContext.Provider value={{ handleGenerate, handleCopy, handleRemix, handleConversionComplete }}>{children}</StandardGenerationContext.Provider>;
}
