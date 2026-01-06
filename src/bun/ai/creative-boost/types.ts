/**
 * Type definitions for Creative Boost Engine
 *
 * Contains configuration and options interfaces for creative boost
 * generation and refinement operations.
 *
 * @module ai/creative-boost/types
 */

import type { EngineConfig } from '../types';

/**
 * Configuration for the Creative Boost Engine
 */
export type CreativeBoostEngineConfig = EngineConfig;

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
  feedback: string;
  lyricsTopic: string;
  description: string;
  seedGenres: string[];
  sunoStyles: string[];
  withWordlessVocals: boolean;
  maxMode: boolean;
  withLyrics: boolean;
  config: CreativeBoostEngineConfig;
}

/**
 * Options for Direct Mode refinement
 */
export interface RefineDirectModeOptions {
  currentTitle: string;
  feedback: string;
  lyricsTopic: string;
  description: string;
  sunoStyles: string[];
  withLyrics: boolean;
}

/**
 * Parameters for post-processing Creative Boost response
 */
export type PostProcessParams = {
  rawStyle: string;
  maxMode: boolean;
  seedGenres: string[];
  sunoStyles: string[];
  lyricsTopic: string;
  description: string;
  withLyrics: boolean;
  systemPrompt: string;
  userPrompt: string;
  rawResponse: string;
  config: CreativeBoostEngineConfig;
  performanceInstruments?: string[];
  performanceVocalStyle?: string;
  chordProgression?: string;
  bpmRange?: string;
};
