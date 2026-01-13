import { RHYTHMIC_STYLES } from '@bun/instruments/datasets/rhythm';
import { GENRE_REGISTRY } from '@bun/instruments/genres';
import { HARMONIC_STYLES, ALL_COMBINATIONS } from '@bun/instruments/modes';
import { ALL_POLYRHYTHM_COMBINATIONS, TIME_SIGNATURES, TIME_SIGNATURE_JOURNEYS } from '@bun/instruments/rhythms';
import { findGenreAliasInText } from '@bun/prompt/deterministic/aliases';

import type { RhythmicStyle } from '@bun/instruments/datasets/rhythm';
import type { GenreType } from '@bun/instruments/genres';
import type { HarmonicStyle, CombinationType } from '@bun/instruments/modes';
import type { PolyrhythmCombinationType, TimeSignatureType, TimeSignatureJourneyType } from '@bun/instruments/rhythms';

// Memoization cache for detection functions
// Uses a simple LRU-like approach with max size to prevent memory leaks
const CACHE_MAX_SIZE = 100;
const detectionCache = new Map<string, unknown>();

function memoize<T>(cacheKey: string, compute: () => T): T {
  if (detectionCache.has(cacheKey)) {
    return detectionCache.get(cacheKey) as T;
  }
  
  const result = compute();
  
  // Simple cache eviction: clear half when full
  if (detectionCache.size >= CACHE_MAX_SIZE) {
    const keysToDelete = Array.from(detectionCache.keys()).slice(0, CACHE_MAX_SIZE / 2);
    for (const key of keysToDelete) {
      detectionCache.delete(key);
    }
  }
  
  detectionCache.set(cacheKey, result);
  return result;
}

const HARMONIC_PRIORITY: HarmonicStyle[] = [
  'lydian_dominant', 'lydian_augmented', 'lydian_sharp_two',
  'harmonic_minor', 'melodic_minor',
  'phrygian', 'locrian',
  'dorian', 'mixolydian',
  'lydian', 'aeolian', 'ionian',
];
const RHYTHMIC_PRIORITY: RhythmicStyle[] = ['polyrhythm'];

function detectFromKeywords<K extends string>(
  description: string,
  data: Record<K, { keywords: readonly string[] }>,
  priority: readonly K[]
): K | null {
  const lower = description.toLowerCase();
  for (const key of priority) {
    if (data[key].keywords.some(kw => lower.includes(kw))) {
      return key;
    }
  }
  return null;
}

export function detectHarmonic(description: string): HarmonicStyle | null {
  return memoize(`harmonic:${description}`, () => 
    detectFromKeywords(description, HARMONIC_STYLES, HARMONIC_PRIORITY)
  );
}

export function detectRhythmic(description: string): RhythmicStyle | null {
  return memoize(`rhythmic:${description}`, () =>
    detectFromKeywords(description, RHYTHMIC_STYLES, RHYTHMIC_PRIORITY)
  );
}

export const GENRE_PRIORITY: GenreType[] = [
  'videogame', 'synthwave', 'lofi', 'cinematic',
  'jazz', 'classical', 'folk', 'rnb',
  'country', 'soul', 'blues', 'punk', 'latin', 'symphonic', 'metal', 'trap', 'retro',
  'disco', 'funk', 'reggae', 'afrobeat', 'house', 'trance',
  'downtempo', 'dreampop', 'chillwave', 'newage',
  'hyperpop', 'drill', 'melodictechno', 'indie',
  'electronic', 'rock', 'pop',
  'ambient',
];

/**
 * Mood keyword to genre mapping.
 *
 * Maps common mood/vibe words to appropriate genres. When a mood keyword is
 * detected in a description, one of the associated genres can be selected.
 *
 * Design rationale:
 * - Each mood maps to 3-4 genres for variety
 * - Genres are ordered by relevance (most relevant first)
 * - Covers emotional spectrum: chill, energetic, dark, dreamy, groovy, etc.
 */
