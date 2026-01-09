import type { ChatMessage } from '@/lib/chat-utils';
import type { DebugInfo, PromptSession, QuickVibesCategory } from '@shared/types';
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
  debugInfo: Partial<DebugInfo> | undefined;
  setGeneratingAction: (action: GeneratingAction) => void;
  setChatMessages: React.Dispatch<React.SetStateAction<ChatMessage[]>>;
  setValidation: (v: ValidationResult) => void;
  setDebugInfo: (info: Partial<DebugInfo> | undefined) => void;
}

/** Session operations context - provides session management */
export interface SessionOperationsContextValue {
  selectSession: (session: PromptSession) => void;
  newProject: () => void;
  createConversionSession: (
    originalInput: string,
    convertedPrompt: string,
    versionId: string,
    debugInfo?: Partial<DebugInfo>
  ) => Promise<void>;
}

/** Standard generation context - provides core generation operations */
export interface StandardGenerationContextValue {
  handleGenerate: (input: string) => Promise<void>;
  handleCopy: () => void;
  handleRemix: () => Promise<void>;
  handleConversionComplete: (
    originalInput: string,
    convertedPrompt: string,
    versionId: string,
    debugInfo?: Partial<DebugInfo>
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
    withWordlessVocals: boolean,
    sunoStyles: string[]
  ) => Promise<void>;
  handleRemixQuickVibes: () => Promise<void>;
  // Creative Boost actions
  handleGenerateCreativeBoost: () => Promise<void>;
  handleRefineCreativeBoost: (feedback: string) => Promise<void>;
}
