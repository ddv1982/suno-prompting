/**
 * Genre-aware recording context selection
 * @module prompt/tags/recording-context/context
 */

import { selectRecordingDescriptors } from './descriptors';
import { GENRE_RECORDING_CONTEXTS } from './genre-contexts';

/**
 * Scene-based recording context keyword mappings.
 *
 * Maps keywords found in scene descriptions to appropriate recording contexts.
 * Used by selectRecordingContextWithScene() to override genre-based selection
 * when the scene implies a specific recording environment.
 *
 * @since v2.1.0
 */
const SCENE_RECORDING_KEYWORDS: Record<string, readonly string[]> = {
  studio: ['professional studio', 'tracked in a studio', 'studio recording'],
  live: ['live room sound', 'live concert', 'live performance'],
  bedroom: ['bedroom production', 'home recording', 'intimate recording'],
  outdoor: ['outdoor ambience', 'field recording', 'natural acoustics'],
  club: ['club sound system', 'dancefloor ready', 'DJ booth mixing'],
} as const;

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

/**
 * Select recording context with scene-based override.
 *
 * Parses the scene description for recording environment hints (studio, live,
 * bedroom, outdoor, club) and returns a scene-matched context if found.
 * Falls back to genre-based selection when no keyword match is found.
 *
 * This enables more contextually appropriate recording descriptors when the
 * user's description implies a specific recording environment.
 *
 * @param genre - Genre name for fallback selection
 * @param rng - Seeded random number generator for deterministic selection
 * @param scene - Optional scene description to parse for recording hints
 * @returns One recording context string
 *
 * @example
 * // Scene with "studio" keyword returns studio-related context
 * selectRecordingContextWithScene('jazz', rng, 'recording in a studio session')
 * // Returns: "professional studio" or "tracked in a studio" or "studio recording"
 *
 * @example
 * // Scene with "live" keyword returns live performance context
 * selectRecordingContextWithScene('rock', rng, 'live concert at the arena')
 * // Returns: "live room sound" or "live concert" or "live performance"
 *
 * @example
 * // Scene without keyword falls back to genre-based selection
 * selectRecordingContextWithScene('jazz', rng, 'walking in the park')
 * // Returns: genre-specific context (e.g., "intimate jazz club")
 *
 * @since v2.1.0
 */
export function selectRecordingContextWithScene(
  genre: string,
  rng: () => number,
  scene?: string
): string {
  // Check for scene-based override
  if (scene) {
    const lower = scene.toLowerCase();
    for (const [keyword, contexts] of Object.entries(SCENE_RECORDING_KEYWORDS)) {
      if (lower.includes(keyword)) {
        // Select random context from keyword-matched pool
        const index = Math.floor(rng() * contexts.length);
        const selected = contexts[index];
        if (selected) return selected;
      }
    }
  }

  // Fall back to genre-based selection
  return selectRecordingContext(genre, rng);
}
