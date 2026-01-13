/**
 * Type definitions for deterministic prompt generation.
 *
 * @module prompt/deterministic/types
 */

import { z } from 'zod';

import type { GenreType } from '@bun/instruments/genres';
import type { MoodCategory } from '@bun/mood';
import type { TraceCollector } from '@bun/trace';

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
  /** Optional trace collector (undefined when debug mode OFF). */
  readonly trace?: TraceCollector;
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

/**
 * Multi-dimensional production descriptor for Suno V5.
 *
 * Separates production into 4 independent dimensions for greater variety
 * and more precise control over sonic characteristics. This structured
 * approach replaces blended string descriptors and enables 30,600 unique
 * combinations (15 × 17 × 10 × 12) compared to 204 from blended strings.
 *
 * @since v2.0.0
 * @example
 * {
 *   reverb: 'hall reverb',
 *   texture: 'warm character',
 *   stereo: 'wide stereo',
 *   dynamic: 'punchy mix'
 * }
 */
export type ProductionDescriptor = {
  /** Reverb type describing spatial audio processing (e.g., 'hall reverb', 'plate reverb') */
  readonly reverb: string;
  /** Recording texture describing overall sonic character (e.g., 'warm character', 'polished production') */
  readonly texture: string;
  /** Stereo imaging describing spatial width and positioning (e.g., 'wide stereo', 'centered focus') */
  readonly stereo: string;
  /** Dynamic descriptor describing compression and loudness control (e.g., 'punchy mix', 'natural dynamics') */
  readonly dynamic: string;
};

/**
 * Zod validation schema for ProductionDescriptor.
 *
 * Validates all four production dimensions are non-empty strings.
 * Use this schema at API boundaries and when validating external data.
 *
 * @since v2.0.0
 * @example
 * const result = ProductionDescriptorSchema.safeParse(data);
 * if (result.success) {
 *   const descriptor = result.data;
 * }
 */
export const ProductionDescriptorSchema = z.object({
  reverb: z.string().min(1, 'Reverb type is required'),
  texture: z.string().min(1, 'Recording texture is required'),
  stereo: z.string().min(1, 'Stereo imaging is required'),
  dynamic: z.string().min(1, 'Dynamic descriptor is required'),
});
