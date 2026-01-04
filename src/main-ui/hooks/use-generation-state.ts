import React, { useState, useMemo, useCallback } from 'react';

import { type ChatMessage } from '@/lib/chat-utils';
import { type DebugInfo } from '@shared/types';
import { EMPTY_VALIDATION, type ValidationResult } from '@shared/validation';

export type GeneratingAction = 
  | 'none' 
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

export interface GenerationStateResult {
  generatingAction: GeneratingAction;
  isGenerating: boolean;
  chatMessages: ChatMessage[];
  validation: ValidationResult;
  debugInfo: Partial<DebugInfo> | undefined;
  setGeneratingAction: (action: GeneratingAction) => void;
  setChatMessages: React.Dispatch<React.SetStateAction<ChatMessage[]>>;
  setValidation: (v: ValidationResult) => void;
  setDebugInfo: (info: Partial<DebugInfo> | undefined) => void;
  resetState: () => void;
  addErrorMessage: (error: unknown, context: string) => void;
  addSuccessMessage: (message: string) => void;
  addUserMessage: (content: string) => void;
}

export function useGenerationState(): GenerationStateResult {
  const [generatingAction, setGeneratingAction] = useState<GeneratingAction>('none');
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [validation, setValidation] = useState<ValidationResult>({ ...EMPTY_VALIDATION });
  const [debugInfo, setDebugInfo] = useState<Partial<DebugInfo> | undefined>(undefined);

  const isGenerating = useMemo(() => generatingAction !== 'none', [generatingAction]);

  const resetState = useCallback((): void => {
    setChatMessages([]);
    setValidation({ ...EMPTY_VALIDATION });
    setDebugInfo(undefined);
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
    debugInfo,
    // Setters
    setGeneratingAction,
    setChatMessages,
    setValidation,
    setDebugInfo,
    // Helpers
    resetState,
    addErrorMessage,
    addSuccessMessage,
    addUserMessage,
  };
}
