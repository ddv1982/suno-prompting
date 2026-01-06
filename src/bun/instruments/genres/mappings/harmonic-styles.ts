/**
 * Genre to Harmonic Style (Mode) Mapping
 *
 * Maps genres to their preferred harmonic styles/modes for multi-genre blending.
 * Each genre has an array of modes that typically work well with that genre's
 * musical character.
 */

import { collectAndPickFromGenres, collectAllFromGenres } from '@bun/instruments/services/random';
import { parseGenreComponents } from '@bun/prompt/genre-parser';

import type { GenreType } from '@bun/instruments/genres';
import type { HarmonicStyle } from '@bun/instruments/modes';
import type { Rng } from '@bun/instruments/services/random';


/**
 * Mapping of genres to their preferred harmonic styles (modes).
 * Each array is ordered by preference/frequency of use in the genre.
 */
export const GENRE_HARMONIC_STYLES: Partial<Record<GenreType, readonly HarmonicStyle[]>> = {
  // Jazz family - sophisticated, jazzy modes
  jazz: ['dorian', 'mixolydian', 'lydian_dominant', 'melodic_minor'],

  // Metal family - dark, aggressive modes
  metal: ['phrygian', 'aeolian', 'harmonic_minor', 'locrian'],

  // Classical family - traditional modes
  classical: ['ionian', 'aeolian', 'harmonic_minor', 'lydian'],

  // Latin family - warm, exotic modes
  latin: ['dorian', 'phrygian', 'mixolydian'],

  // Ambient family - ethereal, floating modes
  ambient: ['lydian', 'aeolian', 'ionian'],

  // Blues family - soulful modes
  blues: ['mixolydian', 'dorian', 'aeolian'],

  // Rock family - driving modes
  rock: ['mixolydian', 'aeolian', 'ionian', 'dorian'],

  // Electronic family - modern modes
  electronic: ['aeolian', 'dorian', 'phrygian'],

  // Folk family - traditional modes
  folk: ['ionian', 'dorian', 'mixolydian', 'aeolian'],

  // Pop family - bright modes
  pop: ['ionian', 'lydian', 'mixolydian'],

  // Synthwave - retro, cinematic modes
  synthwave: ['dorian', 'aeolian', 'lydian'],

  // Cinematic - dramatic modes
  cinematic: ['lydian', 'aeolian', 'harmonic_minor', 'lydian_augmented'],

  // Lo-fi - chill, jazzy modes
  lofi: ['dorian', 'lydian', 'mixolydian'],

  // Trap - dark, moody modes
  trap: ['aeolian', 'phrygian', 'dorian'],

  // Punk - raw, driving modes
  punk: ['aeolian', 'mixolydian', 'ionian'],

  // Soul - warm, soulful modes
  soul: ['dorian', 'mixolydian', 'aeolian'],

  // R&B - smooth, sophisticated modes
  rnb: ['dorian', 'mixolydian', 'lydian'],

  // Country - traditional modes
  country: ['ionian', 'mixolydian', 'dorian'],

  // Reggae - laid-back modes
  reggae: ['dorian', 'mixolydian', 'aeolian'],

  // Afrobeat - groovy, modal modes
  afrobeat: ['dorian', 'mixolydian', 'aeolian'],

  // House - uplifting modes
  house: ['dorian', 'mixolydian', 'ionian'],

  // Trance - euphoric modes
  trance: ['aeolian', 'lydian', 'dorian'],

  // Downtempo - atmospheric modes
  downtempo: ['dorian', 'aeolian', 'lydian'],

  // Dream pop - ethereal modes
  dreampop: ['lydian', 'ionian', 'dorian'],

  // Chillwave - nostalgic modes
  chillwave: ['dorian', 'lydian', 'mixolydian'],

  // New Age - meditative modes
  newage: ['lydian', 'ionian', 'dorian'],

  // Hyperpop - experimental modes
  hyperpop: ['lydian', 'phrygian', 'aeolian'],

  // Drill - dark modes
  drill: ['phrygian', 'aeolian', 'locrian'],

  // Melodic Techno - driving, emotional modes
  melodictechno: ['dorian', 'aeolian', 'phrygian'],

  // Indie - eclectic modes
  indie: ['ionian', 'dorian', 'lydian', 'mixolydian'],

  // Funk - groovy modes
  funk: ['dorian', 'mixolydian'],

  // Disco - uplifting modes
  disco: ['ionian', 'dorian', 'mixolydian'],

  // Retro - nostalgic modes
  retro: ['ionian', 'dorian', 'mixolydian'],

  // Symphonic - dramatic modes
  symphonic: ['aeolian', 'harmonic_minor', 'lydian', 'ionian'],

  // Video game - varied modes
  videogame: ['lydian', 'dorian', 'aeolian', 'ionian'],
} as const;

/**
 * Default harmonic styles for genres not in the mapping.
 * Uses the most versatile modes that work across many contexts.
 */
export const DEFAULT_HARMONIC_STYLES: readonly HarmonicStyle[] = [
  'ionian',
  'dorian',
  'aeolian',
] as const;

/**
 * Get a blended harmonic style from multiple genre components.
 * Collects unique styles from all genres and randomly selects one.
 *
 * @param genreString - A genre string like "jazz rock" or "ambient, metal"
 * @param rng - Optional random number generator (defaults to Math.random)
 * @returns A randomly selected harmonic style from the combined pool, or null if empty
 */
export function getBlendedHarmonicStyle(
  genreString: string,
  rng: Rng = Math.random
): HarmonicStyle | null {
  const components = parseGenreComponents(genreString);
  if (components.length === 0) return null;

  return collectAndPickFromGenres(
    components,
    GENRE_HARMONIC_STYLES as Record<string, readonly HarmonicStyle[]>,
    DEFAULT_HARMONIC_STYLES,
    rng
  ) ?? null;
}

/**
 * Get all suggested harmonic styles for a genre string.
 * Returns a unique array of all applicable styles without duplicates.
 *
 * @param genreString - A genre string like "jazz rock" or "ambient, metal"
 * @returns An array of unique harmonic styles from all genre components
 */
export function getAllBlendedHarmonicStyles(genreString: string): HarmonicStyle[] {
  const components = parseGenreComponents(genreString);

  return collectAllFromGenres(
    components,
    GENRE_HARMONIC_STYLES as Record<string, readonly HarmonicStyle[]>,
    DEFAULT_HARMONIC_STYLES
  );
}
