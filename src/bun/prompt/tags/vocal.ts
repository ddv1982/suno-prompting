/**
 * Vocal performance tag selection
 * @module prompt/tags/vocal
 */

import { selectRandomN, shuffle } from '@shared/utils/random';

import type { VocalCharacter } from '@shared/schemas/thematic-context';

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
  articulation: ['clear diction', 'slurred phrasing', 'staccato delivery', 'legato phrasing'],

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
  soul: 0.9,
  hiphop: 0.95,
  country: 0.9,
  gospel: 0.95,

  // Often vocal
  jazz: 0.7,
  blues: 0.8,
  rock: 0.75,
  folk: 0.85,
  punk: 0.8,
  metal: 0.6, // Growls/screams count as vocals

  // Sometimes vocal
  classical: 0.3, // Choral works
  electronic: 0.4,
  edm: 0.5,
  reggae: 0.75,
  latin: 0.8,
  funk: 0.7,

  // Rarely vocal
  ambient: 0.05,
  cinematic: 0.1,
  orchestral: 0.2,

  // Default for unmapped genres
  default: 0.5,
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
export function selectVocalTags(
  genre: string,
  count: number,
  rng: () => number = Math.random
): string[] {
  const normalizedGenre = genre.toLowerCase().trim();
  const probability =
    GENRE_VOCAL_PROBABILITY[normalizedGenre] ?? GENRE_VOCAL_PROBABILITY.default ?? 0.5;

  // Check vocal probability with RNG roll
  if (rng() > probability) {
    return [];
  }

  // Flatten all vocal performance tags
  const allTags: string[] = [];
  for (const category of Object.values(VOCAL_PERFORMANCE_TAGS)) {
    allTags.push(...category);
  }

  return selectRandomN(allTags, Math.min(count, allTags.length), rng);
}

// ============================================
// Vocal Character Mapping
// ============================================

/**
 * Map vocal style to a specific tag.
 *
 * @param style - Vocal style from VocalCharacter (e.g., "breathy", "powerful")
 * @returns Mapped vocal tag or null if no mapping exists
 */
function mapVocalStyleToTag(style: string): string | null {
  const MAP: Record<string, string> = {
    breathy: 'breathy delivery',
    powerful: 'powerful vocals',
    raspy: 'raspy edge',
    smooth: 'smooth vocals',
    ethereal: 'airy vocals',
    intimate: 'intimate whisper',
    warm: 'smooth vocals',
    airy: 'airy vocals',
    gritty: 'raspy edge',
  };
  return MAP[style.toLowerCase()] ?? null;
}

/**
 * Map vocal layering approach to a specific tag.
 *
 * @param layering - Layering style from VocalCharacter (e.g., "harmonies", "choir")
 * @returns Mapped vocal tag or null if no mapping exists
 */
function mapVocalLayeringToTag(layering: string): string | null {
  const MAP: Record<string, string> = {
    harmonies: 'harmony layers',
    'double-tracked': 'vocal doubles',
    choir: 'choir stacking',
    layered: 'harmony layers',
    solo: 'intimate whisper',
    stacked: 'vocal doubles',
    octave: 'octave vocal layers',
    unison: 'unison vocal tracking',
  };
  return MAP[layering.toLowerCase()] ?? null;
}

/**
 * Map vocal technique to a specific tag.
 *
 * @param technique - Vocal technique from VocalCharacter (e.g., "falsetto", "growl")
 * @returns Mapped vocal tag or null if no mapping exists
 */
function mapVocalTechniqueToTag(technique: string): string | null {
  const MAP: Record<string, string> = {
    falsetto: 'falsetto sections',
    growl: 'raspy edge',
    scat: 'jazz scat vocalization',
    belt: 'belt technique',
    whisper: 'whispered tones',
    vibrato: 'vibrato',
    runs: 'soul vocal runs',
    shout: 'gospel shouts',
  };
  return MAP[technique.toLowerCase()] ?? null;
}

/**
 * Add character-derived vocal tags to the collection.
 */
function addCharacterDerivedTags(
  vocalCharacter: VocalCharacter,
  addUnique: (tag: string) => void
): void {
  if (vocalCharacter.style) {
    const styleTag = mapVocalStyleToTag(vocalCharacter.style);
    if (styleTag) addUnique(styleTag);
  }
  if (vocalCharacter.layering) {
    const layerTag = mapVocalLayeringToTag(vocalCharacter.layering);
    if (layerTag) addUnique(layerTag);
  }
  if (vocalCharacter.technique) {
    const techTag = mapVocalTechniqueToTag(vocalCharacter.technique);
    if (techTag) addUnique(techTag);
  }
}

/**
 * Fill remaining tag slots with random selections from the vocal pool.
 */
function fillWithRandomTags(
  count: number,
  currentCount: number,
  addUnique: (tag: string) => void,
  rng: () => number
): void {
  const remaining = count - currentCount;
  if (remaining <= 0) return;

  // Flatten all vocal performance tags
  const allTags: string[] = [];
  for (const category of Object.values(VOCAL_PERFORMANCE_TAGS)) {
    allTags.push(...category);
  }

  // Shuffle and add unique tags
  for (const tag of shuffle(allTags, rng)) {
    addUnique(tag);
  }
}

/**
 * Select vocal tags influenced by LLM-extracted vocalCharacter.
 *
 * When vocalCharacter is provided, character-derived tags are added first (priority),
 * followed by random genre-based tags to fill remaining slots.
 *
 * @param genre - Music genre to check vocal probability
 * @param count - Maximum number of tags to return
 * @param rng - Random number generator function (0.0-1.0) for deterministic selection
 * @param vocalCharacter - Optional vocal character from LLM extraction
 * @returns Array of vocal performance tags
 *
 * @example
 * // With vocalCharacter - character-derived tags appear first
 * selectVocalTagsWithCharacter('pop', 3, rng, { style: 'breathy', layering: 'harmonies' })
 * // ['breathy delivery', 'harmony layers', 'belt technique']
 *
 * @example
 * // Without vocalCharacter - falls back to random selection
 * selectVocalTagsWithCharacter('pop', 2, rng)
 * // ['powerful vocals', 'falsetto sections']
 */
export function selectVocalTagsWithCharacter(
  genre: string,
  count: number,
  rng: () => number,
  vocalCharacter?: VocalCharacter
): string[] {
  const normalizedGenre = genre.toLowerCase().trim();
  const probability =
    GENRE_VOCAL_PROBABILITY[normalizedGenre] ?? GENRE_VOCAL_PROBABILITY.default ?? 0.5;

  // Check vocal probability with RNG roll
  if (rng() > probability) {
    return [];
  }

  const tags: string[] = [];
  const seenTags = new Set<string>();

  const addUnique = (tag: string): void => {
    const lower = tag.toLowerCase();
    if (!seenTags.has(lower)) {
      seenTags.add(lower);
      tags.push(lower);
    }
  };

  // Add character-derived tags first (priority)
  if (vocalCharacter) {
    addCharacterDerivedTags(vocalCharacter, addUnique);
  }

  // Fill remaining slots with random selection from genre-based pool
  fillWithRandomTags(count, tags.length, addUnique, rng);

  return tags.slice(0, count);
}
