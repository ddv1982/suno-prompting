/**
 * Creative Boost Deterministic Templates
 *
 * Provides genre pools and fusion rules for each creativity level,
 * enabling fully deterministic generation without LLM calls.
 *
 * @module prompt/creative-boost-templates
 */

import { GENRE_REGISTRY, MULTI_GENRE_COMBINATIONS, type GenreType, selectInstrumentsForGenre as selectInstruments } from '@bun/instruments';
import { filterSunoStylesByMoodCategory, selectMoodsForCategory } from '@bun/mood';
import { InvariantError } from '@shared/errors';

import type { MoodCategory } from '@bun/mood';
import type { CreativityLevel } from '@shared/types';

// =============================================================================
// Constants
// =============================================================================

/**
 * Probability of blending two genres at "normal" creativity level.
 * Set to 40% to favor single genres while still providing variety.
 * Higher values would make blends too common; lower values too rare.
 */
const NORMAL_BLEND_PROBABILITY = 0.4;

/**
 * Probability of using three genres instead of two at "adventurous" level.
 * Set to 30% to keep triple-genre fusions relatively rare and special.
 * Most adventurous outputs will be interesting dual-genre blends.
 */
const ADVENTUROUS_TRIPLE_PROBABILITY = 0.3;

/**
 * Probability of using multi-genre combinations from registry at "safe" level.
 * Set to 70% to strongly prefer established combinations over single genres.
 */
const SAFE_MULTI_GENRE_PROBABILITY = 0.7;

// =============================================================================
// Types
// =============================================================================

export type CreativityPool = {
  /** Genre options appropriate for this creativity level */
  genres: readonly string[];
  /** Whether to allow blending multiple genres */
  allowBlending: boolean;
  /** Maximum number of genres to blend */
  maxGenres: number;
};

// =============================================================================
// Genre Pools by Creativity Level
// =============================================================================

/** Low creativity: Pure, single genres only */
const LOW_GENRES: readonly string[] = [
  'ambient',
  'jazz',
  'rock',
  'electronic',
  'classical',
  'folk',
  'blues',
  'soul',
  'pop',
  'country',
  'reggae',
  'funk',
];

/** Safe creativity: Established, well-known combinations */
const SAFE_GENRES: readonly string[] = [
  'jazz fusion',
  'trip hop',
  'electro pop',
  'indie folk',
  'neo soul',
  'synth pop',
  'acid jazz',
  'folk rock',
  'dream pop',
  'post rock',
  'art rock',
  'nu jazz',
  'chamber pop',
  'shoegaze',
  'downtempo',
];

/** Normal creativity: Mix of single and established combinations */
const NORMAL_GENRES: readonly string[] = [
  ...LOW_GENRES,
  ...SAFE_GENRES.slice(0, 8),
];

/** Adventurous creativity: Cross-genre blends */
const ADVENTUROUS_BASE_GENRES: readonly string[] = [
  'ambient',
  'jazz',
  'electronic',
  'rock',
  'classical',
  'folk',
  'hip hop',
  'r&b',
  'metal',
  'punk',
  'world',
  'experimental',
];

/** High creativity: Experimental fusion bases */
const HIGH_BASE_GENRES: readonly string[] = [
  'doom metal',
  'hyperpop',
  'noise',
  'industrial',
  'vaporwave',
  'glitch',
  'drone',
  'breakcore',
  'darkwave',
  'math rock',
];

/** Secondary genres for experimental fusion */
const HIGH_FUSION_GENRES: readonly string[] = [
  'bossa nova',
  'bluegrass',
  'baroque',
  'reggae',
  'polka',
  'tango',
  'flamenco',
  'celtic',
  'gospel',
  'surf rock',
];

// =============================================================================
// Creativity Level Pools
// =============================================================================

export const CREATIVITY_POOLS: Record<CreativityLevel, CreativityPool> = {
  low: {
    genres: LOW_GENRES,
    allowBlending: false,
    maxGenres: 1,
  },
  safe: {
    genres: SAFE_GENRES,
    allowBlending: false,
    maxGenres: 1,
  },
  normal: {
    genres: NORMAL_GENRES,
    allowBlending: true,
    maxGenres: 2,
  },
  adventurous: {
    genres: ADVENTUROUS_BASE_GENRES,
    allowBlending: true,
    maxGenres: 3,
  },
  high: {
    genres: HIGH_BASE_GENRES,
    allowBlending: true,
    maxGenres: 2,
  },
};

// =============================================================================
// Title Templates
// =============================================================================

