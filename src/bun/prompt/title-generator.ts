/**
 * Deterministic Title Generator
 *
 * Generates song titles without LLM calls using genre/mood-based templates.
 * Combines evocative words with musical terms for creative titles.
 *
 * @module prompt/title-generator
 */

// =============================================================================
// Title Word Pools
// =============================================================================

/** Time-based words for atmospheric titles */
const TIME_WORDS: readonly string[] = [
  'Midnight',
  'Dawn',
  'Twilight',
  'Sunset',
  'Morning',
  'Evening',
  'Night',
  'Daybreak',
  'Dusk',
  'Starlight',
];

/** Nature-based words */
const NATURE_WORDS: readonly string[] = [
  'Ocean',
  'River',
  'Mountain',
  'Forest',
  'Rain',
  'Storm',
  'Wind',
  'Sky',
  'Moon',
  'Sun',
  'Stars',
  'Waves',
  'Thunder',
  'Snow',
  'Fire',
];

/** Emotion-based words */
const EMOTION_WORDS: readonly string[] = [
  'Dream',
  'Memory',
  'Echo',
  'Shadow',
  'Light',
  'Hope',
  'Heart',
  'Soul',
  'Spirit',
  'Silence',
  'Whisper',
  'Cry',
  'Love',
  'Lost',
  'Found',
];

/** Action/movement words */
const ACTION_WORDS: readonly string[] = [
  'Rising',
  'Falling',
  'Burning',
  'Fading',
  'Running',
  'Dancing',
  'Flying',
  'Drifting',
  'Breaking',
  'Chasing',
];

/** Abstract concept words */
const ABSTRACT_WORDS: readonly string[] = [
  'Infinity',
  'Eternity',
  'Destiny',
  'Freedom',
  'Solitude',
  'Serenity',
  'Chaos',
  'Harmony',
  'Balance',
  'Truth',
];

// =============================================================================
// Genre-Specific Title Patterns
// =============================================================================

/** Genre-specific title templates with placeholders */
const GENRE_TITLE_PATTERNS: Record<string, readonly string[]> = {
  jazz: [
    '{time} {emotion}',
    'Blue {nature}',
    '{emotion} in {time}',
    'Smooth {nature}',
    '{time} Session',
    'Cool {emotion}',
  ],
  blues: [
    '{emotion} Blues',
    '{time} Blues',
    'Down by the {nature}',
    '{action} Away',
    'Lonesome {nature}',
    '{emotion} Road',
  ],
  rock: [
    '{action} {nature}',
    '{emotion} Anthem',
    '{nature} of {emotion}',
    'Rise of {abstract}',
    '{action} Free',
    '{time} Rebel',
  ],
  metal: [
    '{nature} of {abstract}',
    '{action} in {emotion}',
    'Dark {nature}',
    '{abstract} Rising',
    'Through the {nature}',
    'March of {emotion}',
  ],
  pop: [
    '{emotion} Tonight',
    '{action} Hearts',
    '{time} Love',
    'Feel the {nature}',
    '{emotion} Vibes',
    'Sweet {emotion}',
  ],
  electronic: [
    '{abstract} State',
    'Digital {nature}',
    '{action} Signal',
    'Neon {emotion}',
    'Synthetic {nature}',
    '{time} Pulse',
  ],
  ambient: [
    '{nature} Drift',
    '{time} Meditation',
    'Floating {emotion}',
    'Ethereal {nature}',
    '{abstract} Space',
    'Gentle {nature}',
  ],
  classical: [
    '{nature} Sonata',
    '{emotion} Nocturne',
    '{time} Prelude',
    'Opus of {abstract}',
    '{nature} Symphony',
    '{emotion} Waltz',
  ],
  folk: [
    '{nature} Song',
    'Old {time} Tale',
    'Wandering {emotion}',
    'Country {nature}',
    '{emotion} Ballad',
    'Homespun {emotion}',
  ],
  country: [
    '{time} on the {nature}',
    'Dusty {nature}',
    '{emotion} Highway',
    'Back Road {emotion}',
    '{nature} Nights',
    'Heartland {emotion}',
  ],
  hiphop: [
    '{action} Hard',
    '{emotion} Streets',
    '{time} Grind',
    'Real {emotion}',
    '{abstract} Flow',
    'City {nature}',
  ],
  rnb: [
    '{emotion} Touch',
    '{time} Romance',
    'Velvet {nature}',
    'Slow {emotion}',
    '{action} Closer',
    'Silk {emotion}',
  ],
  soul: [
    '{emotion} Soul',
    'Deep {nature}',
    '{time} Feeling',
    'Soulful {emotion}',
    '{nature} of Love',
    'Gospel {emotion}',
  ],
  reggae: [
    '{nature} Vibes',
    'Island {emotion}',
    '{time} Riddim',
    'One {abstract}',
    '{emotion} Sunshine',
    'Roots {nature}',
  ],
  latin: [
    '{nature} Fuego',
    '{emotion} Corazón',
    '{time} Caliente',
    'Tropical {nature}',
    '{action} Ritmo',
    'Passion {emotion}',
  ],
  funk: [
    'Get {action}',
    '{emotion} Groove',
    'Funky {nature}',
    '{time} Jam',
    'Super {emotion}',
    '{action} Machine',
  ],
  disco: [
    '{time} Fever',
    '{action} Floor',
    'Disco {nature}',
    'Glitter {emotion}',
    '{emotion} Night',
    'Mirror {nature}',
  ],
  punk: [
    '{action} System',
    'No {abstract}',
    '{emotion} Riot',
    'Raw {nature}',
    '{action} Rules',
    'Anarchy {emotion}',
  ],
  indie: [
    'Little {nature}',
    '{emotion} Days',
    'Quiet {time}',
    '{nature} Theory',
    'Paper {emotion}',
    '{time} Wonder',
  ],
  lofi: [
    '{time} Study',
    'Chill {nature}',
    'Lo-Fi {emotion}',
    'Lazy {time}',
    'Soft {nature}',
    'Cozy {emotion}',
  ],
};

