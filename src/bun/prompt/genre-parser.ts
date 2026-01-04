import { selectInstrumentsForGenre } from '@bun/instruments';
import { GENRE_REGISTRY, type GenreType } from '@bun/instruments/genres';
import { articulateInstrument } from '@bun/prompt/articulations';
import {
  GENRE_PRODUCTION_STYLES,
  DEFAULT_PRODUCTION_STYLE,
} from '@bun/prompt/production-elements';
import {
  GENRE_VOCAL_STYLES,
  DEFAULT_VOCAL_STYLE,
} from '@bun/prompt/vocal-descriptors';
import { APP_CONSTANTS } from '@shared/constants';

/**
 * Check if a string is a valid single genre in the registry
 */
export function isValidGenre(genre: string): genre is GenreType {
  return genre.toLowerCase() in GENRE_REGISTRY;
}

/**
 * Parse a compound genre string and extract recognized genre components.
 * Handles strings like "ambient symphonic rock" → ["ambient", "symphonic", "rock"]
 */
export function parseGenreComponents(genre: string): GenreType[] {
  if (!genre?.trim()) return [];

  const normalized = genre.toLowerCase().trim();

  // If it's a single valid genre, return it directly
  if (isValidGenre(normalized)) {
    return [normalized];
  }

  // Split on common separators: spaces, hyphens, slashes, "and", "&"
  const parts = normalized
    .split(/[\s\-\/]+|(?:\s+and\s+)|(?:\s*&\s*)/)
    .filter(Boolean);

  // Extract recognized genres
  const recognized: GenreType[] = [];
  for (const part of parts) {
    if (isValidGenre(part)) {
      recognized.push(part);
    }
  }

  return recognized;
}

/**
 * Pick a random element from an array using the provided RNG
 */
function pickRandom<T>(arr: readonly T[], rng: () => number): T | undefined {
  if (arr.length === 0) return undefined;
  return arr[Math.floor(rng() * arr.length)];
}

/**
 * Collect unique items from multiple arrays
 */
function collectUnique<T>(arrays: readonly (readonly T[])[]): T[] {
  const seen = new Set<T>();
  const result: T[] = [];
  for (const arr of arrays) {
    for (const item of arr) {
      if (!seen.has(item)) {
        seen.add(item);
        result.push(item);
      }
    }
  }
  return result;
}

/**
 * Build a blended vocal descriptor from multiple genre components.
 * Combines vocal characteristics from each genre for a richer description.
 */
export function buildBlendedVocalDescriptor(
  genres: GenreType[],
  rng: () => number = Math.random
): string {
  if (genres.length === 0) {
    const style = DEFAULT_VOCAL_STYLE;
    const range = pickRandom(style.ranges, rng) ?? 'Tenor';
    const delivery = pickRandom(style.deliveries, rng) ?? 'Smooth';
    const technique = pickRandom(style.techniques, rng) ?? 'Stacked Harmonies';
    return `${range}, ${delivery} Delivery, ${technique}`;
  }

  if (genres.length === 1) {
    const genre = genres[0]!;
    const style = GENRE_VOCAL_STYLES[genre] ?? DEFAULT_VOCAL_STYLE;
    const range = pickRandom(style.ranges, rng) ?? 'Tenor';
    const delivery = pickRandom(style.deliveries, rng) ?? 'Smooth';
    const technique = pickRandom(style.techniques, rng) ?? 'Stacked Harmonies';
    return `${range}, ${delivery} Delivery, ${technique}`;
  }

  // Collect from all genres
  const allRanges = collectUnique(
    genres.map((g) => GENRE_VOCAL_STYLES[g]?.ranges ?? DEFAULT_VOCAL_STYLE.ranges)
  );
  const allDeliveries = collectUnique(
    genres.map((g) => GENRE_VOCAL_STYLES[g]?.deliveries ?? DEFAULT_VOCAL_STYLE.deliveries)
  );
  const allTechniques = collectUnique(
    genres.map((g) => GENRE_VOCAL_STYLES[g]?.techniques ?? DEFAULT_VOCAL_STYLE.techniques)
  );

  // Pick one from each pool
  const range = pickRandom(allRanges, rng) ?? 'Tenor';
  const delivery = pickRandom(allDeliveries, rng) ?? 'Smooth';
  const technique = pickRandom(allTechniques, rng) ?? 'Stacked Harmonies';

  return `${range}, ${delivery} Delivery, ${technique}`;
}

/**
 * Build a blended production descriptor from multiple genre components.
 * Combines production characteristics for a hybrid sound.
 */
export function buildBlendedProductionDescriptor(
  genres: GenreType[],
  rng: () => number = Math.random
): string {
  if (genres.length === 0) {
    const style = DEFAULT_PRODUCTION_STYLE;
    const texture = pickRandom(style.textures, rng) ?? 'Polished Production';
    const reverb = pickRandom(style.reverbs, rng) ?? 'Studio Reverb';
    return `${texture}, ${reverb}`;
  }

  if (genres.length === 1) {
    const genre = genres[0]!;
    const style = GENRE_PRODUCTION_STYLES[genre] ?? DEFAULT_PRODUCTION_STYLE;
    const texture = pickRandom(style.textures, rng) ?? 'Polished Production';
    const reverb = pickRandom(style.reverbs, rng) ?? 'Studio Reverb';
    return `${texture}, ${reverb}`;
  }

  // Collect from all genres
  const allReverbs = collectUnique(
    genres.map((g) => GENRE_PRODUCTION_STYLES[g]?.reverbs ?? DEFAULT_PRODUCTION_STYLE.reverbs)
  );
  const allTextures = collectUnique(
    genres.map((g) => GENRE_PRODUCTION_STYLES[g]?.textures ?? DEFAULT_PRODUCTION_STYLE.textures)
  );

  const texture = pickRandom(allTextures, rng) ?? 'Polished Production';
  const reverb = pickRandom(allReverbs, rng) ?? 'Studio Reverb';

  return `${texture}, ${reverb}`;
}

/**
 * Select instruments from multiple genre components.
 * Combines instrument pools from each genre for a richer palette.
 */
export function selectInstrumentsForMultiGenre(
  genres: GenreType[],
  rng: () => number = Math.random,
  maxInstruments: number = 3
): string[] {
  if (genres.length === 0) return [];

  // Collect instruments from each genre
  const allInstruments: string[] = [];
  for (const genre of genres) {
    const instruments = selectInstrumentsForGenre(genre, {});
    // Take first 2 from each genre to ensure variety
    allInstruments.push(...instruments.slice(0, 2));
  }

  // Dedupe
  const unique = [...new Set(allInstruments)];

  // Shuffle and take maxInstruments
  for (let i = unique.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    const temp = unique[i]!;
    unique[i] = unique[j]!;
    unique[j] = temp;
  }

  // Articulate each instrument
  return unique
    .slice(0, maxInstruments)
    .map((i) => articulateInstrument(i, rng, APP_CONSTANTS.ARTICULATION_CHANCE));
}

/**
 * Build complete performance guidance for a genre string (single or compound).
 * Returns null if no valid genres found.
 */
export function buildPerformanceGuidance(
  genreString: string,
  rng: () => number = Math.random
): { vocal: string; production: string; instruments: string[] } | null {
  const components = parseGenreComponents(genreString);
  if (components.length === 0) return null;

  return {
    vocal: buildBlendedVocalDescriptor(components, rng),
    production: buildBlendedProductionDescriptor(components, rng),
    instruments: selectInstrumentsForMultiGenre(components, rng),
  };
}
