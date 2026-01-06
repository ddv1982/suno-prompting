import type { DebugInfo } from '@shared/types';
import type { LanguageModel } from 'ai';

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
 * Common context shared across engine operations.
 * Provides access to model and mode state without exposing internal configuration.
 */
export interface EngineContext {
  /** Returns the language model to use for generation */
  getModel: () => LanguageModel;
  /** Returns whether debug mode is enabled */
  isDebugMode: () => boolean;
  /** Returns whether max mode is enabled (optional) */
  isMaxMode?: () => boolean;
  /** Returns whether lyrics mode is enabled (optional) */
  isLyricsMode?: () => boolean;
}

/**
 * Unified configuration for AI engines.
 * Extends EngineContext with additional configuration options.
 * Used by Quick Vibes, Creative Boost, and other generation engines.
 */
export interface EngineConfig extends EngineContext {
  /** Builds debug info from prompts and response */
  buildDebugInfo: DebugInfoBuilder;
  /** Returns whether to use Suno performance tags (optional) */
  getUseSunoTags?: () => boolean;
}
