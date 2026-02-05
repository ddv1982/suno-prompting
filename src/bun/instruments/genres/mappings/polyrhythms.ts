/**
 * Genre to Polyrhythm Mapping
 *
 * Maps genres to their characteristic polyrhythms for multi-genre blending.
 * Only includes genres with strong polyrhythmic traditions - not all genres
 * have explicit polyrhythm associations.
 */

import { collectAndPickFromGenres, collectAllFromGenres } from '@bun/instruments/services/random';
import { parseGenreComponents } from '@bun/prompt/genre-parser';

import type { GenreType } from '@bun/instruments/genres';
import type { PolyrhythmType } from '@bun/instruments/rhythms';
import type { Rng } from '@bun/instruments/services/random';

/**
 * Mapping of genres to their characteristic polyrhythms.
 * Only genres with strong polyrhythmic traditions are included.
 * Each array is ordered by prominence/frequency of use in the genre.
 */
export const GENRE_POLYRHYTHMS: Partial<Record<GenreType, readonly PolyrhythmType[]>> = {
  // Afrobeat - signature African polyrhythms
  afrobeat: ['afrobeat', 'african_compound', 'hemiola'],

  // Latin - signature Latin polyrhythms
  latin: ['hemiola', 'reverse_hemiola', 'afrobeat'],

  // Jazz - swing and groove rhythms
  jazz: ['hemiola', 'reverse_hemiola'],

  // Metal - complex odd rhythms (prog metal especially)
  metal: ['shifting', 'evolving', 'limping'],

  // Funk - groove rhythms
  funk: ['hemiola', 'reverse_hemiola'],

  // Soul - groove rhythms
  soul: ['hemiola'],

  // Blues - shuffle rhythms
  blues: ['hemiola', 'reverse_hemiola'],

  // Electronic - various rhythms
  electronic: ['hemiola', 'afrobeat'],

  // Folk - traditional rhythms
  folk: ['hemiola', 'reverse_hemiola'],

  // Classical - traditional rhythms
  classical: ['hemiola', 'reverse_hemiola'],

  // Ambient - subtle rhythms
  ambient: ['reverse_hemiola'],

  // Reggae - off-beat rhythms
  reggae: ['hemiola'],

  // Downtempo - groove rhythms
  downtempo: ['hemiola', 'reverse_hemiola', 'afrobeat'],

  // House - groove rhythms
  house: ['hemiola', 'afrobeat'],

  // Video game - varied rhythms
  videogame: ['hemiola', 'shifting', 'reverse_hemiola'],

  // Symphonic - dramatic rhythms
  symphonic: ['hemiola', 'reverse_hemiola', 'evolving'],

  // Cinematic - dramatic rhythms
  cinematic: ['hemiola', 'reverse_hemiola', 'evolving'],

  // Indie - eclectic rhythms
  indie: ['hemiola', 'shifting'],
} as const;

/**
 * Default polyrhythms for genres not in the mapping.
 * Set to null because many genres don't have strong polyrhythm associations.
 * Only return suggestions for genres with explicit mappings.
 */
export const DEFAULT_POLYRHYTHMS: readonly PolyrhythmType[] | null = null;

/**
 * Get a blended polyrhythm from multiple genre components.
 * Only collects from genres with explicit mappings.
 * Returns null if no genres have polyrhythm associations.
 *
 * @param genreString - A genre string like "afrobeat jazz" or "latin, jazz"
 * @param rng - Optional random number generator (defaults to Math.random)
 * @returns A randomly selected polyrhythm from the combined pool, or null if none applicable
 */
export function getBlendedPolyrhythm(
  genreString: string,
  rng: Rng = Math.random
): PolyrhythmType | null {
  const components = parseGenreComponents(genreString);
  if (components.length === 0) return null;

  // Use null as default to skip genres without mappings
  return (
    collectAndPickFromGenres(
      components,
      GENRE_POLYRHYTHMS as Record<string, readonly PolyrhythmType[]>,
      null,
      rng
    ) ?? null
  );
}

/**
 * Get all suggested polyrhythms for a genre string.
 * Returns empty array if no genres have polyrhythm associations.
 * Only includes rhythms from genres with explicit mappings.
 *
 * @param genreString - A genre string like "afrobeat jazz" or "latin, jazz"
 * @returns An array of unique polyrhythms from all applicable genre components
 */
export function getAllBlendedPolyrhythms(genreString: string): PolyrhythmType[] {
  const components = parseGenreComponents(genreString);

  // Use null as default to skip genres without mappings
  return collectAllFromGenres(
    components,
    GENRE_POLYRHYTHMS as Record<string, readonly PolyrhythmType[]>,
    null
  );
}