export const MOOD_TO_GENRE = {
  // Chill/Relaxed moods
  chill: ['lofi', 'ambient', 'chillwave', 'downtempo'],
  relaxed: ['ambient', 'lofi', 'bossanova', 'newage'],
  peaceful: ['ambient', 'newage', 'classical', 'folk'],
  calm: ['ambient', 'newage', 'lofi', 'classical'],
  mellow: ['lofi', 'jazz', 'soul', 'bossanova'],
  soothing: ['ambient', 'newage', 'classical', 'folk'],

  // Energetic moods
  energetic: ['electronic', 'house', 'rock', 'punk'],
  upbeat: ['pop', 'disco', 'funk', 'house'],
  hype: ['trap', 'drill', 'hyperpop', 'hardstyle'],
  party: ['house', 'disco', 'electronic', 'pop'],
  dance: ['house', 'electronic', 'disco', 'trance'],
  pumped: ['metal', 'rock', 'hardstyle', 'drumandbass'],

  // Dark/Moody moods
  dark: ['darksynth', 'metal', 'ambient', 'postpunk'],
  moody: ['shoegaze', 'dreampop', 'postpunk', 'emo'],
  haunting: ['ambient', 'darksynth', 'classical', 'cinematic'],
  melancholy: ['emo', 'shoegaze', 'folk', 'blues'],
  gloomy: ['postpunk', 'shoegaze', 'darksynth', 'ambient'],
  brooding: ['darksynth', 'metal', 'postpunk', 'cinematic'],

  // Intense moods
  intense: ['metal', 'dubstep', 'hardstyle', 'drumandbass'],
  aggressive: ['metal', 'punk', 'hardstyle', 'drill'],
  powerful: ['cinematic', 'symphonic', 'metal', 'rock'],
  epic: ['cinematic', 'symphonic', 'metal', 'classical'],
  dramatic: ['cinematic', 'classical', 'symphonic', 'darksynth'],

  // Dreamy moods
  dreamy: ['dreampop', 'shoegaze', 'ambient', 'chillwave'],
  ethereal: ['ambient', 'dreampop', 'newage', 'shoegaze'],
  spacey: ['ambient', 'electronic', 'trance', 'idm'],
  cosmic: ['ambient', 'trance', 'synthwave', 'electronic'],
  floating: ['ambient', 'dreampop', 'chillwave', 'newage'],

  // Groovy moods
  groovy: ['funk', 'disco', 'house', 'soul'],
  funky: ['funk', 'disco', 'soul', 'afrobeat'],
  rhythmic: ['afrobeat', 'latin', 'funk', 'breakbeat'],
  bouncy: ['house', 'disco', 'pop', 'funk'],

  // Nostalgic/Retro moods
  nostalgic: ['synthwave', 'retro', 'lofi', 'soul'],
  retro: ['synthwave', 'retro', 'disco', 'funk'],
  vintage: ['jazz', 'soul', 'blues', 'retro'],

  // Emotional moods
  sad: ['emo', 'blues', 'folk', 'classical'],
  happy: ['pop', 'disco', 'funk', 'reggae'],
  romantic: ['jazz', 'soul', 'bossanova', 'classical'],
  uplifting: ['trance', 'house', 'pop', 'gospel'],

  // Experimental moods
  experimental: ['idm', 'breakbeat', 'mathrock', 'hyperpop'],
  weird: ['idm', 'hyperpop', 'breakbeat', 'mathrock'],
  glitchy: ['idm', 'dubstep', 'breakbeat', 'hyperpop'],
} as const satisfies Record<string, readonly GenreType[]>;

/**
 * Detect genre from mood keywords in a description.
 *
 * Searches the description for mood keywords and returns a random genre
 * from the matching mood's genre list. Returns the first mood match found.
 *
 * @param description - User's song description
 * @param rng - Random number generator for selecting from genre list
 * @returns A GenreType if mood keyword found, null otherwise
 *
 * @example
 * detectGenreFromMood('something chill and relaxing', Math.random)
 * // Could return 'lofi', 'ambient', 'chillwave', or 'downtempo'
 */
export function detectGenreFromMood(
  description: string,
  rng: () => number = Math.random
): GenreType | null {
  if (!description || typeof description !== 'string') {
    return null;
  }

  const lower = description.toLowerCase();

  for (const [mood, genres] of Object.entries(MOOD_TO_GENRE)) {
    if (lower.includes(mood)) {
      // Return random genre from matching mood's genre list
      const idx = Math.floor(rng() * genres.length);
      return genres[idx] ?? null;
    }
  }

  return null;
}

/**
 * Core genre detection from keywords only (memoized).
 *
 * Checks genre names and keywords against the description. This is the base
 * detection function without alias or mood fallbacks.
 *
 * @internal
 */
function detectGenreCore(description: string): GenreType | null {
  const lower = description.toLowerCase();
  for (const key of GENRE_PRIORITY) {
    const genre = GENRE_REGISTRY[key];
    // Match against name (case-insensitive)
    if (lower.includes(genre.name.toLowerCase())) {
      return key;
    }
    // Match against keywords
    if (genre.keywords.some((kw) => lower.includes(kw))) {
      return key;
    }
  }
  return null;
}

