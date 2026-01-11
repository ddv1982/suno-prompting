/**
 * Helper functions for deterministic prompt generation.
 *
 * @module prompt/deterministic/helpers
 */

import { getBlendedBpmRange, formatBpmRange } from '@bun/prompt/bpm';
import { RECORDING_DESCRIPTORS } from '@bun/prompt/tags';

import { MAX_CHARS, DEFAULT_BPM_RANGE, MUSICAL_KEYS, MUSICAL_MODES } from './constants';

/**
 * Truncate a prompt to fit within the MAX_CHARS limit.
 * Truncates from the end to preserve the header and primary fields.
 *
 * @param prompt - The prompt text to truncate
 * @param maxLength - Maximum allowed length
 * @returns Truncated prompt (if needed) or original prompt
 *
 * @example
 * truncatePrompt('very long prompt...', 100) // returns first 100 chars with clean break
 */
export function truncatePrompt(prompt: string, maxLength: number = MAX_CHARS): string {
  if (prompt.length <= maxLength) {
    return prompt;
  }

  let truncated = prompt.slice(0, maxLength);

  const lastQuote = truncated.lastIndexOf('"');
  const lastNewline = truncated.lastIndexOf('\n');
  const breakPoint = Math.max(lastQuote, lastNewline);

  if (breakPoint > maxLength * 0.8) {
    truncated = truncated.slice(0, breakPoint + 1);
  }

  return truncated;
}

/**
 * Select recording context descriptor.
 * Uses provided RNG for deterministic shuffling.
 *
 * @param rng - Random number generator
 * @param count - Number of descriptors to select
 * @returns Recording context string
 *
 * @example
 * selectRecordingContext(Math.random)
 * // "late night studio session vibe, analog four-track warmth"
 */
export function selectRecordingContext(
  rng: () => number = Math.random,
  count: number = 2
): string {
  const shuffled = [...RECORDING_DESCRIPTORS].sort(() => rng() - 0.5);
  const selected = shuffled.slice(0, count);
  return selected.join(', ');
}

/**
 * Get formatted BPM range for a genre string.
 * Supports multi-genre strings like "jazz rock" via getBlendedBpmRange.
 *
 * @param genreString - Genre string (single or compound like "jazz rock")
 * @returns Formatted BPM range string or fallback
 */
export function getBpmRangeForGenre(genreString: string): string {
  const range = getBlendedBpmRange(genreString);
  if (range) {
    return formatBpmRange(range);
  }
  return DEFAULT_BPM_RANGE;
}

/**
 * Select a random musical key.
 *
 * @param rng - Random number generator
 * @returns Musical key (e.g., "C", "D#", "F")
 *
 * @example
 * selectMusicalKey(Math.random) // returns e.g. "D"
 */
export function selectMusicalKey(rng: () => number = Math.random): string {
  const idx = Math.floor(rng() * MUSICAL_KEYS.length);
  return MUSICAL_KEYS[idx] ?? 'C';
}

/**
 * Select a random musical mode.
 *
 * @param rng - Random number generator
 * @returns Musical mode (e.g., "major", "minor", "dorian")
 *
 * @example
 * selectMusicalMode(Math.random) // returns e.g. "minor"
 */
export function selectMusicalMode(rng: () => number = Math.random): string {
  const idx = Math.floor(rng() * MUSICAL_MODES.length);
  return MUSICAL_MODES[idx] ?? 'major';
}

/**
 * Select a random key and mode combination.
 *
 * @param rng - Random number generator
 * @returns Formatted key/mode string (e.g., "Key: D minor")
 *
 * @example
 * selectKeyAndMode(Math.random) // returns e.g. "Key: D minor"
 */
export function selectKeyAndMode(rng: () => number = Math.random): string {
  const key = selectMusicalKey(rng);
  const mode = selectMusicalMode(rng);
  return `Key: ${key} ${mode}`;
}
