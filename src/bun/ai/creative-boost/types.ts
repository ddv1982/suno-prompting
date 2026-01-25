/**
 * Type definitions for Creative Boost Engine
 *
 * Contains configuration and options interfaces for creative boost
 * generation and refinement operations.
 *
 * @module ai/creative-boost/types
 */

import type { EngineConfig } from '@bun/ai/types';
import type { TraceCollector } from '@bun/trace';

/**
 * Configuration for the Creative Boost Engine.
 * Extends EngineConfig with Story Mode support.
 */
export interface CreativeBoostEngineConfig extends EngineConfig {
  /** Returns whether story mode is enabled (optional) */
  isStoryMode?: () => boolean;
  /** Returns whether any LLM is available (local or cloud) (optional) */
  isLLMAvailable?: () => boolean;
  /** Returns Ollama endpoint for direct API calls when using local LLM (optional) */
  getOllamaEndpointIfLocal?: () => string | undefined;
}

/**
 * Options for generating a creative boost prompt
 */
export interface GenerateCreativeBoostOptions {
  creativityLevel: number;
  seedGenres: string[];
  sunoStyles: string[];
  description: string;
  lyricsTopic: string;
  withWordlessVocals: boolean;
  maxMode: boolean;
  withLyrics: boolean;
  config: CreativeBoostEngineConfig;
}

/**
 * Options for refining a creative boost prompt
 */
export interface RefineCreativeBoostOptions {
  currentPrompt: string;
  currentTitle: string;
  currentLyrics?: string;
  feedback: string;
  lyricsTopic: string;
  description: string;
  seedGenres: string[];
  sunoStyles: string[];
  withWordlessVocals: boolean;
  maxMode: boolean;
  withLyrics: boolean;
  config: CreativeBoostEngineConfig;
  /**
   * Target genre count to enforce in the output (1-4).
   *
   * WHY: Users select a specific number of seed genres to control fusion
   * complexity. During refinement, the LLM might change genres but should
   * maintain the same count. 0 or undefined means no enforcement (preserve
   * whatever the LLM returns).
   */
  targetGenreCount?: number;
}

/**
 * Options for Direct Mode refinement
 */
export interface RefineDirectModeOptions {
  currentTitle: string;
  currentLyrics?: string;
  feedback: string;
  lyricsTopic: string;
  description: string;
  sunoStyles: string[];
  withLyrics: boolean;
  maxMode: boolean;
}

/**
 * Parameters for post-processing Creative Boost response.
 *
 * WHY so many fields? Post-processing needs context from multiple stages:
 * 1. User inputs (description, lyrics settings) for content generation
 * 2. LLM interaction data (prompts, response) for debug info
 * 3. Performance context (instruments, vocals, BPM) for max mode conversion
 *
 * This consolidates all context needed for the postProcessCreativeBoostResponse()
 * pipeline to avoid threading 15+ parameters through multiple function calls.
 */
export interface PostProcessParams {
  /** Raw style output from LLM before max mode conversion */
  rawStyle: string;
  /** Whether to apply max mode formatting (community format for realism) */
  maxMode: boolean;
  /** User-selected seed genres for genre-aware instrument injection */
  seedGenres: string[];
  /** User-selected Suno V5 styles (mutually exclusive with seedGenres) */
  sunoStyles: string[];
  /** Topic for lyrics generation when withLyrics is true */
  lyricsTopic: string;
  /** Fallback topic when lyricsTopic is empty */
  description: string;
  /** Whether to generate lyrics via LLM */
  withLyrics: boolean;
  /** System prompt sent to LLM (for debug info) */
  systemPrompt: string;
  /** User prompt sent to LLM (for debug info) */
  userPrompt: string;
  /** Raw LLM response before parsing (for debug info) */
  rawResponse: string;
  /** Engine config for model access and debug mode checks */
  config: CreativeBoostEngineConfig;

  /** Optional per-run trace collector (undefined when debug mode OFF). */
  trace?: TraceCollector;
  /** Optional per-run RNG used for deterministic decisions in this run. */
  rng?: () => number;
  /** Genre-specific instruments for max mode conversion injection */
  performanceInstruments?: string[];
  /** Genre-specific vocal style for max mode conversion injection */
  performanceVocalStyle?: string;
  /** Genre-appropriate chord progression for max mode conversion */
  chordProgression?: string;
  /** Genre-appropriate BPM range for max mode conversion */
  bpmRange?: string;
}
