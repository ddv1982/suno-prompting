/**
 * AI Engine Types
 *
 * Type definitions for the AI generation engine, including results,
 * configurations, and context interfaces.
 *
 * @module ai/types
 */

import type { DebugInfo } from '@shared/types';
import type { LanguageModel } from 'ai';

/**
 * Result from AI generation operations.
 *
 * Contains the generated text and optional title, lyrics, and debug information.
 *
 * @example
 * ```typescript
 * const result: GenerationResult = {
 *   text: '[Smooth, Jazz, Key: D minor]\n\nGenre: Jazz...',
 *   title: 'Midnight Session',
 *   lyrics: '[VERSE]\nUnder the city lights...',
 *   debugInfo: { systemPrompt: '...', ... }
 * };
 * ```
 */
export type GenerationResult = {
  /** The generated prompt text */
  text: string;
  /** Optional song title */
  title?: string;
  /** Optional lyrics (when lyrics mode is enabled) */
  lyrics?: string;
  /** Debug information (when debug mode is enabled) */
  debugInfo?: DebugInfo;
};

/**
 * Parsed response from combined generation (prompt + title + optional lyrics).
 *
 * Used when parsing JSON responses from LLM that include multiple outputs.
 */
export type ParsedCombinedResponse = {
  /** The generated prompt */
  prompt: string;
  /** The generated title */
  title: string;
  /** Optional generated lyrics */
  lyrics?: string;
};

/**
 * Function type for building debug information from LLM interactions.
 *
 * @param systemPrompt - The system prompt sent to the LLM
 * @param userPrompt - The user prompt sent to the LLM
 * @param rawResponse - The raw response from the LLM
 * @param messages - Optional array of messages for multi-turn conversations
 * @returns Debug information object
 */
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
