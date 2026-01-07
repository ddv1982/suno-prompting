/**
 * AI Engine Types
 *
 * Type definitions for the AI generation engine, including results,
 * configurations, and context interfaces.
 *
 * @module ai/types
 */

import type { AIProvider, DebugInfo } from '@shared/types';
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
 * WHY: This type allows different modules to inject their own debug info
 * builder, which may include additional context (e.g., multi-turn messages).
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
 * Unified configuration for AI engines.
 *
 * WHY: Provides a common interface for Quick Vibes, Creative Boost, and
 * other engines that need access to model, debug mode, and debug info building.
 * Optional properties (isMaxMode, isLyricsMode, getUseSunoTags) allow engines
 * to use only what they need.
 */
export interface EngineConfig {
  /** Returns the language model to use for generation */
  getModel: () => LanguageModel;
  /** Returns whether debug mode is enabled */
  isDebugMode: () => boolean;
  /** Builds debug info from prompts and response */
  buildDebugInfo: DebugInfoBuilder;
  /** Returns whether max mode is enabled (optional) */
  isMaxMode?: () => boolean;
  /** Returns whether lyrics mode is enabled (optional) */
  isLyricsMode?: () => boolean;
  /** Returns whether to use Suno performance tags (optional) */
  getUseSunoTags?: () => boolean;
}

/**
 * Configuration for initial prompt generation.
 *
 * Provides all dependencies needed by the generation module,
 * enabling testability through dependency injection.
 */
export interface GenerationConfig {
  /** Returns the language model to use for LLM calls */
  getModel: () => LanguageModel;
  /** Returns whether debug mode is enabled */
  isDebugMode: () => boolean;
  /** Returns whether max mode is enabled */
  isMaxMode: () => boolean;
  /** Returns whether lyrics mode is enabled */
  isLyricsMode: () => boolean;
  /** Returns whether to use Suno performance tags */
  getUseSunoTags: () => boolean;
  /** Returns the model name for debug info */
  getModelName: () => string;
  /** Returns the AI provider for debug info */
  getProvider: () => AIProvider;
}

/**
 * Configuration for prompt refinement.
 *
 * Extends GenerationConfig with post-processing capability
 * needed for refining existing prompts.
 */
export interface RefinementConfig extends GenerationConfig {
  /** Post-process text (condense, rewrite, dedupe) */
  postProcess: (text: string) => Promise<string>;
  /** Builds debug info from prompts and response */
  buildDebugInfo: DebugInfoBuilder;
}
