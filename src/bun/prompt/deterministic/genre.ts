/**
 * Genre detection and resolution for deterministic prompt generation.
 *
 * @module prompt/deterministic/genre
 */

import { detectGenre } from '@bun/instruments/detection';
import { createLogger } from '@bun/logger';
import { parseGenreComponents } from '@bun/prompt/genre-parser';
import { traceDecision } from '@bun/trace';

import { ALL_GENRE_KEYS } from './constants';

import type { ResolvedGenre } from './types';
import type { GenreType } from '@bun/instruments/genres';
import type { TraceCollector } from '@bun/trace';

const log = createLogger('DeterministicBuilder');

/**
 * Detect genre from description using keyword matching only.
 * No LLM spelling correction - silently ignores unrecognized words.
 *
 * @param description - User's song description
 * @returns Detected GenreType or null if no keywords match
 *
 * @example
 * detectGenreKeywordsOnly('smooth jazz night') // returns 'jazz'
 * detectGenreKeywordsOnly('something cool') // returns null
 */
export function detectGenreKeywordsOnly(description: string): GenreType | null {
  if (!description || typeof description !== 'string') {
    return null;
  }
  return detectGenre(description);
}

/**
 * Select a random genre from the registry.
 * Used as fallback when no genre is detected.
 *
 * @param rng - Random number generator
 * @returns Random GenreType from GENRE_REGISTRY
 *
 * @example
 * selectRandomGenre(Math.random) // returns e.g. 'jazz'
 */
export function selectRandomGenre(rng: () => number = Math.random): GenreType {
  const idx = Math.floor(rng() * ALL_GENRE_KEYS.length);
  return ALL_GENRE_KEYS[idx] ?? 'pop';
}

/**
 * Parse multi-genre strings (comma-separated).
 * Returns the first detected genre from the string.
 *
 * @param description - Description that may contain multiple genres
 * @returns First detected genre or null
 *
 * @example
 * parseMultiGenre('jazz, rock fusion') // returns 'jazz'
 */
export function parseMultiGenre(description: string): GenreType | null {
  if (!description) return null;

  const parts = description.split(',').map((p) => p.trim());
  for (const part of parts) {
    const detected = detectGenreKeywordsOnly(part);
    if (detected) return detected;
  }

  return detectGenreKeywordsOnly(description);
}

/**
 * Resolve the effective genre from description and optional override.
 * Supports compound genre strings like "jazz rock" or "jazz, metal".
 * Priority: genreOverride > detected genre > random fallback
 *
 * @param description - User's song description
 * @param genreOverride - Optional genre override (can be compound like "jazz rock")
 * @param rng - Random number generator
 * @returns Resolved genre with display string and components for blending
 *
 * @example
 * resolveGenre('smooth jazz night', undefined, Math.random)
 * // { detected: 'jazz', displayGenre: 'jazz', primaryGenre: 'jazz', components: ['jazz'] }
 *
 * @example
 * resolveGenre('random words', 'jazz rock', Math.random)
 * // { detected: null, displayGenre: 'jazz rock', primaryGenre: 'jazz', components: ['jazz', 'rock'] }
 */
export function resolveGenre(
  description: string,
  genreOverride: string | undefined,
  rng: () => number,
  trace?: TraceCollector
): ResolvedGenre {
  // 1. Try genre override - supports both single and compound genres
  if (genreOverride) {
    const components = parseGenreComponents(genreOverride);
    if (components.length > 0) {
      traceDecision(trace, {
        domain: 'genre',
        key: 'deterministic.genre.resolve',
        branchTaken: 'override',
        why: `genreOverride provided (${components.length} component(s))`,
      });

      const primaryGenre = components[0] ?? 'pop';
      return {
        detected: null,
        displayGenre: genreOverride.toLowerCase().trim(),
        primaryGenre,
        components,
      };
    }
    log.warn('invalid_genre_override', { genreOverride });
  }

  // 2. Try keyword detection from description
  const detected = detectGenreKeywordsOnly(description);
  if (detected) {
    traceDecision(trace, {
      domain: 'genre',
      key: 'deterministic.genre.resolve',
      branchTaken: 'keyword-detection',
      why: `detected=${detected}`,
    });

    return {
      detected,
      displayGenre: detected,
      primaryGenre: detected,
      components: [detected],
    };
  }

  // 3. Fallback to random genre
  const idx = Math.floor(rng() * ALL_GENRE_KEYS.length);
  const randomGenre = ALL_GENRE_KEYS[idx] ?? 'pop';

  traceDecision(trace, {
    domain: 'genre',
    key: 'deterministic.genre.resolve',
    branchTaken: 'random-fallback',
    why: 'no keywords matched; falling back to random genre',
    selection: {
      method: 'pickRandom',
      chosenIndex: idx,
      candidates: ALL_GENRE_KEYS,
    },
  });

  return {
    detected: null,
    displayGenre: randomGenre,
    primaryGenre: randomGenre,
    components: [randomGenre],
  };
}
