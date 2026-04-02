import { useState, useCallback, useMemo, type ReactElement, type ReactNode } from 'react';

import { type MoodCategory } from '@bun/mood';
import { buildMusicPhrase } from '@shared/music-phrase';
import { type EditorMode, EMPTY_ADVANCED_SELECTION } from '@shared/types';

import { EditorActionsContext } from './editor-actions-context';
import { useEditorContextValues } from './editor-context-values';
import {
  useAdvancedSelectionState,
  useCreativeBoostState,
  usePersistedModes,
  useQuickVibesState,
} from './editor-provider-state';
import { EditorStateContext } from './editor-state-context';

interface EditorProviderProps {
  children: ReactNode;
}

/**
 * Combined provider that wraps children with both state and actions contexts.
 * This provides backward compatibility while enabling performance optimizations.
 */
export function EditorProvider({ children }: EditorProviderProps): ReactElement {
  const [editorMode, setEditorMode] = useState<EditorMode>('simple');
  const { promptMode, creativeBoostMode, setPromptMode, setCreativeBoostMode } =
    usePersistedModes();
  const {
    advancedSelection,
    setAdvancedSelection,
    updateAdvancedSelection,
    clearAdvancedSelection,
  } = useAdvancedSelectionState();
  const [lockedPhrase, setLockedPhrase] = useState('');
  const [pendingInput, setPendingInput] = useState('');
  const [lyricsTopic, setLyricsTopic] = useState('');
  const [moodCategory, setMoodCategory] = useState<MoodCategory | null>(null);
  const { quickVibesInput, setQuickVibesInput, resetQuickVibesInput, getQuickVibesInput } =
    useQuickVibesState();
  const {
    creativeBoostInput,
    setCreativeBoostInput,
    updateCreativeBoostInput,
    resetCreativeBoostInput,
  } = useCreativeBoostState();

  const computedMusicPhrase = useMemo(
    () => buildMusicPhrase(advancedSelection),
    [advancedSelection]
  );

  const getEffectiveLockedPhrase = useCallback(() => {
    return editorMode === 'advanced'
      ? [computedMusicPhrase, lockedPhrase.trim()].filter(Boolean).join(', ') || undefined
      : lockedPhrase.trim() || undefined;
  }, [editorMode, computedMusicPhrase, lockedPhrase]);

  const resetEditor = useCallback(() => {
    setAdvancedSelection(EMPTY_ADVANCED_SELECTION);
    setLockedPhrase('');
    setPendingInput('');
    setLyricsTopic('');
    setMoodCategory(null);
    resetQuickVibesInput();
    resetCreativeBoostInput();
  }, [resetCreativeBoostInput, resetQuickVibesInput, setAdvancedSelection]);

  const { stateValue, actionsValue } = useEditorContextValues({
    editorMode,
    promptMode,
    creativeBoostMode,
    advancedSelection,
    lockedPhrase,
    pendingInput,
    lyricsTopic,
    moodCategory,
    computedMusicPhrase,
    quickVibesInput,
    creativeBoostInput,
    setEditorMode,
    setPromptMode,
    setCreativeBoostMode,
    setAdvancedSelection,
    updateAdvancedSelection,
    clearAdvancedSelection,
    setLockedPhrase,
    setPendingInput,
    setLyricsTopic,
    setMoodCategory,
    setQuickVibesInput,
    setCreativeBoostInput,
    updateCreativeBoostInput,
    resetCreativeBoostInput,
    getEffectiveLockedPhrase,
    resetEditor,
    resetQuickVibesInput,
    getQuickVibesInput,
  });

  return (
    <EditorStateContext.Provider value={stateValue}>
      <EditorActionsContext.Provider value={actionsValue}>{children}</EditorActionsContext.Provider>
    </EditorStateContext.Provider>
  );
}