/**
 * Detect genre from description with enhanced matching.
 *
 * Detection priority:
 * 1. Direct genre name match (e.g., "jazz")
 * 2. Genre keyword match (e.g., "smooth jazz", "bebop")
 * 3. Genre alias match (e.g., "hip hop" → trap, "r&b" → rnb)
 * 4. (Optional) Mood keyword match if rng provided (e.g., "chill" → lofi)
 *
 * Results are memoized for performance. Note that mood detection with rng
 * uses a separate cache key to handle the random selection properly.
 *
 * @param description - User's song description
 * @param rng - Optional RNG for mood-based detection fallback
 * @returns Detected GenreType or null if no match found
 *
 * @example
 * detectGenre('smooth jazz night') // returns 'jazz'
 * detectGenre('hip hop beats') // returns 'trap' (via alias)
 * detectGenre('something chill', Math.random) // returns lofi/ambient/etc (via mood)
 */
export function detectGenre(description: string, rng?: () => number): GenreType | null {
  // For memoization, we need different cache keys for RNG vs non-RNG calls
  // Non-RNG calls are deterministic and can be fully memoized
  // RNG calls should still cache the detection up to mood, but mood is random
  const cacheKey = `genre:${description}`;

  // First, try to get cached result (without mood detection)
  const cachedResult = memoize(cacheKey, () => {
    // 1. Check for direct genre name or keywords
    const coreResult = detectGenreCore(description);
    if (coreResult) {
      return { genre: coreResult, source: 'core' as const };
    }

    // 2. Check for genre aliases
    const aliasResult = findGenreAliasInText(description);
    if (aliasResult) {
      return { genre: aliasResult, source: 'alias' as const };
    }

    // Return null to indicate we need mood detection as fallback
    return { genre: null, source: 'none' as const };
  });

  // If we found a genre from core or alias, return it
  if (cachedResult.genre) {
    return cachedResult.genre;
  }

  // 3. Try mood-based detection only if rng is provided
  // This is not memoized since it involves randomness
  if (rng) {
    const moodResult = detectGenreFromMood(description, rng);
    if (moodResult) {
      return moodResult;
    }
  }

  return null;
}

export function detectAmbient(description: string): boolean {
  return detectGenre(description) === 'ambient';
}

const COMBINATION_PRIORITY: CombinationType[] = [
  'major_minor', 'lydian_minor', 'lydian_major', 'dorian_lydian',
  'harmonic_major', 'phrygian_major',
  'minor_journey', 'lydian_exploration', 'major_modes', 'dark_modes',
];

export function detectCombination(description: string): CombinationType | null {
  return memoize(`combination:${description}`, () =>
    detectFromKeywords(description, ALL_COMBINATIONS, COMBINATION_PRIORITY)
  );
}

const POLYRHYTHM_COMBINATION_PRIORITY: PolyrhythmCombinationType[] = [
  'complexity_build', 'triplet_exploration', 'odd_journey', 'tension_arc',
  'groove_to_drive', 'tension_release', 'afrobeat_journey', 'complex_simple',
];

export function detectPolyrhythmCombination(description: string): PolyrhythmCombinationType | null {
  return memoize(`polyrhythm:${description}`, () =>
    detectFromKeywords(description, ALL_POLYRHYTHM_COMBINATIONS, POLYRHYTHM_COMBINATION_PRIORITY)
  );
}

const TIME_SIGNATURE_PRIORITY: TimeSignatureType[] = [
  'time_13_8', 'time_11_8', 'time_15_8',
  'time_9_8', 'time_7_8', 'time_7_4',
  'time_5_8', 'time_5_4',
  'time_6_8', 'time_3_4', 'time_4_4',
];

export function detectTimeSignature(description: string): TimeSignatureType | null {
  return memoize(`timesig:${description}`, () =>
    detectFromKeywords(description, TIME_SIGNATURES, TIME_SIGNATURE_PRIORITY)
  );
}

const TIME_SIGNATURE_JOURNEY_PRIORITY: TimeSignatureJourneyType[] = [
  'prog_odyssey', 'balkan_fusion', 'jazz_exploration',
  'math_rock_descent', 'celtic_journey', 'metal_complexity', 'gentle_odd',
];

export function detectTimeSignatureJourney(description: string): TimeSignatureJourneyType | null {
  return memoize(`journey:${description}`, () =>
    detectFromKeywords(description, TIME_SIGNATURE_JOURNEYS, TIME_SIGNATURE_JOURNEY_PRIORITY)
  );
}