const CREATIVE_TITLE_WORDS = {
  adjectives: [
    'Cosmic', 'Electric', 'Neon', 'Crystal', 'Velvet', 'Golden', 'Silver',
    'Midnight', 'Infinite', 'Ethereal', 'Wild', 'Savage', 'Gentle', 'Fierce',
    'Ancient', 'Future', 'Digital', 'Analog', 'Sacred', 'Mystic',
  ],
  nouns: [
    'Dreams', 'Echoes', 'Shadows', 'Waves', 'Spirits', 'Visions', 'Horizons',
    'Thunder', 'Lightning', 'Storm', 'Ocean', 'Mountain', 'Desert', 'Forest',
    'City', 'Universe', 'Galaxy', 'Pulse', 'Rhythm', 'Soul',
  ],
  suffixes: [
    'Rising', 'Falling', 'Awakening', 'Ascending', 'Descending', 'Burning',
    'Fading', 'Glowing', 'Dancing', 'Calling', 'Dreaming', 'Wandering',
  ],
} as const;

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
      return selectRandom(LOW_GENRES, rng);
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
 * Probability of adding suffix to "normal" level titles.
 * Set to 30% to occasionally add variety without overdoing it.
 */
const NORMAL_SUFFIX_PROBABILITY = 0.3;

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

const MOOD_POOLS: Record<CreativityLevel, readonly string[]> = {
  low: ['calm', 'peaceful', 'relaxed', 'mellow', 'gentle', 'serene'],
  safe: ['dreamy', 'nostalgic', 'warm', 'intimate', 'cozy', 'soulful'],
  normal: ['energetic', 'uplifting', 'melancholic', 'euphoric', 'contemplative', 'bittersweet'],
  adventurous: ['intense', 'chaotic', 'transcendent', 'primal', 'haunting', 'explosive'],
  high: ['apocalyptic', 'surreal', 'dystopian', 'psychedelic', 'otherworldly', 'feral'],
};

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
// Main Builder Function
// =============================================================================

/**
 * Options for building a deterministic Creative Boost prompt.
 */
export interface BuildCreativeBoostOptions {
  /** Creativity level (0-100, mapped to CreativityLevel) */
  creativityLevel: number;
  /** User-provided seed genres */
  seedGenres: string[];
  /** Include wordless vocals */
  withWordlessVocals: boolean;
  /** Use MAX mode format */
  maxMode: boolean;
  /** Optional mood category to override mood selection */
  moodCategory?: MoodCategory;
  /** Random number generator (defaults to Math.random) */
  rng?: () => number;
}

/**
 * Build a deterministic Creative Boost prompt.
 *
 * When moodCategory is provided:
 * - Mood is selected from the category instead of level-based pools
 * - This affects the mood in the generated prompt
 *
 * @param creativityLevel - Creativity level (0-100, mapped to CreativityLevel)
 * @param seedGenres - User-provided seed genres
 * @param withWordlessVocals - Include wordless vocals
 * @param maxMode - Use MAX mode format
 * @param rngOrOptions - Random number generator OR full options object
 * @returns Generated prompt, title, and genre
 */
export function buildDeterministicCreativeBoost(
  creativityLevel: number,
  seedGenres: string[],
  withWordlessVocals: boolean,
  maxMode: boolean,
  rngOrOptions: (() => number) | BuildCreativeBoostOptions = Math.random,
): { text: string; title: string; genre: string } {
  // Handle both old function signature and new options object
  const options: BuildCreativeBoostOptions =
    typeof rngOrOptions === 'function'
      ? { creativityLevel, seedGenres, withWordlessVocals, maxMode, rng: rngOrOptions }
      : rngOrOptions;

  const rng = options.rng ?? Math.random;
  const moodCategory = options.moodCategory;

  // Map slider value to creativity level
  const level = mapSliderToLevel(creativityLevel);

  // Select genre based on creativity level and seeds
  const genre = selectGenreForLevel(level, seedGenres, rng);
  const mood = selectMoodForLevel(level, rng, moodCategory);
  const title = generateCreativeBoostTitle(level, genre, rng);
  const instruments = getInstrumentsForGenre(genre, rng);

  // Add wordless vocals if requested
  const instrumentList = withWordlessVocals
    ? [...instruments, 'wordless vocals']
    : instruments;

  // Build the prompt based on mode
  if (maxMode) {
    const lines = [
      `Genre: "${genre}"`,
      `Mood: "${mood}"`,
      `Instruments: "${instrumentList.join(', ')}"`,
    ];
    return {
      text: lines.join('\n'),
      title,
      genre,
    };
  }

  // Standard mode
  const lines = [
    `${mood} ${genre}`,
    `Instruments: ${instrumentList.join(', ')}`,
  ];
  return {
    text: lines.join('\n'),
    title,
    genre,
  };
}

/**
 * Map slider value (0-100) to CreativityLevel.
 */
export function mapSliderToLevel(value: number): CreativityLevel {
  if (value <= 10) return 'low';
  if (value <= 30) return 'safe';
  if (value <= 60) return 'normal';
  if (value <= 85) return 'adventurous';
  return 'high';
}

/**
 * Get the creativity pool for a level.
 */
export function getCreativityPool(level: CreativityLevel): CreativityPool {
  return CREATIVITY_POOLS[level];
}

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
