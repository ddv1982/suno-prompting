/**
 * Creative Boost Selection Functions
 *
 * Genre, mood, instrument, and title selection logic.
 *
 * @module prompt/creative-boost/selection
 */

import { GENRE_REGISTRY, MULTI_GENRE_COMBINATIONS, type GenreType, selectInstrumentsForGenre as selectInstruments } from '@bun/instruments';
import { filterSunoStylesByMoodCategory, selectMoodsForCategory, type MoodCategory } from '@bun/mood';
import { selectRandom, selectRandomN } from '@shared/utils/random';

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
 * Select multiple unique random items from an array.
 * Uses proper Fisher-Yates shuffle with provided RNG for determinism.
 */
function selectMultipleUnique<T>(items: readonly T[], count: number, rng: () => number): T[] {
  return selectRandomN(items, Math.min(count, items.length), rng);
}

// =============================================================================
// Genre Selection Functions
// =============================================================================

/**
 * Modifiers to enhance detected genres at high creativity levels.
 * These are prefixes/suffixes that make a genre more experimental
 * without completely replacing it.
 */
const HIGH_CREATIVITY_MODIFIERS: readonly string[] = [
  'dark', 'lo-fi', 'experimental', 'psychedelic', 'industrial',
  'glitch', 'noise', 'drone', 'cosmic', 'post',
];

const ADVENTUROUS_MODIFIERS: readonly string[] = [
  'neo', 'synth', 'acid', 'space', 'hyper', 'micro', 'art',
];

/**
 * Select genres appropriate for the creativity level.
 *
 * Selection strategy varies by level:
 * - low: Single pure genres only (uses detected or random)
 * - safe: Prefer established multi-genre combinations from registry
 * - normal: Mix of single genres and two-genre blends
 * - adventurous: Enhances detected genre with modifier, or blends multiple
 * - high: Enhances detected genre with experimental modifier, or random fusion
 *
 * IMPORTANT: When genres are detected from description, they are used as the
 * BASE and enhanced with modifiers - not replaced. This preserves user intent.
 *
 * @param level - Creativity level (low, safe, normal, adventurous, high)
 * @param seedGenres - User-provided seed genres or detected genres to incorporate
 * @param rng - Random number generator for deterministic selection
 * @returns Selected genre string (single or space-separated blend)
 *
 * @example
 * selectGenreForLevel('low', [], () => 0.5);
 * // "jazz" (random single genre)
 *
 * @example
 * selectGenreForLevel('high', ['ambient'], () => 0.5);
 * // "dark ambient" (detected genre enhanced with modifier)
 *
 * @example
 * selectGenreForLevel('high', [], () => 0.5);
 * // "noise gospel" (no detection, random experimental fusion)
 */
export function selectGenreForLevel(
  level: CreativityLevel,
  seedGenres: string[],
  rng: () => number
): string {
  // If user provided/detected genres, use them with appropriate enhancement
  if (seedGenres.length > 0) {
    return enhanceDetectedGenres(level, seedGenres, rng);
  }

  // No genres detected - use level-appropriate random selection
  return selectRandomForLevel(level, rng);
}

/**
 * Enhance detected genres based on creativity level.
 * Preserves the detected genre as base and applies level-appropriate modifications.
 */
function enhanceDetectedGenres(
  level: CreativityLevel,
  detectedGenres: string[],
  rng: () => number
): string {
  const primaryGenre = detectedGenres[0] ?? 'pop';
  const pool = CREATIVITY_POOLS[level];

  switch (level) {
    case 'low':
      // Just use the detected genre as-is
      return primaryGenre;

    case 'safe':
      // Use detected genre, maybe add a second detected genre
      if (detectedGenres.length > 1 && rng() < SAFE_MULTI_GENRE_PROBABILITY) {
        const secondGenre = detectedGenres[1] ?? '';
        return `${primaryGenre} ${secondGenre}`;
      }
      return primaryGenre;

    case 'normal':
      // Sometimes blend detected genres, sometimes add from pool
      if (detectedGenres.length > 1 && rng() < NORMAL_BLEND_PROBABILITY) {
        return detectedGenres.slice(0, 2).join(' ');
      }
      if (rng() < NORMAL_BLEND_PROBABILITY) {
        const addition = selectRandom(pool.genres.filter(g => g !== primaryGenre), rng);
        return `${primaryGenre} ${addition}`;
      }
      return primaryGenre;

    case 'adventurous':
      // Add an adventurous modifier to the detected genre
      const advModifier = selectRandom(ADVENTUROUS_MODIFIERS, rng);
      if (detectedGenres.length > 1) {
        const secondGenre = detectedGenres[1] ?? '';
        return `${advModifier} ${primaryGenre} ${secondGenre}`;
      }
      return `${advModifier} ${primaryGenre}`;

    case 'high':
      // Add an experimental modifier to the detected genre
      const highModifier = selectRandom(HIGH_CREATIVITY_MODIFIERS, rng);
      return `${highModifier} ${primaryGenre}`;

    default:
      return primaryGenre;
  }
}

/**
 * Select random genres when no detection occurred.
 * This is the fallback for when user's description has no recognizable genre keywords.
 */
function selectRandomForLevel(
  level: CreativityLevel,
  rng: () => number
): string {
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
      // Experimental fusion: combine unusual genres (only when no detection)
      const base = selectRandom(HIGH_BASE_GENRES, rng);
      const fusion = selectRandom(HIGH_FUSION_GENRES, rng);
      return `${base} ${fusion}`;

    default:
      return selectRandom(pool.genres, rng);
  }
}

// =============================================================================
// Title Generation
// =============================================================================

/**
 * Generate a deterministic creative title based on creativity level.
 *
 * Title complexity scales with creativity:
 * - low/safe: Simple "Adjective Noun" format
 * - normal: Occasionally adds suffix (30% chance)
 * - adventurous/high: Always includes suffix for dramatic effect
 *
 * Note: This is the deterministic version using word pools.
 * For LLM-based title generation, see generateCreativeBoostTitle in
 * @bun/ai/creative-boost/helpers/content.ts
 *
 * @param level - Creativity level determining title complexity
 * @param rng - Random number generator for deterministic selection
 * @returns Generated title string
 *
 * @example
 * generateDeterministicCreativeBoostTitle('low', () => 0.5);
 * // "Golden Dreams"
 *
 * @example
 * generateDeterministicCreativeBoostTitle('high', () => 0.5);
 * // "Cosmic Echoes Ascending"
 */
export function generateDeterministicCreativeBoostTitle(
  level: CreativityLevel,
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
