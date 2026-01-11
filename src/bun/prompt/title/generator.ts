/**
 * Deterministic Title Generator
 *
 * Generates song titles without LLM calls using genre/mood-based templates.
 * Combines evocative words with musical terms for creative titles.
 *
 * @module prompt/title/generator
 */

import { GENRE_TITLE_PATTERNS, DEFAULT_PATTERNS } from './datasets/modifiers';
import { extractKeywords } from './keyword-extractor';
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
 * @param description - Optional song description for topic-aware word selection
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
 * generateDeterministicTitle('ambient', 'calm', Math.random, 'ocean waves at sunset')
 * // "Ocean Dream" (prioritizes topic keywords)
 */
export function generateDeterministicTitle(
  genre: string,
  mood: string,
  rng: () => number = Math.random,
  description?: string
): string {
  // Get genre-specific patterns or fall back to defaults
  const genreLower = genre.toLowerCase().split(' ')[0] ?? 'pop';
  const patterns = GENRE_TITLE_PATTERNS[genreLower] ?? DEFAULT_PATTERNS;

  // Select a random pattern
  const pattern = selectRandom(patterns, rng);

  // Extract topic keywords if description provided
  const topicKeywords = description ? extractKeywords(description) : undefined;

  // Interpolate with mood-filtered and topic-aware words
  return interpolatePattern(pattern, mood, rng, topicKeywords);
}

/**
 * Generate multiple title options for user selection.
 *
 * @param genre - Target genre
 * @param mood - Current mood
 * @param count - Number of titles to generate
 * @param rng - Random number generator
 * @param description - Optional song description for topic-aware word selection
 * @returns Array of generated titles
 *
 * @example
 * generateTitleOptions('jazz', 'smooth', 3, Math.random)
 * // ["Blue Moon", "Midnight Session", "Cool Echo"]
 *
 * @example
 * generateTitleOptions('jazz', 'smooth', 3, Math.random, 'midnight love song')
 * // ["Midnight Love", "Night Heart", "Evening Dream"] (topic-aware)
 */
export function generateTitleOptions(
  genre: string,
  mood: string,
  count: number = 3,
  rng: () => number = Math.random,
  description?: string
): string[] {
  const titles: string[] = [];
  const seen = new Set<string>();

  // Generate unique titles with bounded attempts to prevent infinite loops
  let attempts = 0;
  const maxAttempts = count * MAX_ATTEMPTS_MULTIPLIER;
  while (titles.length < count && attempts < maxAttempts) {
    const title = generateDeterministicTitle(genre, mood, rng, description);
    if (!seen.has(title.toLowerCase())) {
      seen.add(title.toLowerCase());
      titles.push(title);
    }
    attempts++;
  }

  return titles;
}
