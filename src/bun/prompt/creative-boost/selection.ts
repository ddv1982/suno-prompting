/**
 * Creative Boost Selection Functions
 *
 * Genre, mood, instrument, and title selection logic.
 *
 * @module prompt/creative-boost/selection
 */

import { GENRE_REGISTRY, MULTI_GENRE_COMBINATIONS, type GenreType, selectInstrumentsForGenre as selectInstruments } from '@bun/instruments';
import { filterSunoStylesByMoodCategory, selectMoodsForCategory, type MoodCategory } from '@bun/mood';
import { InvariantError } from '@shared/errors';


import {
  ADVENTUROUS_TRIPLE_PROBABILITY,
  NORMAL_BLEND_PROBABILITY,
  NORMAL_SUFFIX_PROBABILITY,
  SAFE_MULTI_GENRE_PROBABILITY,
} from './constants';
import { CREATIVE_TITLE_WORDS, CREATIVITY_POOLS, HIGH_BASE_GENRES, HIGH_FUSION_GENRES, MOOD_POOLS } from './pools';

import type { CreativityLevel } from '@shared/types';

// =============================================================================
// Helper Functions
// =============================================================================

/**
 * Select a random item from an array using provided RNG.
 * Safe: All callers pass non-empty constant arrays defined in this module.
 */
function selectRandom<T>(items: readonly T[], rng: () => number): T {
  if (items.length === 0) {
    throw new InvariantError('selectRandom called with empty array');
  }
  const idx = Math.floor(rng() * items.length);
  // idx is always valid since 0 <= rng() < 1 and items.length > 0
  return items[idx] as T;
}

/**
 * Select multiple unique random items from an array.
 * Uses Fisher-Yates-like shuffle with provided RNG for determinism.
 */
function selectMultipleUnique<T>(items: readonly T[], count: number, rng: () => number): T[] {
  const shuffled = [...items].sort(() => rng() - 0.5);
  return shuffled.slice(0, count);
}

// =============================================================================
// Genre Selection Functions
// =============================================================================

/**
 * Select genres appropriate for the creativity level.
 *
 * Selection strategy varies by level:
 * - low: Single pure genres only
 * - safe: Prefer established multi-genre combinations from registry
 * - normal: Mix of single genres and two-genre blends
 * - adventurous: Always blends, sometimes three genres
 * - high: Experimental fusions of unusual genre pairs
 *
 * @param level - Creativity level (low, safe, normal, adventurous, high)
 * @param seedGenres - User-provided seed genres to incorporate
 * @param rng - Random number generator for deterministic selection
 * @returns Selected genre string (single or space-separated blend)
 *
 * @example
 * selectGenreForLevel('low', [], () => 0.5);
 * // "jazz" (single genre)
 *
 * @example
 * selectGenreForLevel('adventurous', [], () => 0.5);
 * // "ambient electronic rock" (multi-genre blend)
 *
 * @example
 * selectGenreForLevel('normal', ['jazz', 'rock'], () => 0.1);
 * // "jazz rock" (uses seed genres)
 */
export function selectGenreForLevel(
  level: CreativityLevel,
  seedGenres: string[],
  rng: () => number
): string {
  // If user provided seed genres, use them with appropriate blending
  if (seedGenres.length > 0) {
    return selectFromSeeds(level, seedGenres, rng);
  }

  const pool = CREATIVITY_POOLS[level];

  switch (level) {
    case 'low':
      return selectRandom(pool.genres, rng);

    case 'safe':
      // Prefer established multi-genre combinations from registry
      if (rng() < SAFE_MULTI_GENRE_PROBABILITY && MULTI_GENRE_COMBINATIONS.length > 0) {
        return selectRandom(MULTI_GENRE_COMBINATIONS, rng);
      }
      return selectRandom(pool.genres, rng);

    case 'normal':
      // Sometimes blend, sometimes single
      if (rng() < NORMAL_BLEND_PROBABILITY) {
        const genres = selectMultipleUnique(pool.genres, 2, rng);
        return genres.join(' ');
      }
      return selectRandom(pool.genres, rng);

    case 'adventurous':
      // Always blend, sometimes triple
      const baseCount = rng() < ADVENTUROUS_TRIPLE_PROBABILITY ? 3 : 2;
      const adventurousGenres = selectMultipleUnique(pool.genres, baseCount, rng);
      return adventurousGenres.join(' ');

    case 'high':
      // Experimental fusion: combine unusual genres
      const base = selectRandom(HIGH_BASE_GENRES, rng);
      const fusion = selectRandom(HIGH_FUSION_GENRES, rng);
      return `${base} ${fusion}`;

    default:
      return selectRandom(pool.genres, rng);
  }
}

/**
 * Select genres from user-provided seeds with appropriate blending.
 */
function selectFromSeeds(
  level: CreativityLevel,
  seedGenres: string[],
  rng: () => number
): string {
  const pool = CREATIVITY_POOLS[level];

  if (!pool.allowBlending || pool.maxGenres === 1) {
    // Just return the first seed
    return seedGenres[0] ?? selectRandom(pool.genres, rng);
  }

  // Blend seeds up to max allowed
  const count = Math.min(seedGenres.length, pool.maxGenres);
  return seedGenres.slice(0, count).join(' ');
}

// =============================================================================
// Title Generation
// =============================================================================

