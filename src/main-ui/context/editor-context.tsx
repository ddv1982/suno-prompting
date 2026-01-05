import { createContext, useContext, useState, useCallback, useMemo, useEffect, useRef, type ReactNode } from 'react';

import { createLogger } from '@/lib/logger';
import { api } from '@/services/rpc';
import { buildMusicPhrase } from '@shared/music-phrase';
import { type EditorMode, type AdvancedSelection, type QuickVibesInput, type PromptMode, type CreativeBoostInput, type CreativeBoostMode, EMPTY_ADVANCED_SELECTION, EMPTY_CREATIVE_BOOST_INPUT } from '@shared/types';

const log = createLogger('Editor');
const EMPTY_QUICK_VIBES_INPUT: QuickVibesInput = { category: null, customDescription: '', withWordlessVocals: false, sunoStyles: [] };

type NullableAdvancedField = 'harmonicStyle' | 'harmonicCombination' | 'polyrhythmCombination' | 'timeSignature' | 'timeSignatureJourney';
const MUTUALLY_EXCLUSIVE_FIELDS: [NullableAdvancedField, NullableAdvancedField][] = [
  ['harmonicStyle', 'harmonicCombination'],
  ['timeSignature', 'timeSignatureJourney'],
];

export interface EditorContextType {
  editorMode: EditorMode;
  promptMode: PromptMode;
  creativeBoostMode: CreativeBoostMode;
  advancedSelection: AdvancedSelection;
  lockedPhrase: string;
  pendingInput: string;
  lyricsTopic: string;
  computedMusicPhrase: string;
  quickVibesInput: QuickVibesInput;
  getQuickVibesInput: () => QuickVibesInput;
  withWordlessVocals: boolean;
  creativeBoostInput: CreativeBoostInput;
  setEditorMode: (mode: EditorMode) => void;
  setPromptMode: (mode: PromptMode) => void;
  setCreativeBoostMode: (mode: CreativeBoostMode) => void;
  setAdvancedSelection: (selection: AdvancedSelection) => void;
  updateAdvancedSelection: (updates: Partial<AdvancedSelection>) => void;
  clearAdvancedSelection: () => void;
  setLockedPhrase: (phrase: string) => void;
  setPendingInput: (input: string) => void;
  setLyricsTopic: (topic: string) => void;
  setQuickVibesInput: (input: QuickVibesInput) => void;
  setWithWordlessVocals: (value: boolean) => void;
  setCreativeBoostInput: (input: CreativeBoostInput) => void;
  updateCreativeBoostInput: (updates: Partial<CreativeBoostInput>) => void;
  resetCreativeBoostInput: () => void;
  getEffectiveLockedPhrase: () => string | undefined;
  resetEditor: () => void;
  resetQuickVibesInput: () => void;
}

const EditorContext = createContext<EditorContextType | null>(null);

export const useEditorContext = (): EditorContextType => {
  const context = useContext(EditorContext);
  if (!context) throw new Error('useEditorContext must be used within EditorProvider');
  return context;
};

