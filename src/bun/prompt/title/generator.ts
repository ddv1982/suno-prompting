/**
 * Deterministic Title Generator
 *
 * Generates song titles without LLM calls using genre/mood-based templates.
 * Combines evocative words with musical terms for creative titles.
 *
 * @module prompt/title/generator
 */

import { GENRE_TITLE_PATTERNS, DEFAULT_PATTERNS } from './datasets/modifiers';
import { selectRandom, interpolatePattern } from './patterns';

// =============================================================================
// Constants
// =============================================================================

/** Multiplier for max attempts when generating unique title options */
const MAX_ATTEMPTS_MULTIPLIER = 3;

// =============================================================================
// Main Functions
// =============================================================================

/**
 * Generate a deterministic song title based on genre and mood.
 *
 * Uses genre-specific patterns combined with mood-filtered word pools
 * to create evocative, contextually appropriate titles.
 *
 * @param genre - Target genre (e.g., "jazz", "rock", "electronic")
 * @param mood - Current mood (e.g., "melancholic", "upbeat", "dark")
 * @param rng - Random number generator for deterministic output
 * @returns Generated title string
 *
 * @example
 * generateDeterministicTitle('jazz', 'melancholic', Math.random)
 * // "Midnight Memory"
 *
 * @example
 * generateDeterministicTitle('rock', 'energetic', Math.random)
 * // "Rising Thunder"
 *
 * @example
 * generateDeterministicTitle('ambient', 'calm', Math.random)
 * // "Ocean Drift"
 */
export function generateDeterministicTitle(
  genre: string,
  mood: string,
  rng: () => number = Math.random
): string {
  // Get genre-specific patterns or fall back to defaults
  const genreLower = genre.toLowerCase().split(' ')[0] ?? 'pop';
  const patterns = GENRE_TITLE_PATTERNS[genreLower] ?? DEFAULT_PATTERNS;

  // Select a random pattern
  const pattern = selectRandom(patterns, rng);

  // Interpolate with mood-filtered words
  return interpolatePattern(pattern, mood, rng);
}

/**
 * Generate multiple title options for user selection.
 *
 * @param genre - Target genre
 * @param mood - Current mood
 * @param count - Number of titles to generate
 * @param rng - Random number generator
 * @returns Array of generated titles
 *
 * @example
 * generateTitleOptions('jazz', 'smooth', 3, Math.random)
 * // ["Blue Moon", "Midnight Session", "Cool Echo"]
 */
export function generateTitleOptions(
  genre: string,
  mood: string,
  count: number = 3,
  rng: () => number = Math.random
): string[] {
  const titles: string[] = [];
  const seen = new Set<string>();

  // Generate unique titles with bounded attempts to prevent infinite loops
  let attempts = 0;
  const maxAttempts = count * MAX_ATTEMPTS_MULTIPLIER;
  while (titles.length < count && attempts < maxAttempts) {
    const title = generateDeterministicTitle(genre, mood, rng);
    if (!seen.has(title.toLowerCase())) {
      seen.add(title.toLowerCase());
      titles.push(title);
    }
    attempts++;
  }

  return titles;
}
