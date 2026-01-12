/**
 * Genre Compatibility Types
 *
 * Type definitions for the genre compatibility system.
 *
 * @module instruments/genres/compatibility/types
 */

/**
 * Compatibility score between two genres (0.0 to 1.0).
 * - 0.0: Incompatible, should not fuse
 * - 0.5: Threshold for allowing fusion
 * - 1.0: Highly compatible, excellent fusion
 */
export type CompatibilityScore = number;

/**
 * Threshold score for allowing genre fusion.
 * Genres with compatibility >= this value can be fused.
 */
export const FUSION_THRESHOLD = 0.5;
