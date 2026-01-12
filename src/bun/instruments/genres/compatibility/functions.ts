/**
 * Genre Compatibility Functions
 *
 * Functions for querying and working with the genre compatibility matrix.
 *
 * @module instruments/genres/compatibility/functions
 */

import { GENRE_COMPATIBILITY } from './matrix';
import { FUSION_THRESHOLD, type CompatibilityScore } from './types';

/**
 * Get compatibility score between two genres.
 * Performs bidirectional lookup since matrix is symmetric.
 *
 * @param genre1 - First genre key
 * @param genre2 - Second genre key
 * @returns Score 0.0-1.0, where >= FUSION_THRESHOLD allows fusion
 */
export function getCompatibilityScore(genre1: string, genre2: string): CompatibilityScore {
  // Same genre is always fully compatible
  if (genre1 === genre2) {
    return 1.0;
  }

  // Check both directions since we store sparse matrix
  const score =
    GENRE_COMPATIBILITY[genre1]?.[genre2] ?? GENRE_COMPATIBILITY[genre2]?.[genre1] ?? 0.0;

  return score;
}

/**
 * Check if two genres can be fused together.
 * Uses FUSION_THRESHOLD as the minimum compatibility for fusion.
 *
 * @param genre1 - First genre key
 * @param genre2 - Second genre key
 * @returns True if genres can be fused (compatibility >= FUSION_THRESHOLD)
 */
export function canFuse(genre1: string, genre2: string): boolean {
  return getCompatibilityScore(genre1, genre2) >= FUSION_THRESHOLD;
}

/**
 * Validate a compatibility score is within valid range.
 *
 * @param score - Score to validate
 * @returns True if score is in valid range [0.0, 1.0]
 */
export function isValidScore(score: CompatibilityScore): boolean {
  return score >= 0.0 && score <= 1.0;
}

/**
 * Get all genres that are compatible with the given genre.
 *
 * @param genre - Genre key to check compatibility for
 * @returns Array of compatible genre keys with their scores
 */
export function getCompatibleGenres(genre: string): Array<{ genre: string; score: CompatibilityScore }> {
  const compatible: Array<{ genre: string; score: CompatibilityScore }> = [];

  // Check direct entries for this genre
  const directEntries = GENRE_COMPATIBILITY[genre];
  if (directEntries) {
    for (const [otherGenre, score] of Object.entries(directEntries)) {
      if (score >= FUSION_THRESHOLD) {
        compatible.push({ genre: otherGenre, score });
      }
    }
  }

  // Check reverse entries (where this genre is in another genre's map)
  for (const [otherGenre, entries] of Object.entries(GENRE_COMPATIBILITY)) {
    if (otherGenre !== genre && entries[genre] !== undefined) {
      const score = entries[genre];
      if (score >= FUSION_THRESHOLD && !compatible.some((c) => c.genre === otherGenre)) {
        compatible.push({ genre: otherGenre, score });
      }
    }
  }

  return compatible.sort((a, b) => b.score - a.score);
}
