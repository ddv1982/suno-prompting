/**
 * Genre-Era Mapping
 *
 * Maps genres to their characteristic eras for era-appropriate
 * instrument selection.
 *
 * @module instruments/genre-era-mapping
 */

import type { InstrumentEra } from './eras';

/**
 * Maps genres to their primary musical era.
 * Genres not listed default to 'modern'.
 */
const GENRE_ERA_MAP: Record<string, InstrumentEra> = {
  // 70s genres
  disco: '70s',
  funk: '70s',
  soul: '70s',
  'progressive rock': '70s',
  'classic rock': '70s',

  // 80s genres
  synthwave: '80s',
  outrun: '80s',
  darksynth: '80s',
  synthpop: '80s',
  newwave: '80s',
  'new wave': '80s',
  italo: '80s',
  'italo disco': '80s',

  // 90s genres
  grunge: '90s',
  jungle: '90s',
  breakbeat: '90s',
  'trip hop': '90s',
  triphop: '90s',
  'big beat': '90s',
  'uk garage': '90s',
  ukgarage: '90s',
  rave: '90s',
  trance: '90s',

  // Modern genres (explicit - default is also modern)
  dubstep: 'modern',
  'drum and bass': 'modern',
  drumandbass: 'modern',
  trap: 'modern',
  hyperpop: 'modern',
  futurebass: 'modern',
  'future bass': 'modern',
  phonk: 'modern',
  lofi: 'modern',
  'lo-fi': 'modern',
  chillwave: 'modern',
};

/**
 * Get the era associated with a genre.
 * Returns 'modern' if no specific era is mapped.
 *
 * @param genre - Genre name to look up
 * @returns The era associated with the genre
 *
 * @example
 * getEraForGenre('synthwave'); // '80s'
 * getEraForGenre('grunge');    // '90s'
 * getEraForGenre('dubstep');   // 'modern'
 * getEraForGenre('rock');      // 'modern' (default)
 */
export function getEraForGenre(genre: string): InstrumentEra {
  const normalizedGenre = genre.toLowerCase().trim();
  return GENRE_ERA_MAP[normalizedGenre] ?? 'modern';
}

/**
 * Check if a genre has a specific era association.
 *
 * @param genre - Genre name to check
 * @returns True if the genre has a non-default era mapping
 */
export function hasEraMapping(genre: string): boolean {
  const normalizedGenre = genre.toLowerCase().trim();
  return normalizedGenre in GENRE_ERA_MAP;
}

/**
 * Get all genres associated with a specific era.
 *
 * @param era - Era to filter by
 * @returns Array of genre names
 */
export function getGenresForEra(era: InstrumentEra): string[] {
  return Object.entries(GENRE_ERA_MAP)
    .filter(([, genreEra]) => genreEra === era)
    .map(([genre]) => genre);
}
