import type { LanguageModel } from 'ai';
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

/**
 * Unified configuration for AI engines
 * Used by Quick Vibes, Creative Boost, and other generation engines
 */
export type EngineConfig = {
  getModel: () => LanguageModel;
  isDebugMode: () => boolean;
  buildDebugInfo: DebugInfoBuilder;
  isMaxMode?: () => boolean;
};
