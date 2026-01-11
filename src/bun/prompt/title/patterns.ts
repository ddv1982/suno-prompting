/**
 * Title pattern utilities for title generation
 *
 * Contains helper functions for pattern interpolation and
 * mood-based word filtering.
 *
 * @module prompt/title/patterns
 */

import { InvariantError } from '@shared/errors';

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
  if (items.length === 0) {
    throw new InvariantError('selectRandom called with empty array');
  }
  const idx = Math.floor(rng() * items.length);
  const item = items[idx];
  if (item === undefined) {
    // Fallback to first item (should never happen with valid index)
    return items[0] as T;
  }
  return item;
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
 * Get a word from a category, filtered by mood and optional topic keywords.
 *
 * @param category - Word category
 * @param mood - Current mood
 * @param rng - Random number generator
 * @param topicKeywords - Optional topic-specific keywords to prioritize
 * @returns Selected word
 */
export function getWord(
  category: 'time' | 'nature' | 'emotion' | 'action' | 'abstract',
  mood: string,
  rng: () => number,
  topicKeywords?: Record<string, string[]>
): string {
  const pools: Record<string, readonly string[]> = {
    time: TIME_WORDS,
    nature: NATURE_WORDS,
    emotion: EMOTION_WORDS,
    action: ACTION_WORDS,
    abstract: ABSTRACT_WORDS,
  };

  const pool = pools[category] ?? EMOTION_WORDS;

  // If topic keywords are available, prioritize them OVER mood filtering
  if (topicKeywords && topicKeywords[category] && topicKeywords[category].length > 0) {
    const topicRelevant = pool.filter(word => topicKeywords[category]?.includes(word));
    if (topicRelevant.length > 0) {
      // Use topic keywords directly without mood filtering
      // (topic relevance is more important than mood filtering)
      return selectRandom(topicRelevant, rng);
    }
  }

  // No topic keywords, so apply mood filtering as usual
  const filtered = filterByMood(pool, mood, rng);
  return selectRandom(filtered, rng);
}

/**
 * Interpolate a title pattern with words.
 *
 * @param pattern - Pattern string with placeholders
 * @param mood - Current mood for word selection
 * @param rng - Random number generator
 * @param topicKeywords - Optional topic-specific keywords to prioritize
 * @returns Interpolated title
 *
 * @example
 * interpolatePattern('{time} {emotion}', 'melancholic', Math.random)
 * // "Midnight Shadow"
 *
 * @example
 * interpolatePattern('{time} {emotion}', 'melancholic', Math.random, {time: ['Midnight'], emotion: ['Lost']})
 * // "Midnight Lost" (prioritizes topic keywords)
 */
export function interpolatePattern(
  pattern: string,
  mood: string,
  rng: () => number,
  topicKeywords?: Record<string, string[]>
): string {
  return pattern
    .replace('{time}', getWord('time', mood, rng, topicKeywords))
    .replace('{nature}', getWord('nature', mood, rng, topicKeywords))
    .replace('{emotion}', getWord('emotion', mood, rng, topicKeywords))
    .replace('{action}', getWord('action', mood, rng, topicKeywords))
    .replace('{abstract}', getWord('abstract', mood, rng, topicKeywords));
}
