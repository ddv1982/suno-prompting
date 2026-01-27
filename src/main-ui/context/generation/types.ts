import type { ChatMessage } from '@/lib/chat-utils';
import type { MoodCategory } from '@bun/mood';
import type { PromptSession, QuickVibesCategory, RefinementType, StyleChanges, TraceRun } from '@shared/types';
import type { ValidationResult } from '@shared/validation';

/** Active generation actions (excluding 'none') */
export type ActiveGeneratingAction =
  | 'generate'
  | 'remix'
  | 'remixInstruments'
  | 'remixGenre'
  | 'remixMood'
  | 'remixStyleTags'
  | 'remixRecording'
  | 'remixTitle'
  | 'remixLyrics'
  | 'quickVibes'
  | 'creativeBoost';

/** All generation actions including idle state */
export type GeneratingAction = 'none' | ActiveGeneratingAction;

/** State context - provides generation state and setters */
export interface GenerationStateContextValue {
  isGenerating: boolean;
  generatingAction: GeneratingAction;
  chatMessages: ChatMessage[];
  validation: ValidationResult;
  debugTrace: TraceRun | undefined;
  /** Whether we're in optimistic state (before server confirms) */
  isOptimistic: boolean;
  /** Whether to show skeleton loading UI */
  showSkeleton: boolean;
  setGeneratingAction: (action: GeneratingAction) => void;
  setChatMessages: React.Dispatch<React.SetStateAction<ChatMessage[]>>;
  setValidation: (v: ValidationResult) => void;
  setDebugTrace: (trace: TraceRun | undefined) => void;
  /** Start optimistic state with given action */
  startOptimistic: (action: GeneratingAction) => void;
  /** Complete optimistic state (server confirmed) */
  completeOptimistic: () => void;
  /** Error during generation, reset optimistic state */
  errorOptimistic: () => void;
}

/** Session operations context - provides session management */
export interface SessionOperationsContextValue {
  selectSession: (session: PromptSession) => void;
  newProject: () => void;
  createConversionSession: (
    originalInput: string,
    convertedPrompt: string,
    versionId: string,
    debugTrace?: TraceRun
  ) => Promise<void>;
}

/** Standard generation context - provides core generation operations */
export interface StandardGenerationContextValue {
  handleGenerate: (input: string, refinementType?: RefinementType, styleChanges?: StyleChanges) => Promise<boolean>;
  handleRemix: () => Promise<void>;
  handleConversionComplete: (
    originalInput: string,
    convertedPrompt: string,
    versionId: string,
    debugTrace?: TraceRun
  ) => Promise<void>;
}

/** Full context type for backward compatibility */
export interface GenerationContextType
  extends GenerationStateContextValue,
    SessionOperationsContextValue,
    StandardGenerationContextValue {
  // Remix actions (delegated to useRemixActions hook)
  handleRemixInstruments: () => Promise<void>;
  handleRemixGenre: () => Promise<void>;
  handleRemixMood: () => Promise<void>;
  handleRemixStyleTags: () => Promise<void>;
  handleRemixRecording: () => Promise<void>;
  handleRemixTitle: () => Promise<void>;
  handleRemixLyrics: () => Promise<void>;
  // Quick Vibes actions
  handleGenerateQuickVibes: (
    category: QuickVibesCategory | null,
    customDescription: string,
    sunoStyles: string[],
    moodCategory?: MoodCategory | null
  ) => Promise<void>;
  handleRemixQuickVibes: () => Promise<void>;
  handleRefineQuickVibes: (feedback: string) => Promise<boolean>;
  // Creative Boost actions
  handleGenerateCreativeBoost: () => Promise<void>;
  handleRefineCreativeBoost: (feedback: string) => Promise<boolean>;
}
