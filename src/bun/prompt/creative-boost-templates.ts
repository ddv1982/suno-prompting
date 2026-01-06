/**
 * Creative Boost Deterministic Templates
 *
 * Provides genre pools and fusion rules for each creativity level,
 * enabling fully deterministic generation without LLM calls.
 *
 * @module prompt/creative-boost-templates
 */

import { GENRE_REGISTRY, MULTI_GENRE_COMBINATIONS, type GenreType, selectInstrumentsForGenre as selectInstruments } from '@bun/instruments';

import type { CreativityLevel } from '@shared/types';

// =============================================================================
// Constants
// =============================================================================

/** Probability of adding a secondary genre at normal creativity level */
const NORMAL_BLEND_PROBABILITY = 0.4;

/** Probability of adding a third genre at adventurous level */
const ADVENTUROUS_TRIPLE_PROBABILITY = 0.3;

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

/** Select a random item from an array using provided RNG */
function selectRandom<T>(items: readonly T[], rng: () => number): T {
  const idx = Math.floor(rng() * items.length);
  return items[idx] ?? items[0]!;
}

/** Select multiple unique random items from an array */
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
 * @param level - Creativity level
 * @param seedGenres - User-provided seed genres (optional)
 * @param rng - Random number generator
 * @returns Selected genre string
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
      // Try to use a multi-genre combination from registry
      if (rng() < 0.7 && MULTI_GENRE_COMBINATIONS.length > 0) {
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
 * Generate a creative title based on creativity level.
 *
 * @param level - Creativity level
 * @param _genre - Selected genre for context (unused, reserved for future enhancement)
 * @param rng - Random number generator
 * @returns Generated title
 */
export function generateCreativeBoostTitle(
  level: CreativityLevel,
  _genre: string,
  rng: () => number
): string {
  const adjective = selectRandom(CREATIVE_TITLE_WORDS.adjectives, rng);
  const noun = selectRandom(CREATIVE_TITLE_WORDS.nouns, rng);

  // Higher creativity = more elaborate titles
  if (level === 'high' || level === 'adventurous') {
    const suffix = selectRandom(CREATIVE_TITLE_WORDS.suffixes, rng);
    return `${adjective} ${noun} ${suffix}`;
  }

  if (level === 'normal' && rng() < 0.3) {
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
 */
export function selectMoodForLevel(
  level: CreativityLevel,
  rng: () => number
): string {
  const pool = MOOD_POOLS[level];
  return selectRandom(pool, rng);
}

// =============================================================================
// Instrument Selection
// =============================================================================

/**
 * Get instruments for the selected genre from registry.
 */
export function getInstrumentsForGenre(
  genre: string,
  rng: () => number
): string[] {
  // Try to find the genre in registry
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
 * Build a deterministic Creative Boost prompt.
 *
 * @param creativityLevel - Creativity level (0-100, mapped to CreativityLevel)
 * @param seedGenres - User-provided seed genres
 * @param withWordlessVocals - Include wordless vocals
 * @param maxMode - Use MAX mode format
 * @param rng - Random number generator
 * @returns Generated prompt, title, and genre
 */
export function buildDeterministicCreativeBoost(
  creativityLevel: number,
  seedGenres: string[],
  withWordlessVocals: boolean,
  maxMode: boolean,
  rng: () => number = Math.random
): { text: string; title: string; genre: string } {
  // Map slider value to creativity level
  const level = mapSliderToLevel(creativityLevel);

  // Select genre based on creativity level and seeds
  const genre = selectGenreForLevel(level, seedGenres, rng);
  const mood = selectMoodForLevel(level, rng);
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