/** Default patterns for unknown genres */
const DEFAULT_PATTERNS: readonly string[] = [
  '{emotion} {nature}',
  '{time} {emotion}',
  '{action} {nature}',
  '{nature} of {abstract}',
  '{emotion} Journey',
  '{time} Tale',
];

// =============================================================================
// Mood Modifiers
// =============================================================================

/** Mood-based word preferences */
const MOOD_WORD_WEIGHTS: Record<string, { preferred: readonly string[]; avoid: readonly string[] }> = {
  melancholic: {
    preferred: ['Shadow', 'Rain', 'Memory', 'Echo', 'Fading', 'Lost', 'Silence', 'Twilight'],
    avoid: ['Joy', 'Bright', 'Happy', 'Dancing'],
  },
  upbeat: {
    preferred: ['Sun', 'Light', 'Rising', 'Dancing', 'Hope', 'Morning', 'Fire', 'Flying'],
    avoid: ['Shadow', 'Lost', 'Falling', 'Cry'],
  },
  aggressive: {
    preferred: ['Thunder', 'Storm', 'Fire', 'Breaking', 'Burning', 'Chaos', 'Rising'],
    avoid: ['Gentle', 'Soft', 'Whisper', 'Floating'],
  },
  calm: {
    preferred: ['Ocean', 'Moon', 'Silence', 'Drifting', 'Serenity', 'Gentle', 'Stars'],
    avoid: ['Thunder', 'Breaking', 'Burning', 'Chaos'],
  },
  romantic: {
    preferred: ['Heart', 'Love', 'Moon', 'Stars', 'Dream', 'Whisper', 'Evening'],
    avoid: ['Chaos', 'Breaking', 'Thunder', 'Lost'],
  },
  dark: {
    preferred: ['Shadow', 'Night', 'Midnight', 'Storm', 'Thunder', 'Chaos', 'Silence'],
    avoid: ['Sun', 'Morning', 'Light', 'Hope'],
  },
  energetic: {
    preferred: ['Fire', 'Rising', 'Running', 'Dancing', 'Thunder', 'Burning', 'Flying'],
    avoid: ['Silence', 'Drifting', 'Fading', 'Floating'],
  },
  dreamy: {
    preferred: ['Dream', 'Stars', 'Moon', 'Floating', 'Drifting', 'Ethereal', 'Twilight'],
    avoid: ['Thunder', 'Breaking', 'Burning', 'Chaos'],
  },
};

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
function selectRandom<T>(items: readonly T[], rng: () => number): T {
  const idx = Math.floor(rng() * items.length);
  // Safe: All callers pass non-empty constant arrays
  return items[idx] ?? items[0]!;
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

  // 70% chance to use preferred words if available
  if (preferred.length > 0 && rng() < 0.7) {
    return preferred;
  }

  // Otherwise use neutral words
  return neutral.length > 0 ? neutral : words;
}

