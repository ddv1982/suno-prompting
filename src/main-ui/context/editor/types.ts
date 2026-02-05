import { type MoodCategory } from '@bun/mood';
import {
  type EditorMode,
  type AdvancedSelection,
  type QuickVibesInput,
  type PromptMode,
  type CreativeBoostInput,
  type CreativeBoostMode,
} from '@shared/types';

/**
 * Editor state - the data/values in the editor context.
 * Separated from actions for performance: components that only read state
 * won't re-render when only action handlers change.
 */
export interface EditorStateContextType {
  editorMode: EditorMode;
  promptMode: PromptMode;
  creativeBoostMode: CreativeBoostMode;
  advancedSelection: AdvancedSelection;
  lockedPhrase: string;
  pendingInput: string;
  lyricsTopic: string;
  moodCategory: MoodCategory | null;
  computedMusicPhrase: string;
  quickVibesInput: QuickVibesInput;
  creativeBoostInput: CreativeBoostInput;
}

/**
 * Editor actions - the functions/setters in the editor context.
 * Separated from state for performance: components that only call actions
 * won't re-render when state changes.
 */
export interface EditorActionsContextType {
  setEditorMode: (mode: EditorMode) => void;
  setPromptMode: (mode: PromptMode) => void;
  setCreativeBoostMode: (mode: CreativeBoostMode) => void;
  setAdvancedSelection: (selection: AdvancedSelection) => void;
  updateAdvancedSelection: (updates: Partial<AdvancedSelection>) => void;
  clearAdvancedSelection: () => void;
  setLockedPhrase: (phrase: string) => void;
  setPendingInput: (input: string) => void;
  setLyricsTopic: (topic: string) => void;
  setMoodCategory: (category: MoodCategory | null) => void;
  setQuickVibesInput: (input: QuickVibesInput) => void;
  setCreativeBoostInput: (
    input: CreativeBoostInput | ((prev: CreativeBoostInput) => CreativeBoostInput)
  ) => void;
  updateCreativeBoostInput: (updates: Partial<CreativeBoostInput>) => void;
  resetCreativeBoostInput: () => void;
  getEffectiveLockedPhrase: () => string | undefined;
  resetEditor: () => void;
  resetQuickVibesInput: () => void;
  getQuickVibesInput: () => QuickVibesInput;
}

/**
 * Combined editor context type for backward compatibility.
 * Components can use the combined hook when they need both state and actions.
 */
export type EditorContextType = EditorStateContextType & EditorActionsContextType;
