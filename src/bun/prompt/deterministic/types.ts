/**
 * Type definitions for deterministic prompt generation.
 *
 * @module prompt/deterministic/types
 */

import type { GenreType } from '@bun/instruments/genres';
import type { MoodCategory } from '@bun/mood';

/**
 * Options for deterministic prompt generation.
 */
export type DeterministicOptions = {
  /** User's song description/concept */
  readonly description: string;
  /** Genre override from Advanced Mode selector */
  readonly genreOverride?: string;
  /** Optional mood category to override genre-based mood selection */
  readonly moodCategory?: MoodCategory;
  /** Random number generator for deterministic testing */
  readonly rng?: () => number;
};

/**
 * Result from deterministic prompt generation.
 */
export type DeterministicResult = {
  /** The generated prompt text */
  readonly text: string;
  /** Detected or selected primary genre (first component for multi-genre) */
  readonly genre: GenreType | null;
  /** Debug metadata (when debug mode enabled) */
  readonly metadata?: DeterministicMetadata;
};

/**
 * Debug metadata from deterministic generation.
 */
export type DeterministicMetadata = {
  readonly detectedGenre: GenreType | null;
  /** Full genre string (can be compound like "jazz rock") */
  readonly usedGenre: string;
  readonly instruments: readonly string[];
  readonly chordProgression: string;
  readonly vocalStyle: string;
  readonly styleTags: readonly string[];
  readonly recordingContext: string;
};

/**
 * Result type for genre resolution supporting both single and multi-genre.
 */
export type ResolvedGenre = {
  /** Detected genre from description (null if override used or random fallback) */
  detected: GenreType | null;
  /** Display string - full genre string for prompt output (e.g., "jazz rock") */
  displayGenre: string;
  /** Primary genre for single-genre lookups (first component) */
  primaryGenre: GenreType;
  /** All valid genre components for multi-genre blending */
  components: GenreType[];
};

/**
 * Result from instrument assembly.
 */
export type InstrumentAssemblyResult = {
  readonly instruments: readonly string[];
  readonly formatted: string;
  readonly chordProgression: string;
  readonly vocalStyle: string;
};

/**
 * Result from style tag assembly.
 */
export type StyleTagsResult = {
  readonly tags: readonly string[];
  readonly formatted: string;
};

/**
 * Standard result type for remix operations.
 *
 * All remix functions return a consistent shape to enable uniform
 * handling in the UI and simplified composition of remix operations.
 */
export type RemixResult = {
  readonly text: string;
};
