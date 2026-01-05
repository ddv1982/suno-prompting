import { type GeneratingAction } from "@/context/app-context";
import { type ChatMessage } from "@/lib/chat-utils";
import { type DebugInfo, type EditorMode, type AdvancedSelection, type PromptMode, type QuickVibesInput, type QuickVibesCategory, type CreativeBoostInput, type CreativeBoostMode } from "@shared/types";
import { type ValidationResult } from "@shared/validation";

export type OutputState = {
  currentPrompt: string;
  currentTitle?: string;
  currentLyrics?: string;
};

export type InputState = {
  pendingInput: string;
  lockedPhrase: string;
  lyricsTopic: string;
  advancedSelection: AdvancedSelection;
  computedMusicPhrase: string;
};

export type GenerationState = {
  isGenerating: boolean;
  generatingAction: GeneratingAction;
  validation: ValidationResult;
  debugInfo?: Partial<DebugInfo>;
  chatMessages: ChatMessage[];
};

export type ModeState = {
  maxMode: boolean;
  lyricsMode: boolean;
  editorMode: EditorMode;
  promptMode: PromptMode;
  creativeBoostMode: CreativeBoostMode;
};

export type QuickVibesState = {
  input: QuickVibesInput;
  withWordlessVocals: boolean;
};

export type CreativeBoostState = {
  input: CreativeBoostInput;
};

export type RemixHandlers = {
  onRemix: () => void;
  onRemixQuickVibes: () => void;
  onRemixInstruments: () => void;
  onRemixGenre: () => void;
  onRemixMood: () => void;
  onRemixStyleTags: () => void;
  onRemixRecording: () => void;
  onRemixTitle: () => void;
  onRemixLyrics: () => void;
};

export type EditorHandlers = {
  onPendingInputChange: (input: string) => void;
  onLockedPhraseChange: (phrase: string) => void;
  onLyricsTopicChange: (topic: string) => void;
  onEditorModeChange: (mode: EditorMode) => void;
  onAdvancedSelectionUpdate: (updates: Partial<AdvancedSelection>) => void;
  onAdvancedSelectionClear: () => void;
  onPromptModeChange: (mode: PromptMode) => void;
  onMaxModeChange: (mode: boolean) => void;
  onLyricsModeChange: (mode: boolean) => void;
  onCreativeBoostModeChange: (mode: CreativeBoostMode) => void;
  onQuickVibesInputChange: (input: QuickVibesInput) => void;
  onWordlessVocalsChange: (value: boolean) => void;
  onCreativeBoostInputChange: (input: CreativeBoostInput) => void;
  onGenerate: (input: string) => void;
  onGenerateQuickVibes: (category: QuickVibesCategory | null, customDescription: string, withWordlessVocals: boolean, sunoStyles: string[]) => void;
  onGenerateCreativeBoost: () => void;
  onRefineCreativeBoost: (feedback: string) => void;
  onCopy: () => void;
  onConversionComplete: (originalInput: string, convertedPrompt: string, versionId: string, debugInfo?: Partial<DebugInfo>) => Promise<void>;
};

export type EditorConfig = {
  maxChars: number;
  currentModel: string;
};

export type PromptEditorProps = {
  output: OutputState;
  input: InputState;
  generation: GenerationState;
  modes: ModeState;
  quickVibes: QuickVibesState;
  creativeBoost: CreativeBoostState;
  remix: RemixHandlers;
  handlers: EditorHandlers;
  config: EditorConfig;
};
