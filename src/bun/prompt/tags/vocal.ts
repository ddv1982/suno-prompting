/**
 * Vocal performance tag selection
 * @module prompt/tags/vocal
 */

/**
 * Vocal performance descriptors for vocal-capable genres.
 * Based on Suno V5 community research and official documentation.
 * 
 * Total tags: 38 across 8 categories
 * 
 * @example
 * // Access specific category
 * VOCAL_PERFORMANCE_TAGS.breathTexture // ['breathy delivery', 'airy vocals', ...]
 */
export const VOCAL_PERFORMANCE_TAGS = {
  /** Breathiness and vocal texture (5 tags) */
  breathTexture: [
    'breathy delivery',
    'airy vocals',
    'whispered tones',
    'smooth vocals',
    'raspy edge',
  ],
  
  /** Vocal power and dynamics (5 tags) */
  vocalPower: [
    'belt technique',
    'powerful vocals',
    'soft delivery',
    'intimate whisper',
    'vocal restraint',
  ],
  
  /** Extended techniques (5 tags) */
  techniques: [
    'falsetto sections',
    'chest voice dominance',
    'head voice clarity',
    'vibrato',
    'straight-tone delivery',
  ],
  
  /** Vocal character (5 tags) */
  character: [
    'crooner style',
    'operatic delivery',
    'conversational vocals',
    'theatrical performance',
    'raw emotion',
  ],
  
  /** Layering and harmony (5 tags) */
  layering: [
    'choir stacking',
    'vocal doubles',
    'harmony layers',
    'octave vocal layers',
    'unison vocal tracking',
  ],
  
  /** Articulation (4 tags) */
  articulation: [
    'clear diction',
    'slurred phrasing',
    'staccato delivery',
    'legato phrasing',
  ],
  
  /** Mic technique (4 tags) */
  micTechnique: [
    'close-mic intimacy',
    'distant mic character',
    'proximity effect',
    'off-axis vocal warmth',
  ],
  
  /** Genre-specific styles (5 tags) */
  genreStyles: [
    'soul vocal runs',
    'jazz scat vocalization',
    'gospel shouts',
    'country twang',
    'blues grit',
  ],
} as const;

/**
 * Vocal tag applicability per genre.
 * Controls whether vocal performance tags can be selected.
 * 
 * Probability values:
 * - 0.9-1.0: Almost always vocal (pop, r&b, soul)
 * - 0.6-0.8: Often vocal (jazz, rock, country)
 * - 0.3-0.5: Sometimes vocal (classical, electronic)
 * - 0.0-0.2: Rarely vocal (ambient, cinematic)
 * 
 * @example
 * // Check vocal probability for jazz
 * GENRE_VOCAL_PROBABILITY.jazz // 0.70
 */
export const GENRE_VOCAL_PROBABILITY: Record<string, number> = {
  // Almost always vocal
  pop: 0.95,
  rnb: 0.95,
  soul: 0.90,
  hiphop: 0.95,
  country: 0.90,
  gospel: 0.95,
  
  // Often vocal
  jazz: 0.70,
  blues: 0.80,
  rock: 0.75,
  folk: 0.85,
  punk: 0.80,
  metal: 0.60, // Growls/screams count as vocals
  
  // Sometimes vocal
  classical: 0.30, // Choral works
  electronic: 0.40,
  edm: 0.50,
  reggae: 0.75,
  latin: 0.80,
  funk: 0.70,
  
  // Rarely vocal
  ambient: 0.05,
  cinematic: 0.10,
  orchestral: 0.20,
  
  // Default for unmapped genres
  default: 0.50,
} as const;

/**
 * Select vocal performance tags based on genre vocal probability.
 * Returns empty array if RNG roll fails the genre's vocal probability check.
 * 
 * Flattens all VOCAL_PERFORMANCE_TAGS categories, shuffles deterministically,
 * and returns up to `count` tags.
 * 
 * @param genre - Music genre to check vocal probability
 * @param count - Maximum number of tags to return
 * @param rng - Random number generator function (0.0-1.0) for deterministic selection
 * @returns Array of vocal performance tags, or empty array if probability check fails
 * 
 * @example
 * // High vocal probability genre (pop = 0.95)
 * selectVocalTags('pop', 2, () => 0.8) // ['breathy delivery', 'belt technique']
 * 
 * @example
 * // Low vocal probability genre (ambient = 0.05)
 * selectVocalTags('ambient', 2, () => 0.1) // [] (failed probability check)
 */
export function selectVocalTags(genre: string, count: number, rng: () => number = Math.random): string[] {
  const normalizedGenre = genre.toLowerCase().trim();
  const probability = GENRE_VOCAL_PROBABILITY[normalizedGenre] ?? GENRE_VOCAL_PROBABILITY['default'] ?? 0.50;
  
  // Check vocal probability with RNG roll
  if (rng() > probability) {
    return [];
  }
  
  // Flatten all vocal performance tags
  const allTags: string[] = [];
  for (const category of Object.values(VOCAL_PERFORMANCE_TAGS)) {
    allTags.push(...category);
  }
  
  // Shuffle using RNG and return max count
  const shuffled = [...allTags].sort(() => rng() - 0.5);
  return shuffled.slice(0, count);
}
