/**
 * Genre to Time Signature Mapping
 *
 * Maps genres to their typical time signatures for multi-genre blending.
 * Each genre has an array of time signatures commonly used in that genre,
 * ordered by preference/frequency of use.
 */

import { pickRandom, collectAllFromGenres } from '@bun/instruments/services/random';
import { parseGenreComponents } from '@bun/prompt/genre-parser';

import type { GenreType } from '@bun/instruments/genres';
import type { TimeSignatureType } from '@bun/instruments/rhythms';
import type { Rng } from '@bun/instruments/services/random';

/**
 * Weight given to the top half of time signatures when selecting.
 * Higher value = more preference for common signatures across genres.
 */
const TOP_HALF_SELECTION_WEIGHT = 0.75;

/**
 * Mapping of genres to their typical time signatures.
 * Each array is ordered by preference/frequency of use in the genre.
 */
export const GENRE_TIME_SIGNATURES: Partial<Record<GenreType, readonly TimeSignatureType[]>> = {
  // Jazz - flexible meters including odd times
  jazz: ['time_4_4', 'time_5_4', 'time_3_4', 'time_6_8', 'time_9_8'],

  // Rock - standard with occasional compound
  rock: ['time_4_4', 'time_6_8'],

  // Metal - crushing 4/4 and odd times
  metal: ['time_4_4', 'time_7_8', 'time_6_8'],

  // Classical - traditional meters
  classical: ['time_4_4', 'time_3_4', 'time_6_8', 'time_9_8'],

  // Folk - traditional meters
  folk: ['time_4_4', 'time_3_4', 'time_6_8', 'time_9_8'],

  // Country - straight time
  country: ['time_4_4', 'time_3_4', 'time_6_8'],

  // Latin - groove meters
  latin: ['time_4_4', 'time_6_8', 'time_3_4'],

  // Afrobeat - compound meters
  afrobeat: ['time_4_4', 'time_6_8'],

  // Electronic - straight 4/4
  electronic: ['time_4_4'],

  // Pop - standard time
  pop: ['time_4_4', 'time_6_8'],

  // Ambient - flexible
  ambient: ['time_4_4', 'time_6_8', 'time_3_4'],

  // Blues - shuffle and straight
  blues: ['time_4_4', 'time_6_8', 'time_3_4'],

  // Punk - driving 4/4
  punk: ['time_4_4'],

  // Symphonic - dramatic meters
  symphonic: ['time_4_4', 'time_3_4', 'time_6_8', 'time_9_8'],

  // Cinematic - varied meters
  cinematic: ['time_4_4', 'time_3_4', 'time_6_8', 'time_5_4'],

  // Lo-fi - laid-back meters
  lofi: ['time_4_4', 'time_6_8'],

  // Trap - straight time
  trap: ['time_4_4'],

  // House - 4/4 dance
  house: ['time_4_4'],

  // Trance - 4/4 dance
  trance: ['time_4_4'],

  // Downtempo - flexible meters
  downtempo: ['time_4_4', 'time_6_8', 'time_3_4'],

  // Dream pop - ethereal meters
  dreampop: ['time_4_4', 'time_6_8'],

  // Indie - varied meters
  indie: ['time_4_4', 'time_6_8', 'time_3_4', 'time_5_4'],

  // Funk - groove time
  funk: ['time_4_4'],

  // Disco - dance 4/4
  disco: ['time_4_4'],

  // R&B - smooth meters
  rnb: ['time_4_4', 'time_6_8'],

  // Soul - groove meters
  soul: ['time_4_4', 'time_6_8', 'time_3_4'],

  // Reggae - laid-back 4/4
  reggae: ['time_4_4'],

  // Synthwave - retro 4/4
  synthwave: ['time_4_4'],

  // Video game - varied meters
  videogame: ['time_4_4', 'time_3_4', 'time_6_8', 'time_5_4', 'time_7_8'],

  // Retro - classic meters
  retro: ['time_4_4', 'time_3_4', 'time_6_8'],

  // Melodic techno - driving 4/4
  melodictechno: ['time_4_4'],

  // Chillwave - relaxed meters
  chillwave: ['time_4_4', 'time_6_8'],

  // New age - meditative meters
  newage: ['time_4_4', 'time_6_8', 'time_3_4'],

  // Hyperpop - chaotic meters
  hyperpop: ['time_4_4'],

  // Drill - hard 4/4
  drill: ['time_4_4'],
} as const;

/**
 * Default time signatures for genres not in the mapping.
 * Uses the most common time signature across all genres.
 */
export const DEFAULT_TIME_SIGNATURES: readonly TimeSignatureType[] = ['time_4_4'] as const;

/**
 * Get a blended time signature from multiple genre components.
 * Prioritizes signatures that appear in multiple genres using frequency-weighted selection.
 *
 * @param genreString - A genre string like "jazz rock" or "ambient, metal"
 * @param rng - Optional random number generator (defaults to Math.random)
 * @returns A weighted-randomly selected time signature, or null if empty/invalid input
 */
export function getBlendedTimeSignature(
  genreString: string,
  rng: Rng = Math.random
): TimeSignatureType | null {
  const components = parseGenreComponents(genreString);
  if (components.length === 0) return null;

  // Count frequency of each time signature across genres
  const frequency = new Map<TimeSignatureType, number>();

  for (const genre of components) {
    const sigs = GENRE_TIME_SIGNATURES[genre] ?? DEFAULT_TIME_SIGNATURES;
    for (const sig of sigs) {
      frequency.set(sig, (frequency.get(sig) ?? 0) + 1);
    }
  }

  // Get signatures sorted by frequency (prefer common ones)
  const sorted = [...frequency.entries()].sort((a, b) => b[1] - a[1]).map(([sig]) => sig);

  if (sorted.length === 0) return null;

  // Weighted random: higher chance for more common signatures
  const topHalf = sorted.slice(0, Math.ceil(sorted.length / 2));
  const useTopHalf = rng() < TOP_HALF_SELECTION_WEIGHT;

  const pool = useTopHalf && topHalf.length > 0 ? topHalf : sorted;
  return pickRandom(pool, rng) ?? null;
}

/**
 * Get all suggested time signatures for a genre string.
 * Returns a unique array of all applicable signatures without duplicates.
 *
 * @param genreString - A genre string like "jazz rock" or "ambient, metal"
 * @returns An array of unique time signatures from all genre components
 */
export function getAllBlendedTimeSignatures(genreString: string): TimeSignatureType[] {
  const components = parseGenreComponents(genreString);

  return collectAllFromGenres(
    components,
    GENRE_TIME_SIGNATURES as Record<string, readonly TimeSignatureType[]>,
    DEFAULT_TIME_SIGNATURES
  );
}
