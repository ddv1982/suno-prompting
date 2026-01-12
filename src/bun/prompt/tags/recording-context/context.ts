/**
 * Genre-aware recording context selection
 * @module prompt/tags/recording-context/context
 */

import { selectRecordingDescriptors } from './descriptors';
import { GENRE_RECORDING_CONTEXTS } from './genre-contexts';

/**
 * Select recording context for a genre.
 * Returns genre-specific context if available, otherwise falls back to generic
 * recording descriptors from selectRecordingDescriptors().
 * 
 * New in v2.0.0: Genre-aware recording contexts provide authentic production
 * environments specific to each musical style.
 * 
 * @param genre - Genre name (e.g., 'jazz', 'rock', 'electronic')
 * @param rng - Seeded random number generator for deterministic selection
 * @returns One recording context string
 * 
 * @example
 * // Known genre returns genre-specific context
 * const context = selectRecordingContext('jazz', seedRng(42));
 * // Returns: "intimate jazz club" or similar jazz-specific context
 * 
 * @example
 * // Unknown genre falls back to generic recording descriptor
 * const context = selectRecordingContext('unknown-genre', seedRng(42));
 * // Returns: generic recording context from selectRecordingDescriptors()
 * 
 * @since v2.0.0
 */
export function selectRecordingContext(
  genre: string,
  rng: () => number = Math.random
): string {
  // Normalize genre (lowercase, trim)
  const normalizedGenre = genre.trim().toLowerCase();
  
  // Get genre-specific contexts if available
  const contexts = GENRE_RECORDING_CONTEXTS[normalizedGenre];
  
  if (contexts && contexts.length > 0) {
    // Select random context from genre-specific pool
    const index = Math.floor(rng() * contexts.length);
    const selected = contexts[index];
    if (selected) return selected;
  }
  
  // Fallback to generic recording descriptor
  const fallback = selectRecordingDescriptors(rng, 1);
  const selected = fallback[0];
  return selected ?? 'studio recording';
}
