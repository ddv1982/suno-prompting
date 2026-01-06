/**
 * Title pattern utilities for title generation
 *
 * Contains helper functions for pattern interpolation and
 * mood-based word filtering.
 *
 * @module prompt/title/patterns
 */

import { EMOTION_WORDS, ACTION_WORDS, MOOD_WORD_WEIGHTS } from './datasets/emotions';
import { TIME_WORDS, NATURE_WORDS, ABSTRACT_WORDS } from './datasets/imagery';

// =============================================================================
// Constants
// =============================================================================

/** Probability of using mood-preferred words when available (0-1) */
const PREFERRED_MOOD_PROBABILITY = 0.7;

// =============================================================================
// Helper Functions
// =============================================================================

/**
 * Select a random item from an array using provided RNG.
 *
 * @param items - Array to select from
 * @param rng - Random number generator
 * @returns Selected item
 */
export function selectRandom<T>(items: readonly T[], rng: () => number): T {
  const idx = Math.floor(rng() * items.length);
  // Safe: All callers pass non-empty constant arrays
  return items[idx] ?? items[0]!;
}

/**
 * Filter words based on mood preferences.
 *
 * @param words - Word pool to filter
 * @param mood - Current mood
 * @param rng - Random number generator
 * @returns Filtered or weighted word pool
 */
function filterByMood(words: readonly string[], mood: string, rng: () => number): readonly string[] {
  const moodLower = mood.toLowerCase();
  const weights = MOOD_WORD_WEIGHTS[moodLower];

  if (!weights) return words;

  // Prefer mood-appropriate words
  const preferred = words.filter((w) => weights.preferred.includes(w));
  const neutral = words.filter((w) => !weights.avoid.includes(w) && !weights.preferred.includes(w));

  // Use preferred words based on configured probability
  if (preferred.length > 0 && rng() < PREFERRED_MOOD_PROBABILITY) {
    return preferred;
  }

  // Otherwise use neutral words
  return neutral.length > 0 ? neutral : words;
}

/**
 * Get a word from a category, filtered by mood.
 *
 * @param category - Word category
 * @param mood - Current mood
 * @param rng - Random number generator
 * @returns Selected word
 */
export function getWord(
  category: 'time' | 'nature' | 'emotion' | 'action' | 'abstract',
  mood: string,
  rng: () => number
): string {
  const pools: Record<string, readonly string[]> = {
    time: TIME_WORDS,
    nature: NATURE_WORDS,
    emotion: EMOTION_WORDS,
    action: ACTION_WORDS,
    abstract: ABSTRACT_WORDS,
  };

  const pool = pools[category] ?? EMOTION_WORDS;
  const filtered = filterByMood(pool, mood, rng);
  return selectRandom(filtered, rng);
}

/**
 * Interpolate a title pattern with words.
 *
 * @param pattern - Pattern string with placeholders
 * @param mood - Current mood for word selection
 * @param rng - Random number generator
 * @returns Interpolated title
 *
 * @example
 * interpolatePattern('{time} {emotion}', 'melancholic', Math.random)
 * // "Midnight Shadow"
 */
export function interpolatePattern(pattern: string, mood: string, rng: () => number): string {
  return pattern
    .replace('{time}', getWord('time', mood, rng))
    .replace('{nature}', getWord('nature', mood, rng))
    .replace('{emotion}', getWord('emotion', mood, rng))
    .replace('{action}', getWord('action', mood, rng))
    .replace('{abstract}', getWord('abstract', mood, rng));
}
