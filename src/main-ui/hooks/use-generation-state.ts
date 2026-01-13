import React, { useState, useMemo, useCallback } from 'react';

import { type ChatMessage } from '@/lib/chat-utils';
import { type TraceRun } from '@shared/types';
import { EMPTY_VALIDATION, type ValidationResult } from '@shared/validation';

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

/**
 * Discriminated union for generation state.
 * Ensures type safety: when status is 'generating', action is always defined.
 */
export type GenerationStatus =
  | { readonly status: 'idle' }
  | { readonly status: 'generating'; readonly action: ActiveGeneratingAction };

export interface GenerationStateResult {
  generatingAction: GeneratingAction;
  isGenerating: boolean;
  chatMessages: ChatMessage[];
  validation: ValidationResult;
  debugTrace: TraceRun | undefined;
  setGeneratingAction: (action: GeneratingAction) => void;
  setChatMessages: React.Dispatch<React.SetStateAction<ChatMessage[]>>;
  setValidation: (v: ValidationResult) => void;
  setDebugTrace: (trace: TraceRun | undefined) => void;
  resetState: () => void;
  addErrorMessage: (error: unknown, context: string) => void;
  addSuccessMessage: (message: string) => void;
  addUserMessage: (content: string) => void;
}

export function useGenerationState(): GenerationStateResult {
  const [generatingAction, setGeneratingAction] = useState<GeneratingAction>('none');
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [validation, setValidation] = useState<ValidationResult>({ ...EMPTY_VALIDATION });
  const [debugTrace, setDebugTrace] = useState<TraceRun | undefined>(undefined);

  const isGenerating = useMemo(() => generatingAction !== 'none', [generatingAction]);

  const resetState = useCallback((): void => {
    setChatMessages([]);
    setValidation({ ...EMPTY_VALIDATION });
    setDebugTrace(undefined);
  }, []);

  const addErrorMessage = useCallback((error: unknown, context: string): void => {
    const message = error instanceof Error ? error.message : `Failed to ${context}`;
    setChatMessages(prev => [...prev, { role: "ai", content: `Error: ${message}.` }]);
  }, []);

  const addSuccessMessage = useCallback((message: string): void => {
    setChatMessages(prev => [...prev, { role: "ai", content: message }]);
  }, []);

  const addUserMessage = useCallback((content: string): void => {
    setChatMessages(prev => [...prev, { role: "user", content }]);
  }, []);

  return {
    // State
    generatingAction,
    isGenerating,
    chatMessages,
    validation,
    debugTrace,
    // Setters
    setGeneratingAction,
    setChatMessages,
    setValidation,
    setDebugTrace,
    // Helpers
    resetState,
    addErrorMessage,
    addSuccessMessage,
    addUserMessage,
  };
}
