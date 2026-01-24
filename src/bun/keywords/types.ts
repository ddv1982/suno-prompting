/**
 * Type definitions for the keyword matching system.
 *
 * @module keywords/types
 */

import type { Era, Tempo } from '@shared/schemas/thematic-context';

/**
 * Categories of keywords that can be extracted.
 */
export type KeywordCategory =
  | 'mood'
  | 'theme'
  | 'era'
  | 'tempo'
  | 'intent'
  | 'time'
  | 'nature'
  | 'emotion'
  | 'action'
  | 'abstract';

/** Intent classification types for listening purpose */
export type Intent = 'background' | 'focal' | 'cinematic' | 'dancefloor' | 'emotional';

/**
 * Result from keyword extraction containing all matched categories.
 */
export interface KeywordExtractionResult {
  /** Matched mood keywords (from MOOD_POOL + MOOD_TO_GENRE) */
  readonly moods: readonly string[];
  /** Matched theme keywords (from emotion/nature/abstract categories) */
  readonly themes: readonly string[];
  /** Detected production era */
  readonly era?: Era;
  /** Detected tempo adjustment */
  readonly tempo?: Tempo;
  /** Detected listening intent */
  readonly intent?: Intent;
  /** Time-related keywords */
  readonly time: readonly string[];
  /** Nature-related keywords */
  readonly nature: readonly string[];
  /** Emotion-related keywords */
  readonly emotion: readonly string[];
  /** Action-related keywords */
  readonly action: readonly string[];
  /** Abstract concept keywords */
  readonly abstract: readonly string[];
}

/**
 * Options for matching functions.
 */
export interface MatchOptions {
  /** Maximum number of matches to return (default: unlimited) */
  readonly limit?: number;
  /** Whether to use caching (default: true) */
  readonly useCache?: boolean;
}

/**
 * A keyword registry mapping input keywords to output values.
 * Used for categories where input maps to specific output (e.g., era keywords).
 */
export type KeywordRegistry<T> = Readonly<Record<string, T>>;

/**
 * A keyword mapping where input keywords map to multiple output words.
 * Used for theme/title generation where one keyword maps to multiple options.
 */
export type KeywordMapping = Readonly<Record<string, readonly string[]>>;
