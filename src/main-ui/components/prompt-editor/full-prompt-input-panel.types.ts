import type { MoodCategory } from "@bun/mood";
import type { AdvancedSelection, EditorMode, RefinementType, StyleChanges, TraceRun } from "@shared/types";

/** Input state and handlers */
export interface InputState {
  pendingInput: string;
  lockedPhrase: string;
  lyricsTopic: string;
  onPendingInputChange: (input: string) => void;
  onLockedPhraseChange: (phrase: string) => void;
  onLyricsTopicChange: (topic: string) => void;
}

/** Mood category state and handlers (for simple mode) */
export interface MoodCategoryState {
  moodCategory: MoodCategory | null;
  onMoodCategoryChange: (category: MoodCategory | null) => void;
}

/** Mode state and handlers for FullPromptInputPanel */
export interface ModeStateWithHandlers {
  editorMode: EditorMode;
  maxMode: boolean;
  lyricsMode: boolean;
  storyMode: boolean;
  onEditorModeChange: (mode: EditorMode) => void;
  onMaxModeChange: (mode: boolean) => void;
  onLyricsModeChange: (mode: boolean) => void;
  onStoryModeChange: (mode: boolean) => void;
}

/** Advanced selection state and handlers */
export interface AdvancedState {
  advancedSelection: AdvancedSelection;
  computedMusicPhrase: string;
  hasAdvancedSelection: boolean;
  onAdvancedSelectionUpdate: (updates: Partial<AdvancedSelection>) => void;
  onAdvancedSelectionClear: () => void;
}

/** Validation and limits */
export interface ValidationState {
  maxChars: number;
  lockedPhraseValidation: { isValid: boolean; error: string | null };
  inputOverLimit: boolean;
  lyricsTopicOverLimit: boolean;
}

/** Generation state and handlers */
export interface GenerationState {
  currentPrompt: string;
  isGenerating: boolean;
  onGenerate: (input: string, refinementType?: RefinementType, styleChanges?: StyleChanges) => Promise<boolean>;
  onConversionComplete: (
    originalInput: string,
    convertedPrompt: string,
    versionId: string,
    debugTrace?: TraceRun
  ) => Promise<void>;
}

/** Combined props for FullPromptInputPanel component */
export type FullPromptInputPanelProps = InputState &
  MoodCategoryState &
  ModeStateWithHandlers &
  AdvancedState &
  ValidationState &
  GenerationState;
