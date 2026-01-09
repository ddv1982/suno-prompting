import { createContext, useContext, useCallback, useMemo, type ReactNode } from 'react';

import { useToast } from '@/components/ui/toast';
import { useEditorContext } from '@/context/editor-context';
import { useSessionContext } from '@/context/session-context';
import { useSettingsContext } from '@/context/settings-context';
import { createLogger } from '@/lib/logger';
import { isMaxFormat, isStructuredPrompt } from '@/lib/max-format';
import { handleGenerationError, addUserMessage, buildFullPromptOriginalInput, completeSessionUpdate } from '@/lib/session-helpers';
import { api } from '@/services/rpc';
import { type DebugInfo } from '@shared/types';

import { useGenerationStateContext } from './generation-state-context';
import { useSessionOperationsContext } from './session-operations-context';

import type { StandardGenerationContextValue } from './types';
import type { ChatMessage } from '@/lib/chat-utils';

const log = createLogger('StandardGeneration');
const StandardGenerationContext = createContext<StandardGenerationContextValue | null>(null);

function shouldSkipGeneration(isGenerating: boolean, promptMode: string, hasPrompt: boolean): boolean {
  return isGenerating || (promptMode === 'quickVibes' && hasPrompt);
}

function shouldAttemptMaxConversion(isInitial: boolean, maxMode: boolean, input: string): boolean {
  return isInitial && maxMode && isStructuredPrompt(input) && !isMaxFormat(input);
}

interface ConversionCallbacks {
  createConversionSession: (o: string, c: string, v: string, d?: Partial<DebugInfo>) => Promise<void>;
  setPendingInput: (v: string) => void;
  setLyricsTopic: (v: string) => void;
  showToast: (m: string, t: 'success' | 'error') => void;
}

async function tryMaxConversion(input: string, cb: ConversionCallbacks): Promise<boolean> {
  const conv = await api.convertToMaxFormat(input).catch(() => null);
  if (!conv?.convertedPrompt || !conv.wasConverted) return false;
  await cb.createConversionSession(input, conv.convertedPrompt, conv.versionId, conv.debugInfo);
  cb.setPendingInput(''); cb.setLyricsTopic(''); cb.showToast('Converted to Max Mode format', 'success');
  return true;
}

interface GenerateParams { input: string; lockedPhrase?: string; topic?: string; genre?: string }
interface RefineParams extends GenerateParams { currentPrompt: string; currentTitle?: string; currentLyrics?: string }

async function callGenerateApi(isInitial: boolean, p: GenerateParams | RefineParams): ReturnType<typeof api.generateInitial> {
  if (isInitial) return api.generateInitial(p.input, p.lockedPhrase, p.topic, p.genre);
  const rp = p as RefineParams;
  return api.refinePrompt(rp.currentPrompt, rp.input, rp.lockedPhrase, rp.currentTitle, rp.currentLyrics, rp.topic, rp.genre);
}

function addUserMessageIfRefine(isInitial: boolean, setChatMessages: React.Dispatch<React.SetStateAction<ChatMessage[]>>, input: string): void {
  if (!isInitial) addUserMessage(setChatMessages, input);
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
  const { isGenerating, setGeneratingAction, setChatMessages, setValidation, setDebugInfo } = useGenerationStateContext();
  const { createConversionSession } = useSessionOperationsContext();

  const deps = useMemo(() => ({
    currentSession,
    generateId,
    saveSession,
    setDebugInfo,
    setChatMessages,
    setValidation,
    setGeneratingAction,
    log,
  }), [
    currentSession,
    generateId,
    saveSession,
    setDebugInfo,
    setChatMessages,
    setValidation,
    setGeneratingAction,
  ]);

  const handleGenerate = useCallback(async (input: string) => {
    if (shouldSkipGeneration(isGenerating, promptMode, !!currentSession?.currentPrompt)) return;
    const currentPrompt = currentSession?.currentPrompt || '', isInitial = !currentPrompt;
    setGeneratingAction('generate');
    try {
      addUserMessageIfRefine(isInitial, setChatMessages, input);
      if (shouldAttemptMaxConversion(isInitial, maxMode, input) && await tryMaxConversion(input, { createConversionSession, setPendingInput, setLyricsTopic, showToast })) return;
      const lockedPhrase = getEffectiveLockedPhrase(), topic = lyricsTopic?.trim() || undefined, genre = advancedSelection.seedGenres[0];
      const result = await callGenerateApi(isInitial, { input, lockedPhrase, topic, genre, currentPrompt, currentTitle: currentSession?.currentTitle, currentLyrics: currentSession?.currentLyrics });
      if (!result?.prompt) throw new Error('Invalid result received from generation');
      await completeSessionUpdate(deps, result, buildFullPromptOriginalInput(input, genre, topic), 'full', {}, 'Updated prompt generated.', isInitial ? undefined : input);
      setPendingInput(''); setLyricsTopic('');
    } catch (e: unknown) { handleGenerationError(e, 'generate prompt', setChatMessages, log); }
    finally { setGeneratingAction('none'); }
  }, [isGenerating, promptMode, currentSession, maxMode, getEffectiveLockedPhrase, lyricsTopic, advancedSelection, createConversionSession, setPendingInput, setLyricsTopic, showToast, deps, setChatMessages, setGeneratingAction]);

  const handleCopy = useCallback(() => { void navigator.clipboard.writeText(currentSession?.currentPrompt || ''); }, [currentSession?.currentPrompt]);

  const handleRemix = useCallback(async () => {
    if (isGenerating || !currentSession?.originalInput) return;
    setGeneratingAction('remix');
    try {
      const result = await api.generateInitial(currentSession.originalInput, getEffectiveLockedPhrase(), currentSession.lyricsTopic, advancedSelection.seedGenres[0]);
      if (!result?.prompt) throw new Error('Invalid result received from remix');
      await completeSessionUpdate(deps, result, currentSession.originalInput, 'full', {}, 'Remixed prompt generated.', '[remix]');
    } catch (e: unknown) { handleGenerationError(e, 'remix prompt', setChatMessages, log); }
    finally { setGeneratingAction('none'); }
  }, [isGenerating, currentSession, getEffectiveLockedPhrase, advancedSelection, deps, setChatMessages, setGeneratingAction]);

  const handleConversionComplete = useCallback(async (originalInput: string, convertedPrompt: string, versionId: string, debugInfo?: Partial<DebugInfo>) => {
    await createConversionSession(originalInput, convertedPrompt, versionId, debugInfo);
  }, [createConversionSession]);

  return <StandardGenerationContext.Provider value={{ handleGenerate, handleCopy, handleRemix, handleConversionComplete }}>{children}</StandardGenerationContext.Provider>;
}
