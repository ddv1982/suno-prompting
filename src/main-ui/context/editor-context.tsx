import { createContext, useContext, useState, useCallback, useMemo, useEffect, type ReactNode } from 'react';
import { type EditorMode, type AdvancedSelection, type QuickVibesInput, type PromptMode, EMPTY_ADVANCED_SELECTION } from '@shared/types';
import { buildMusicPhrase } from '@shared/music-phrase';
import { api } from '@/services/rpc';
import { createLogger } from '@/lib/logger';

const log = createLogger('Editor');

const EMPTY_QUICK_VIBES_INPUT: QuickVibesInput = {
  category: null,
  customDescription: '',
  withWordlessVocals: false,
};

const MUTUALLY_EXCLUSIVE_FIELDS: [keyof AdvancedSelection, keyof AdvancedSelection][] = [
  ['harmonicStyle', 'harmonicCombination'],
  ['timeSignature', 'timeSignatureJourney'],
];

interface EditorContextType {
  editorMode: EditorMode;
  promptMode: PromptMode;
  advancedSelection: AdvancedSelection;
  lockedPhrase: string;
  pendingInput: string;
  lyricsTopic: string;
  computedMusicPhrase: string;
  quickVibesInput: QuickVibesInput;
  withWordlessVocals: boolean;
  setEditorMode: (mode: EditorMode) => void;
  setPromptMode: (mode: PromptMode) => void;
  setAdvancedSelection: (selection: AdvancedSelection) => void;
  updateAdvancedSelection: (updates: Partial<AdvancedSelection>) => void;
  clearAdvancedSelection: () => void;
  setLockedPhrase: (phrase: string) => void;
  setPendingInput: (input: string) => void;
  setLyricsTopic: (topic: string) => void;
  setQuickVibesInput: (input: QuickVibesInput) => void;
  setWithWordlessVocals: (value: boolean) => void;
  getEffectiveLockedPhrase: () => string | undefined;
  resetEditor: () => void;
  resetQuickVibesInput: () => void;
}

const EditorContext = createContext<EditorContextType | null>(null);

export const useEditorContext = () => {
  const context = useContext(EditorContext);
  if (!context) throw new Error('useEditorContext must be used within EditorProvider');
  return context;
};

export const EditorProvider = ({ children }: { children: ReactNode }) => {
  const [editorMode, setEditorMode] = useState<EditorMode>('simple');
  const [promptMode, setPromptModeState] = useState<PromptMode>('full');
  const [advancedSelection, setAdvancedSelection] = useState<AdvancedSelection>(EMPTY_ADVANCED_SELECTION);
  const [lockedPhrase, setLockedPhrase] = useState("");
  const [pendingInput, setPendingInput] = useState("");
  const [lyricsTopic, setLyricsTopic] = useState("");
  const [quickVibesInput, setQuickVibesInput] = useState<QuickVibesInput>(EMPTY_QUICK_VIBES_INPUT);
  const [withWordlessVocals, setWithWordlessVocals] = useState(false);

  // Load promptMode once on mount - no reload, no race conditions
  useEffect(() => {
    api.getPromptMode()
      .then(mode => setPromptModeState(mode))
      .catch(err => log.error("loadPromptMode:failed", err));
  }, []);

  // Fire-and-forget save to backend
  const setPromptMode = useCallback((mode: PromptMode) => {
    setPromptModeState(mode);
    api.setPromptMode(mode).catch(err => log.error("setPromptMode:failed", err));
  }, []);

  const computedMusicPhrase = useMemo(() => {
    return buildMusicPhrase(advancedSelection);
  }, [advancedSelection]);

  const updateAdvancedSelection = useCallback((updates: Partial<AdvancedSelection>) => {
    setAdvancedSelection(prev => {
      const next = { ...prev, ...updates };
      for (const [fieldA, fieldB] of MUTUALLY_EXCLUSIVE_FIELDS) {
        if (updates[fieldA] !== undefined && updates[fieldA] !== null) {
          next[fieldB] = null;
        } else if (updates[fieldB] !== undefined && updates[fieldB] !== null) {
          next[fieldA] = null;
        }
      }
      return next;
    });
  }, []);

  const clearAdvancedSelection = useCallback(() => {
    setAdvancedSelection(EMPTY_ADVANCED_SELECTION);
  }, []);

  const getEffectiveLockedPhrase = useCallback(() => {
    return editorMode === 'advanced'
      ? [computedMusicPhrase, lockedPhrase.trim()].filter(Boolean).join(', ') || undefined
      : lockedPhrase.trim() || undefined;
  }, [editorMode, computedMusicPhrase, lockedPhrase]);

  const resetEditor = useCallback(() => {
    setAdvancedSelection(EMPTY_ADVANCED_SELECTION);
    setLockedPhrase("");
    setPendingInput("");
    setLyricsTopic("");
    setQuickVibesInput(EMPTY_QUICK_VIBES_INPUT);
    setWithWordlessVocals(false);
  }, []);

  const resetQuickVibesInput = useCallback(() => {
    setQuickVibesInput(EMPTY_QUICK_VIBES_INPUT);
  }, []);

  return (
    <EditorContext.Provider value={{
      editorMode,
      promptMode,
      advancedSelection,
      lockedPhrase,
      pendingInput,
      lyricsTopic,
      computedMusicPhrase,
      quickVibesInput,
      withWordlessVocals,
      setEditorMode,
      setPromptMode,
      setAdvancedSelection,
      updateAdvancedSelection,
      clearAdvancedSelection,
      setLockedPhrase,
      setPendingInput,
      setLyricsTopic,
      setQuickVibesInput,
      setWithWordlessVocals,
      getEffectiveLockedPhrase,
      resetEditor,
      resetQuickVibesInput,
    }}>
      {children}
    </EditorContext.Provider>
  );
};
