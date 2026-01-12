/**
 * Genre Compatibility Matrix
 *
 * Combined compatibility matrix merging base and v3.0 genres.
 *
 * @module instruments/genres/compatibility/matrix
 */

import { BASE_GENRE_COMPATIBILITY } from './matrix-base';
import { V3_GENRE_COMPATIBILITY } from './matrix-v3';

import type { CompatibilityScore } from './types';

/**
 * Complete genre compatibility matrix.
 * Combines base genres (v1.0-v2.0) with new genres (v3.0).
 *
 * Uses sparse representation where only scores >= FUSION_THRESHOLD are stored.
 * Matrix is symmetric: score(A, B) === score(B, A)
 */
export const GENRE_COMPATIBILITY: Record<string, Record<string, CompatibilityScore>> = {
  ...BASE_GENRE_COMPATIBILITY,
  ...V3_GENRE_COMPATIBILITY,
};
