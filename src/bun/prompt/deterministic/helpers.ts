/**
 * Helper functions for deterministic prompt generation.
 *
 * @module prompt/deterministic/helpers
 */

import { getBlendedBpmRange, formatBpmRange } from '@bun/prompt/bpm';
import { selectRecordingDescriptors as selectRecordingDescriptorsNew } from '@bun/prompt/tags';
import { traceDecision } from '@bun/trace';

import { MAX_CHARS, DEFAULT_BPM_RANGE, MUSICAL_KEYS, MUSICAL_MODES } from './constants';

import type { TraceCollector } from '@bun/trace';

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
 * Join recording descriptors into a comma-separated string.
 * Uses structured categories with conflict prevention.
 *
 * @param rng - Random number generator
 * @param count - Number of descriptors to select
 * @returns Recording context string (comma-separated)
 *
 * @example
 * joinRecordingDescriptors(Math.random)
 * // "professional mastering polish, studio session warmth"
 */
export function joinRecordingDescriptors(
  rng: () => number = Math.random,
  count: number = 2,
  trace?: TraceCollector
): string {
  const selected = selectRecordingDescriptorsNew(rng, count);

  traceDecision(trace, {
    domain: 'recording',
    key: 'deterministic.recording.descriptors',
    branchTaken: 'selectRecordingDescriptors',
    why: `count=${count} selected=${selected.length}`,
    selection: {
      method: 'shuffleSlice',
      candidates: selected,
    },
  });

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

export function getBpmRangeForGenreWithTrace(
  genreString: string,
  trace?: TraceCollector
): string {
  const range = getBlendedBpmRange(genreString);
  if (range) {
    const formatted = formatBpmRange(range);
    traceDecision(trace, {
      domain: 'bpm',
      key: 'deterministic.bpm.range',
      branchTaken: 'blended',
      why: `genre=${genreString} range=${formatted}`,
    });
    return formatted;
  }

  traceDecision(trace, {
    domain: 'bpm',
    key: 'deterministic.bpm.range',
    branchTaken: 'fallback',
    why: `no BPM range found for genre=${genreString}; using default`,
  });

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
  const key = MUSICAL_KEYS[idx] ?? 'C';
  return key;
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
  const mode = MUSICAL_MODES[idx] ?? 'major';
  return mode;
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

export function selectKeyAndModeWithTrace(
  rng: () => number = Math.random,
  trace?: TraceCollector
): string {
  const keyIdx = Math.floor(rng() * MUSICAL_KEYS.length);
  const modeIdx = Math.floor(rng() * MUSICAL_MODES.length);
  const key = MUSICAL_KEYS[keyIdx] ?? 'C';
  const mode = MUSICAL_MODES[modeIdx] ?? 'major';

  traceDecision(trace, {
    domain: 'other',
    key: 'deterministic.keyMode.select',
    branchTaken: 'random',
    why: `key=${key} mode=${mode}`,
    selection: {
      method: 'index',
      chosenIndex: keyIdx,
      candidates: MUSICAL_KEYS,
      rolls: [modeIdx],
    },
  });

  return `Key: ${key} ${mode}`;
}
