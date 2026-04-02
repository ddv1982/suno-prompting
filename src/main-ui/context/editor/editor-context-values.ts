import { useMemo, type Dispatch, type SetStateAction } from 'react';

import { type MoodCategory } from '@bun/mood';
import {
  type AdvancedSelection,
  type CreativeBoostInput,
  type CreativeBoostMode,
  type EditorMode,
  type PromptMode,
  type QuickVibesInput,
} from '@shared/types';

import { type EditorActionsContextType, type EditorStateContextType } from './types';

interface EditorContextValuesInput {
  advancedSelection: AdvancedSelection;
  clearAdvancedSelection: () => void;
  computedMusicPhrase: string;
  creativeBoostInput: CreativeBoostInput;
  creativeBoostMode: CreativeBoostMode;
  editorMode: EditorMode;
  getEffectiveLockedPhrase: () => string | undefined;
  getQuickVibesInput: () => QuickVibesInput;
  lockedPhrase: string;
  lyricsTopic: string;
  moodCategory: MoodCategory | null;
  pendingInput: string;
  promptMode: PromptMode;
  quickVibesInput: QuickVibesInput;
  resetCreativeBoostInput: () => void;
  resetEditor: () => void;
  resetQuickVibesInput: () => void;
  setAdvancedSelection: Dispatch<SetStateAction<AdvancedSelection>>;
  setCreativeBoostInput: Dispatch<SetStateAction<CreativeBoostInput>>;
  setCreativeBoostMode: (mode: CreativeBoostMode) => void;
  setEditorMode: Dispatch<SetStateAction<EditorMode>>;
  setLockedPhrase: Dispatch<SetStateAction<string>>;
  setLyricsTopic: Dispatch<SetStateAction<string>>;
  setMoodCategory: Dispatch<SetStateAction<MoodCategory | null>>;
  setPendingInput: Dispatch<SetStateAction<string>>;
  setPromptMode: (mode: PromptMode) => void;
  setQuickVibesInput: (input: QuickVibesInput) => void;
  updateAdvancedSelection: (updates: Partial<AdvancedSelection>) => void;
  updateCreativeBoostInput: (updates: Partial<CreativeBoostInput>) => void;
}

export function useEditorContextValues(input: EditorContextValuesInput): {
  actionsValue: EditorActionsContextType;
  stateValue: EditorStateContextType;
} {
  const stateValue = useMemo<EditorStateContextType>(
    () => ({
      editorMode: input.editorMode,
      promptMode: input.promptMode,
      creativeBoostMode: input.creativeBoostMode,
      advancedSelection: input.advancedSelection,
      lockedPhrase: input.lockedPhrase,
      pendingInput: input.pendingInput,
      lyricsTopic: input.lyricsTopic,
      moodCategory: input.moodCategory,
      computedMusicPhrase: input.computedMusicPhrase,
      quickVibesInput: input.quickVibesInput,
      creativeBoostInput: input.creativeBoostInput,
    }),
    [
      input.advancedSelection,
      input.computedMusicPhrase,
      input.creativeBoostInput,
      input.creativeBoostMode,
      input.editorMode,
      input.lockedPhrase,
      input.lyricsTopic,
      input.moodCategory,
      input.pendingInput,
      input.promptMode,
      input.quickVibesInput,
    ]
  );

  const actionsValue = useMemo<EditorActionsContextType>(
    () => ({
      setEditorMode: input.setEditorMode,
      setPromptMode: input.setPromptMode,
      setCreativeBoostMode: input.setCreativeBoostMode,
      setAdvancedSelection: input.setAdvancedSelection,
      updateAdvancedSelection: input.updateAdvancedSelection,
      clearAdvancedSelection: input.clearAdvancedSelection,
      setLockedPhrase: input.setLockedPhrase,
      setPendingInput: input.setPendingInput,
      setLyricsTopic: input.setLyricsTopic,
      setMoodCategory: input.setMoodCategory,
      setQuickVibesInput: input.setQuickVibesInput,
      setCreativeBoostInput: input.setCreativeBoostInput,
      updateCreativeBoostInput: input.updateCreativeBoostInput,
      resetCreativeBoostInput: input.resetCreativeBoostInput,
      getEffectiveLockedPhrase: input.getEffectiveLockedPhrase,
      resetEditor: input.resetEditor,
      resetQuickVibesInput: input.resetQuickVibesInput,
      getQuickVibesInput: input.getQuickVibesInput,
    }),
    [
      input.clearAdvancedSelection,
      input.getEffectiveLockedPhrase,
      input.getQuickVibesInput,
      input.resetCreativeBoostInput,
      input.resetEditor,
      input.resetQuickVibesInput,
      input.setAdvancedSelection,
      input.setCreativeBoostInput,
      input.setCreativeBoostMode,
      input.setEditorMode,
      input.setLockedPhrase,
      input.setLyricsTopic,
      input.setMoodCategory,
      input.setPendingInput,
      input.setPromptMode,
      input.setQuickVibesInput,
      input.updateAdvancedSelection,
      input.updateCreativeBoostInput,
    ]
  );

  return { stateValue, actionsValue };
}
