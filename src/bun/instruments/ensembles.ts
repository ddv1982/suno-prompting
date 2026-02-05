/**
 * Ensemble Presets
 *
 * Pre-defined instrument groupings that automatically expand to individual
 * instruments. Each ensemble is tagged with compatible genres for contextual
 * selection.
 *
 * @module instruments/ensembles
 */

/**
 * Ensemble preset definition.
 * Represents a named group of instruments with genre compatibility.
 */
export interface EnsemblePreset {
  /** Display name for the ensemble */
  readonly name: string;
  /** Individual instruments this ensemble expands to */
  readonly instruments: readonly string[];
  /** Genres this ensemble is appropriate for */
  readonly genres: readonly string[];
}

/**
 * All ensemble presets.
 * 10 presets covering diverse musical styles and contexts.
 */
export const ENSEMBLE_PRESETS: readonly EnsemblePreset[] = [
  {
    name: 'string quartet',
    instruments: ['violin', 'viola', 'cello', 'double bass'],
    genres: ['classical', 'cinematic', 'jazz', 'ambient', 'symphonic', 'folk'],
  },
  {
    name: 'horn section',
    instruments: ['trumpet', 'trombone', 'saxophone'],
    genres: ['jazz', 'funk', 'soul', 'disco', 'rnb', 'latin', 'afrobeat'],
  },
  {
    name: 'gospel choir',
    instruments: ['gospel vocals', 'Hammond organ', 'claps'],
    genres: ['gospel', 'soul', 'rnb', 'blues'],
  },
  {
    name: 'brass band',
    instruments: ['trumpet', 'trombone', 'tuba', 'French horn'],
    genres: ['jazz', 'classical', 'cinematic', 'symphonic', 'latin'],
  },
  {
    name: 'jazz combo',
    instruments: ['piano', 'upright bass', 'drums', 'saxophone'],
    genres: ['jazz', 'blues', 'lofi', 'soul', 'downtempo'],
  },
  {
    name: 'rock band',
    instruments: ['electric guitar', 'bass guitar', 'drums'],
    genres: ['rock', 'punk', 'metal', 'indie', 'blues'],
  },
  {
    name: 'chamber orchestra',
    instruments: ['strings', 'woodwinds', 'French horn'],
    genres: ['classical', 'cinematic', 'ambient', 'symphonic', 'newage'],
  },
  {
    name: 'synth stack',
    instruments: ['lead synth', 'pad synth', 'bass synth'],
    genres: ['electronic', 'synthwave', 'house', 'trance', 'melodictechno', 'hyperpop'],
  },
  {
    name: 'world percussion',
    instruments: ['djembe', 'congas', 'shaker', 'tambourine'],
    genres: ['afrobeat', 'latin', 'reggae', 'folk', 'funk'],
  },
  {
    name: 'electronic kit',
    instruments: ['808', 'hi-hats', 'claps', 'snare'],
    genres: ['trap', 'drill', 'electronic', 'hyperpop', 'house', 'rnb'],
  },
] as const;

/**
 * All ensemble names for quick lookup.
 */
export const ENSEMBLE_NAMES: readonly string[] = ENSEMBLE_PRESETS.map((p) => p.name);

/**
 * Expand an ensemble name to its individual instruments.
 * If the name doesn't match an ensemble, returns it unchanged as a single-item array.
 *
 * @param ensembleName - Name of ensemble to expand
 * @returns Array of individual instrument names
 */
export function expandEnsemble(ensembleName: string): string[] {
  const normalizedName = ensembleName.toLowerCase();
  const preset = ENSEMBLE_PRESETS.find((p) => p.name.toLowerCase() === normalizedName);

  if (preset) {
    return [...preset.instruments];
  }

  // Not an ensemble, return as single instrument
  return [ensembleName];
}

/**
 * Get all ensembles appropriate for a specific genre.
 *
 * @param genre - Genre key to filter by
 * @returns Array of matching ensemble presets
 */
export function getEnsemblesForGenre(genre: string): EnsemblePreset[] {
  const normalizedGenre = genre.toLowerCase();
  return ENSEMBLE_PRESETS.filter((p) => p.genres.some((g) => g.toLowerCase() === normalizedGenre));
}

/**
 * Check if a name is an ensemble preset.
 *
 * @param name - Name to check
 * @returns True if the name matches an ensemble preset
 */
export function isEnsemble(name: string): boolean {
  const normalizedName = name.toLowerCase();
  return ENSEMBLE_PRESETS.some((p) => p.name.toLowerCase() === normalizedName);
}

/**
 * Get an ensemble preset by name.
 *
 * @param name - Ensemble name to look up
 * @returns The ensemble preset or undefined if not found
 */
export function getEnsemble(name: string): EnsemblePreset | undefined {
  const normalizedName = name.toLowerCase();
  return ENSEMBLE_PRESETS.find((p) => p.name.toLowerCase() === normalizedName);
}

/**
 * Select a random ensemble appropriate for a genre.
 *
 * @param genre - Genre key to filter by
 * @param rng - Random number generator function
 * @returns A matching ensemble preset or undefined if none match
 */
export function selectEnsembleForGenre(
  genre: string,
  rng: () => number = Math.random
): EnsemblePreset | undefined {
  const matching = getEnsemblesForGenre(genre);
  if (matching.length === 0) {
    return undefined;
  }
  const idx = Math.floor(rng() * matching.length);
  return matching[idx];
}
