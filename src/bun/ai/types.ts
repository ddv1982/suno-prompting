import type { DebugInfo } from '@shared/types';

export type GenerationResult = {
  text: string;
  title?: string;
  lyrics?: string;
  debugInfo?: DebugInfo;
};

export type ParsedCombinedResponse = {
  prompt: string;
  title: string;
  lyrics?: string;
};

export type DebugInfoBuilder = (
  systemPrompt: string,
  userPrompt: string,
  rawResponse: string,
  messages?: Array<{ role: string; content: string }>
) => DebugInfo;
