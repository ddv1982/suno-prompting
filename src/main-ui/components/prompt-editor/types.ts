import { type GeneratingAction } from "@/context/generation";
import { type ChatMessage } from "@/lib/chat-utils";
import { type DebugInfo, type EditorMode, type AdvancedSelection, type PromptMode, type QuickVibesInput, type QuickVibesCategory, type CreativeBoostInput, type CreativeBoostMode } from "@shared/types";
import { type ValidationResult } from "@shared/validation";

/** State for the current prompt output display */
export type OutputState = {
  /** The generated/refined prompt text */
  currentPrompt: string;
  /** Optional song title */
  currentTitle?: string;
  /** Optional generated lyrics */
  currentLyrics?: string;
};

/** State for user input fields in full prompt mode */
export type InputState = {
  /** User's pending input text */
  pendingInput: string;
  /** Locked phrase to preserve across generations */
  lockedPhrase: string;
  /** Topic/theme for lyrics generation */
  lyricsTopic: string;
  /** Advanced mode selections (genre, harmony, etc.) */
  advancedSelection: AdvancedSelection;
  /** Computed music phrase from advanced selection */
  computedMusicPhrase: string;
};

/** State for generation/loading status */
export type GenerationState = {
  /** Whether a generation is in progress */
  isGenerating: boolean;
  /** Which specific action is generating */
  generatingAction: GeneratingAction;
  /** Validation result for current prompt */
  validation: ValidationResult;
  /** Debug info from last generation */
  debugInfo?: Partial<DebugInfo>;
  /** Chat history messages */
  chatMessages: ChatMessage[];
};

/** State for various mode toggles */
export type ModeState = {
  /** Max Mode enabled (structured output format) */
  maxMode: boolean;
  /** Lyrics generation enabled */
  lyricsMode: boolean;
  /** Editor mode (simple/advanced) */
  editorMode: EditorMode;
  /** Prompt mode (full/quickVibes/creativeBoost) */
  promptMode: PromptMode;
  /** Creative Boost mode (simple/advanced) */
  creativeBoostMode: CreativeBoostMode;
};

/** Quick Vibes mode state */
export type QuickVibesState = {
  /** Quick Vibes input (category, description, styles) */
  input: QuickVibesInput;
  /** Original input from session (for refine mode change detection) */
  originalInput?: QuickVibesInput | null;
  /** Whether wordless vocals are enabled */
  withWordlessVocals: boolean;
};

/** Creative Boost mode state */
export type CreativeBoostState = {
  /** Creative Boost input (description, genres, styles) */
  input: CreativeBoostInput;
};

/** Handlers for remix operations */
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

/** Handlers for editor operations and state changes */
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
  onCreativeBoostInputChange: (input: CreativeBoostInput | ((prev: CreativeBoostInput) => CreativeBoostInput)) => void;
  onGenerate: (input: string) => void;
  onGenerateQuickVibes: (category: QuickVibesCategory | null, customDescription: string, withWordlessVocals: boolean, sunoStyles: string[]) => void;
  onRefineQuickVibes: (feedback: string) => void;
  onGenerateCreativeBoost: () => void;
  onRefineCreativeBoost: (feedback: string) => void;
  onCopy: () => void;
  onConversionComplete: (originalInput: string, convertedPrompt: string, versionId: string, debugInfo?: Partial<DebugInfo>) => Promise<void>;
};

/** Configuration values for the editor */
export type EditorConfig = {
  /** Maximum characters allowed in prompt */
  maxChars: number;
  /** Current AI model being used */
  currentModel: string;
  /** Whether using local LLM (Ollama) instead of cloud provider */
  useLocalLLM: boolean;
};

/** Combined props for PromptEditor component - groups related props for cleaner API */
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