/**
 * Get a word from a category, filtered by mood.
 *
 * @param category - Word category
 * @param mood - Current mood
 * @param rng - Random number generator
 * @returns Selected word
 */
function getWord(
  category: 'time' | 'nature' | 'emotion' | 'action' | 'abstract',
  mood: string,
  rng: () => number
): string {
  const pools: Record<string, readonly string[]> = {
    time: TIME_WORDS,
    nature: NATURE_WORDS,
    emotion: EMOTION_WORDS,
    action: ACTION_WORDS,
    abstract: ABSTRACT_WORDS,
  };

  const pool = pools[category] ?? EMOTION_WORDS;
  const filtered = filterByMood(pool, mood, rng);
  return selectRandom(filtered, rng);
}

/**
 * Interpolate a title pattern with words.
 *
 * @param pattern - Pattern string with placeholders
 * @param mood - Current mood for word selection
 * @param rng - Random number generator
 * @returns Interpolated title
 *
 * @example
 * interpolatePattern('{time} {emotion}', 'melancholic', Math.random)
 * // "Midnight Shadow"
 */
function interpolatePattern(pattern: string, mood: string, rng: () => number): string {
  return pattern
    .replace('{time}', getWord('time', mood, rng))
    .replace('{nature}', getWord('nature', mood, rng))
    .replace('{emotion}', getWord('emotion', mood, rng))
    .replace('{action}', getWord('action', mood, rng))
    .replace('{abstract}', getWord('abstract', mood, rng));
}

// =============================================================================
// Main Export
// =============================================================================

/**
 * Generate a deterministic song title based on genre and mood.
 *
 * Uses genre-specific patterns combined with mood-filtered word pools
 * to create evocative, contextually appropriate titles.
 *
 * @param genre - Target genre (e.g., "jazz", "rock", "electronic")
 * @param mood - Current mood (e.g., "melancholic", "upbeat", "dark")
 * @param rng - Random number generator for deterministic output
 * @returns Generated title string
 *
 * @example
 * generateDeterministicTitle('jazz', 'melancholic', Math.random)
 * // "Midnight Memory"
 *
 * @example
 * generateDeterministicTitle('rock', 'energetic', Math.random)
 * // "Rising Thunder"
 *
 * @example
 * generateDeterministicTitle('ambient', 'calm', Math.random)
 * // "Ocean Drift"
 */
export function generateDeterministicTitle(
  genre: string,
  mood: string,
  rng: () => number = Math.random
): string {
  // Get genre-specific patterns or fall back to defaults
  const genreLower = genre.toLowerCase().split(' ')[0] ?? 'pop';
  const patterns = GENRE_TITLE_PATTERNS[genreLower] ?? DEFAULT_PATTERNS;

  // Select a random pattern
  const pattern = selectRandom(patterns, rng);

  // Interpolate with mood-filtered words
  return interpolatePattern(pattern, mood, rng);
}

/**
 * Generate multiple title options for user selection.
 *
 * @param genre - Target genre
 * @param mood - Current mood
 * @param count - Number of titles to generate
 * @param rng - Random number generator
 * @returns Array of generated titles
 *
 * @example
 * generateTitleOptions('jazz', 'smooth', 3, Math.random)
 * // ["Blue Moon", "Midnight Session", "Cool Echo"]
 */
export function generateTitleOptions(
  genre: string,
  mood: string,
  count: number = 3,
  rng: () => number = Math.random
): string[] {
  const titles: string[] = [];
  const seen = new Set<string>();

  // Generate unique titles
  let attempts = 0;
  while (titles.length < count && attempts < count * 3) {
    const title = generateDeterministicTitle(genre, mood, rng);
    if (!seen.has(title.toLowerCase())) {
      seen.add(title.toLowerCase());
      titles.push(title);
    }
    attempts++;
  }

  return titles;
}
