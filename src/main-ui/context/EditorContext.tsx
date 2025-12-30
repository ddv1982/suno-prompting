import { createContext, useContext, useState, useCallback, useMemo, type ReactNode } from 'react';
import { type EditorMode, type AdvancedSelection, EMPTY_ADVANCED_SELECTION } from '@shared/types';
import { buildMusicPhrase } from '@shared/music-phrase';

const MUTUALLY_EXCLUSIVE_FIELDS: [keyof AdvancedSelection, keyof AdvancedSelection][] = [
  ['harmonicStyle', 'harmonicCombination'],
  ['timeSignature', 'timeSignatureJourney'],
];

interface EditorContextType {
  editorMode: EditorMode;
  advancedSelection: AdvancedSelection;
  lockedPhrase: string;
  pendingInput: string;
  computedMusicPhrase: string;
  setEditorMode: (mode: EditorMode) => void;
  setAdvancedSelection: (selection: AdvancedSelection) => void;
  updateAdvancedSelection: (updates: Partial<AdvancedSelection>) => void;
  clearAdvancedSelection: () => void;
  setLockedPhrase: (phrase: string) => void;
  setPendingInput: (input: string) => void;
  getEffectiveLockedPhrase: () => string | undefined;
  resetEditor: () => void;
}

const EditorContext = createContext<EditorContextType | null>(null);

export const useEditorContext = () => {
  const context = useContext(EditorContext);
  if (!context) throw new Error('useEditorContext must be used within EditorProvider');
  return context;
};

export const EditorProvider = ({ children }: { children: ReactNode }) => {
  const [editorMode, setEditorMode] = useState<EditorMode>('simple');
  const [advancedSelection, setAdvancedSelection] = useState<AdvancedSelection>(EMPTY_ADVANCED_SELECTION);
  const [lockedPhrase, setLockedPhrase] = useState("");
  const [pendingInput, setPendingInput] = useState("");

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
  }, []);

  return (
    <EditorContext.Provider value={{
      editorMode,
      advancedSelection,
      lockedPhrase,
      pendingInput,
      computedMusicPhrase,
      setEditorMode,
      setAdvancedSelection,
      updateAdvancedSelection,
      clearAdvancedSelection,
      setLockedPhrase,
      setPendingInput,
      getEffectiveLockedPhrase,
      resetEditor,
    }}>
      {children}
    </EditorContext.Provider>
  );
};