export const EditorProvider = ({ children }: { children: ReactNode }): ReactNode => {
  const [editorMode, setEditorMode] = useState<EditorMode>('simple');
  const [promptMode, setPromptModeState] = useState<PromptMode>('full');
  const [creativeBoostMode, setCreativeBoostModeState] = useState<CreativeBoostMode>('simple');
  const [advancedSelection, setAdvancedSelection] = useState<AdvancedSelection>(EMPTY_ADVANCED_SELECTION);
  const [lockedPhrase, setLockedPhrase] = useState("");
  const [pendingInput, setPendingInput] = useState("");
  const [lyricsTopic, setLyricsTopic] = useState("");
  const [quickVibesInput, setQuickVibesInputState] = useState<QuickVibesInput>(EMPTY_QUICK_VIBES_INPUT);
  const quickVibesInputRef = useRef<QuickVibesInput>(EMPTY_QUICK_VIBES_INPUT);
  const [withWordlessVocals, setWithWordlessVocals] = useState(false);
  const [creativeBoostInput, setCreativeBoostInput] = useState<CreativeBoostInput>(EMPTY_CREATIVE_BOOST_INPUT);

  const setQuickVibesInput = useCallback((input: QuickVibesInput) => {
    quickVibesInputRef.current = input;
    setQuickVibesInputState(input);
  }, []);

  const getQuickVibesInput = useCallback((): QuickVibesInput => quickVibesInputRef.current, []);

  // Load persisted modes on mount
  useEffect(() => {
    void api.getPromptMode().then(setPromptModeState).catch((e: unknown) => { log.error("loadPromptMode:failed", e); });
    void api.getCreativeBoostMode().then(setCreativeBoostModeState).catch((e: unknown) => { log.error("loadCreativeBoostMode:failed", e); });
  }, []);

  // Fire-and-forget save setters (no rollback needed for UI preferences)
  const setPromptMode = useCallback((mode: PromptMode) => {
    setPromptModeState(mode);
    void api.setPromptMode(mode).catch((e: unknown) => { log.error("setPromptMode:failed", e); });
  }, []);
  const setCreativeBoostMode = useCallback((mode: CreativeBoostMode) => {
    setCreativeBoostModeState(mode);
    void api.setCreativeBoostMode(mode).catch((e: unknown) => { log.error("setCreativeBoostMode:failed", e); });
  }, []);

  const computedMusicPhrase = useMemo(() => buildMusicPhrase(advancedSelection), [advancedSelection]);

  const updateAdvancedSelection = useCallback((updates: Partial<AdvancedSelection>) => {
    setAdvancedSelection(prev => {
      const next = { ...prev, ...updates };
      for (const [fieldA, fieldB] of MUTUALLY_EXCLUSIVE_FIELDS) {
        if (updates[fieldA] !== undefined && updates[fieldA] !== null) next[fieldB] = null;
        else if (updates[fieldB] !== undefined && updates[fieldB] !== null) next[fieldA] = null;
      }
      return next;
    });
  }, []);

  const clearAdvancedSelection = useCallback(() => { setAdvancedSelection(EMPTY_ADVANCED_SELECTION); }, []);
  const updateCreativeBoostInput = useCallback((updates: Partial<CreativeBoostInput>) => { setCreativeBoostInput(prev => ({ ...prev, ...updates })); }, []);
  const resetCreativeBoostInput = useCallback(() => { setCreativeBoostInput(EMPTY_CREATIVE_BOOST_INPUT); }, []);
  const resetQuickVibesInput = useCallback(() => { setQuickVibesInput(EMPTY_QUICK_VIBES_INPUT); }, [setQuickVibesInput]);

  const getEffectiveLockedPhrase = useCallback(() => {
    return editorMode === 'advanced' ? [computedMusicPhrase, lockedPhrase.trim()].filter(Boolean).join(', ') || undefined : lockedPhrase.trim() || undefined;
  }, [editorMode, computedMusicPhrase, lockedPhrase]);

  const resetEditor = useCallback(() => {
    setAdvancedSelection(EMPTY_ADVANCED_SELECTION); setLockedPhrase(""); setPendingInput(""); setLyricsTopic("");
    setQuickVibesInput(EMPTY_QUICK_VIBES_INPUT); setWithWordlessVocals(false); resetCreativeBoostInput();
  }, [resetCreativeBoostInput, setQuickVibesInput]);

  return (
    <EditorContext.Provider value={{
      editorMode, promptMode, creativeBoostMode, advancedSelection, lockedPhrase, pendingInput, lyricsTopic,
      computedMusicPhrase, quickVibesInput, getQuickVibesInput, withWordlessVocals, creativeBoostInput,
      setEditorMode, setPromptMode, setCreativeBoostMode, setAdvancedSelection, updateAdvancedSelection,
      clearAdvancedSelection, setLockedPhrase, setPendingInput, setLyricsTopic, setQuickVibesInput,
      setWithWordlessVocals, setCreativeBoostInput, updateCreativeBoostInput, resetCreativeBoostInput,
      getEffectiveLockedPhrase, resetEditor, resetQuickVibesInput,
    }}>
      {children}
    </EditorContext.Provider>
  );
};
