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
 * Tag category weights for style tag assembly.
 * Probabilities (0.0-1.0) determine inclusion chance per category.
 *
 * These weights control how likely each tag category is to be included
 * in the generated style tags. Different genres may have different weights
 * to better match their musical characteristics.
 *
 * @example
 * ```typescript
 * const jazzWeights: TagCategoryWeights = {
 *   vocal: 0.8,    // Jazz often features vocals prominently
 *   spatial: 0.4,  // Moderate spatial effects
 *   harmonic: 0.5, // Rich harmonic content
 *   dynamic: 0.3,  // Natural dynamics
 *   temporal: 0.3, // Subtle timing variations
 * };
 * ```
 */
export type TagCategoryWeights = {
  /** Probability of including vocal-related tags (0.0-1.0) */
  readonly vocal: number;
  /** Probability of including spatial/reverb tags (0.0-1.0) */
  readonly spatial: number;
  /** Probability of including harmonic complexity tags (0.0-1.0) */
  readonly harmonic: number;
  /** Probability of including dynamic range tags (0.0-1.0) */
  readonly dynamic: number;
  /** Probability of including timing/groove tags (0.0-1.0) */
  readonly temporal: number;
};

/**
 * Default tag category weights used when no genre-specific weights exist.
 *
 * These values provide a balanced baseline for tag selection across
 * all genres. Genre-specific weights in the weights module override
 * these defaults for more tailored style tag generation.
 *
 * @see GENRE_TAG_WEIGHTS in `./weights.ts` for genre-specific overrides
 */
export const DEFAULT_TAG_WEIGHTS = {
  vocal: 0.6,
  spatial: 0.5,
  harmonic: 0.4,
  dynamic: 0.4,
  temporal: 0.3,
} as const satisfies TagCategoryWeights;

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
  /**
   * Optional creativity level (0-100) for mood selection.
   *
   * At creativityLevel > 60 (adventurous/high creativity), compound moods
   * like "dark euphoria" or "bittersweet nostalgia" are used for richer
   * emotional expression.
   *
   * At creativityLevel ≤ 60 (standard/low creativity), simple moods from
   * the genre's mood pool are used for more conventional results.
   *
   * @default 50 (standard creativity, uses simple moods)
   *
   * @example
   * ```typescript
   * // High creativity - uses compound moods
   * const result = buildDeterministicMaxPrompt({
   *   description: 'jazz ballad',
   *   creativityLevel: 75,
   * });
   * // Moods may include 'bittersweet nostalgia', 'raw elegance', etc.
   *
   * // Standard creativity - uses simple moods
   * const result2 = buildDeterministicMaxPrompt({
   *   description: 'jazz ballad',
   *   creativityLevel: 50,
   * });
   * // Moods will be 'smooth', 'warm', 'sophisticated', etc.
   * ```
   */
  readonly creativityLevel?: number;
  /**
   * Optional seed for reproducible RNG generation.
   *
   * When provided and `rng` is not specified, creates a seeded pseudo-random
   * number generator using `createSeededRng(seed)`. This enables reproducible
   * prompt generation where the same seed always produces identical outputs.
   *
   * Useful for:
   * - Debugging: Reproduce exact prompts for investigation
   * - Testing: Deterministic test assertions
   * - Sharing: Allow users to share and recreate specific generations
   *
   * @example
   * ```typescript
   * // Same seed produces identical output
   * const result1 = buildDeterministicMaxPrompt({ description: 'jazz', seed: 12345 });
   * const result2 = buildDeterministicMaxPrompt({ description: 'jazz', seed: 12345 });
   * // result1.text === result2.text
   * ```
   */
  readonly seed?: number;
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
 *
 * The tags array contains all style tags in priority order (production first).
 * The moodTags array contains just the mood-related tags for use in headers
 * and mood-specific displays, separate from production/recording tags.
 */
export type StyleTagsResult = {
  /** All style tags in priority order (production → recording → mood → etc.) */
  readonly tags: readonly string[];
  /** Formatted comma-separated string of all tags */
  readonly formatted: string;
  /** Mood tags only (from genre mood pool), for header and mood display */
  readonly moodTags: readonly string[];
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
