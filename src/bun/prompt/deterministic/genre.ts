/**
 * Genre detection and resolution for deterministic prompt generation.
 *
 * @module prompt/deterministic/genre
 */

import { detectGenre, detectGenreFromMood, GENRE_PRIORITY } from '@bun/instruments/detection';
import { GENRE_REGISTRY } from '@bun/instruments/genres';
import { createLogger } from '@bun/logger';
import { findGenreAliasInText } from '@bun/prompt/deterministic/aliases';
import { parseGenreComponents } from '@bun/prompt/genre-parser';
import { traceDecision } from '@bun/trace';
import { matchesWholeWord } from '@shared/utils/string';

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
 * Maximum number of genres to detect for auto-blending.
 * Prevents overly complex genre combinations.
 */
const MAX_DETECTED_GENRES = 4;

/**
 * Match genres from a list against description text using word boundary matching.
 * Mutates detected and seen arrays for efficiency.
 *
 * Uses word boundary matching to avoid false positives like:
 * - "disco" matching "discovering"
 * - "pop" matching "popular"
 */
function matchGenresFromList(
  description: string,
  genreKeys: readonly GenreType[],
  detected: GenreType[],
  seen: Set<GenreType>
): void {
  for (const key of genreKeys) {
    if (detected.length >= MAX_DETECTED_GENRES) return;
    if (seen.has(key)) continue;

    const genre = GENRE_REGISTRY[key];
    const nameMatch = matchesWholeWord(description, genre.name);
    const keywordMatch = genre.keywords.some((kw) => matchesWholeWord(description, kw));

    if (nameMatch || keywordMatch) {
      detected.push(key);
      seen.add(key);
    }
  }
}

/**
 * Detect all genres mentioned in a description for auto-blending.
 *
 * Searches the description for genre names, keywords, and aliases.
 * Returns all detected genres in priority order (first detected = primary).
 *
 * @param description - User's song description
 * @returns Array of detected GenreTypes (max 4, no duplicates)
 *
 * @example
 * detectAllGenres('jazz rock fusion') // returns ['jazz', 'rock']
 * detectAllGenres('chill lofi hip hop') // returns ['lofi', 'trap']
 * detectAllGenres('ambient jazz metal house rock') // returns ['jazz', 'metal', 'house', 'rock'] (max 4)
 */
export function detectAllGenres(description: string): GenreType[] {
  if (!description || typeof description !== 'string') {
    return [];
  }

  const detected: GenreType[] = [];
  const seen = new Set<GenreType>();

  // 1. Check priority genres first (most common/important)
  matchGenresFromList(description, GENRE_PRIORITY, detected, seen);

  // 2. Check remaining genres not in priority list
  matchGenresFromList(description, ALL_GENRE_KEYS, detected, seen);

  // 3. Check for genre aliases if we have room
  if (detected.length < MAX_DETECTED_GENRES) {
    const aliasGenre = findGenreAliasInText(description);
    if (aliasGenre && !seen.has(aliasGenre)) {
      detected.push(aliasGenre);
    }
  }

  return detected;
}

/**
 * Resolve the effective genre from description and optional override.
 *
 * Supports compound genre strings like "jazz rock" or "jazz, metal".
 *
 * Detection priority:
 * 1. Genre override (if provided)
 * 2. Multi-keyword detection from description (e.g., "jazz rock" → ['jazz', 'rock'])
 * 3. Mood-based detection (e.g., "chill vibes" → lofi)
 * 4. Random fallback
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
 * resolveGenre('jazz rock fusion', undefined, Math.random)
 * // { detected: 'jazz', displayGenre: 'jazz rock', primaryGenre: 'jazz', components: ['jazz', 'rock'] }
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

  // 2. Try multi-keyword detection from description
  const detectedGenres = detectAllGenres(description);
  if (detectedGenres.length > 0) {
    const primaryGenre = detectedGenres[0] ?? 'pop';

    // For display, join multiple genres or use single genre
    const displayGenre = detectedGenres.length > 1 ? detectedGenres.join(' ') : primaryGenre;

    traceDecision(trace, {
      domain: 'genre',
      key: 'deterministic.genre.resolve',
      branchTaken: detectedGenres.length > 1 ? 'multi-keyword-detection' : 'keyword-detection',
      why: `detected=${detectedGenres.join(', ')}`,
    });

    return {
      detected: primaryGenre,
      displayGenre,
      primaryGenre,
      components: detectedGenres,
    };
  }

  // 3. Try mood-based detection as fallback
  const moodGenre = detectGenreFromMood(description, rng);
  if (moodGenre) {
    traceDecision(trace, {
      domain: 'genre',
      key: 'deterministic.genre.resolve',
      branchTaken: 'mood-detection',
      why: `mood-based detection: ${moodGenre}`,
    });

    return {
      detected: moodGenre,
      displayGenre: moodGenre,
      primaryGenre: moodGenre,
      components: [moodGenre],
    };
  }

  // 4. Fallback to random genre
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
