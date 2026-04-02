import React, { useState, useMemo } from 'react';

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
}

export function useGenerationState(): GenerationStateResult {
  const [generatingAction, setGeneratingAction] = useState<GeneratingAction>('none');
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [validation, setValidation] = useState({ ...EMPTY_VALIDATION });
  const [debugTrace, setDebugTrace] = useState<TraceRun | undefined>(undefined);

  const isGenerating = useMemo(() => generatingAction !== 'none', [generatingAction]);

  return {
    generatingAction,
    isGenerating,
    chatMessages,
    validation,
    debugTrace,
    setGeneratingAction,
    setChatMessages,
    setValidation,
    setDebugTrace,
  };
}