/**
 * Generate a creative title based on creativity level.
 *
 * Title complexity scales with creativity:
 * - low/safe: Simple "Adjective Noun" format
 * - normal: Occasionally adds suffix (30% chance)
 * - adventurous/high: Always includes suffix for dramatic effect
 *
 * @param level - Creativity level determining title complexity
 * @param _genre - Selected genre (reserved for future genre-specific titles)
 * @param rng - Random number generator for deterministic selection
 * @returns Generated title string
 *
 * @example
 * generateCreativeBoostTitle('low', 'jazz', () => 0.5);
 * // "Golden Dreams"
 *
 * @example
 * generateCreativeBoostTitle('high', 'experimental', () => 0.5);
 * // "Cosmic Echoes Ascending"
 */
export function generateCreativeBoostTitle(
  level: CreativityLevel,
  _genre: string,
  rng: () => number
): string {
  const adjective = selectRandom(CREATIVE_TITLE_WORDS.adjectives, rng);
  const noun = selectRandom(CREATIVE_TITLE_WORDS.nouns, rng);

  // Higher creativity = more elaborate titles with action suffix
  if (level === 'high' || level === 'adventurous') {
    const suffix = selectRandom(CREATIVE_TITLE_WORDS.suffixes, rng);
    return `${adjective} ${noun} ${suffix}`;
  }

  // Normal level occasionally gets suffix for variety
  if (level === 'normal' && rng() < NORMAL_SUFFIX_PROBABILITY) {
    const suffix = selectRandom(CREATIVE_TITLE_WORDS.suffixes, rng);
    return `${noun} ${suffix}`;
  }

  return `${adjective} ${noun}`;
}

// =============================================================================
// Mood Selection
// =============================================================================

/**
 * Select mood appropriate for creativity level.
 *
 * When moodCategory is provided, uses moods from that category instead of
 * level-based pools. Falls back to level-based pools if category selection
 * returns empty.
 *
 * Mood intensity scales with creativity level:
 * - low: Calm, peaceful moods
 * - safe: Dreamy, nostalgic moods
 * - normal: Mixed emotional range
 * - adventurous: Intense, dramatic moods
 * - high: Extreme, experimental moods
 *
 * @param level - Creativity level to select mood for
 * @param rng - Random number generator for deterministic selection
 * @param moodCategory - Optional mood category to override level-based selection
 * @returns Selected mood string
 *
 * @example
 * selectMoodForLevel('low', () => 0.5);
 * // "mellow"
 *
 * @example
 * selectMoodForLevel('high', () => 0.5);
 * // "psychedelic"
 *
 * @example
 * selectMoodForLevel('normal', () => 0.5, 'calm');
 * // Uses a mood from 'calm' category instead of 'normal' pool
 */
export function selectMoodForLevel(
  level: CreativityLevel,
  rng: () => number,
  moodCategory?: MoodCategory,
): string {
  // If mood category provided, use moods from that category
  if (moodCategory) {
    const categoryMoods = selectMoodsForCategory(moodCategory, 1, rng);
    if (categoryMoods[0]) {
      return categoryMoods[0];
    }
    // Fall through to level-based selection if category returns empty
  }

  const pool = MOOD_POOLS[level];
  return selectRandom(pool, rng);
}

// =============================================================================
// Instrument Selection
// =============================================================================

/**
 * Get instruments for the selected genre from registry.
 *
 * Uses the genre's first word to look up in the GENRE_REGISTRY,
 * then selects up to 4 instruments using the existing selection system.
 *
 * @param genre - Genre string (uses first word for registry lookup)
 * @param rng - Random number generator for deterministic selection
 * @returns Array of 4 instrument names, or fallback instruments if genre not found
 *
 * @example
 * getInstrumentsForGenre('jazz', () => 0.5);
 * // ["Rhodes", "tenor sax", "upright bass", "brushed drums"]
 *
 * @example
 * getInstrumentsForGenre('unknown_genre', () => 0.5);
 * // ["piano", "guitar", "bass", "drums"] (fallback)
 */
export function getInstrumentsForGenre(
  genre: string,
  rng: () => number
): string[] {
  // Try to find the genre in registry using first word
  const baseGenre = genre.split(' ')[0]?.toLowerCase() as GenreType;
  const genreData = GENRE_REGISTRY[baseGenre];

  if (genreData) {
    return selectInstruments(baseGenre, { maxTags: 4, rng });
  }

  // Fallback instruments
  return ['piano', 'guitar', 'bass', 'drums'];
}

// =============================================================================
// Style Filtering
// =============================================================================

/**
 * Get Suno V5 styles filtered by mood category.
 *
 * When a mood category is provided, returns only styles compatible with
 * that category. Falls back to the full style list if the filter returns
 * empty results.
 *
 * @param moodCategory - Optional mood category to filter by
 * @param allStyles - Full list of Suno V5 styles
 * @returns Filtered or full style list
 *
 * @example
 * const styles = getSunoStylesForMoodCategory('groove', ALL_SUNO_STYLES);
 * // Returns styles like 'funk', 'disco', etc.
 *
 * @example
 * const styles = getSunoStylesForMoodCategory(undefined, ALL_SUNO_STYLES);
 * // Returns all styles unchanged
 */
export function getSunoStylesForMoodCategory(
  moodCategory: MoodCategory | undefined,
  allStyles: readonly string[],
): readonly string[] {
  if (!moodCategory) {
    return allStyles;
  }

  const filtered = filterSunoStylesByMoodCategory(moodCategory);

  // Fall back to full list if filter returns empty
  if (filtered.length === 0) {
    return allStyles;
  }

  return filtered;
}
