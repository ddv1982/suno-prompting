import { useState, useMemo, useCallback } from 'react';
import { type DebugInfo } from '@shared/types';
import { EMPTY_VALIDATION, type ValidationResult } from '@shared/validation';
import { type ChatMessage } from '@/lib/chat-utils';

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

export function useGenerationState() {
  const [generatingAction, setGeneratingAction] = useState<GeneratingAction>('none');
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [validation, setValidation] = useState<ValidationResult>({ ...EMPTY_VALIDATION });
  const [debugInfo, setDebugInfo] = useState<Partial<DebugInfo> | undefined>(undefined);

  const isGenerating = useMemo(() => generatingAction !== 'none', [generatingAction]);

  const resetState = useCallback(() => {
    setChatMessages([]);
    setValidation({ ...EMPTY_VALIDATION });
    setDebugInfo(undefined);
  }, []);

  const addErrorMessage = useCallback((error: unknown, context: string) => {
    const message = error instanceof Error ? error.message : `Failed to ${context}`;
    setChatMessages(prev => [...prev, { role: "ai", content: `Error: ${message}.` }]);
  }, []);

  const addSuccessMessage = useCallback((message: string) => {
    setChatMessages(prev => [...prev, { role: "ai", content: message }]);
  }, []);

  const addUserMessage = useCallback((content: string) => {
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
