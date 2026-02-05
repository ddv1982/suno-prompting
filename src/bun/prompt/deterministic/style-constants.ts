/**
 * Constants and type definitions for style tag assembly.
 *
 * @module prompt/deterministic/style-constants
 */

/**
 * Maximum tag counts per category for deterministic selection.
 *
 * These counts define the maximum number of tags to select from each category
 * when that category passes its probability threshold. Probabilities are now
 * genre-specific and defined in `./weights.ts`.
 *
 * @since v2.0.0
 * @see getTagWeightsForGenre for genre-specific probabilities
 */
export const TAG_CATEGORY_MAX_COUNTS = {
  vocal: 2,
  spatial: 1,
  harmonic: 1,
  dynamic: 1,
  temporal: 1,
} as const;

/**
 * Weight multipliers for narrativeArc-based dynamic tag boosting.
 * Longer arcs indicate more dramatic/epic songs that benefit from higher dynamic tag probability.
 */
export const ARC_WEIGHT_MULTIPLIERS = {
  /** Default multiplier for short or no arc (≤2 elements) */
  DEFAULT: 1.0,
  /** Moderate boost for medium arcs (3-4 elements) */
  MEDIUM: 1.3,
  /** Significant boost for epic arcs (≥5 elements) */
  EPIC: 1.6,
} as const;
