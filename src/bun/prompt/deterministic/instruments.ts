/**
 * Instrument assembly for deterministic prompt generation.
 *
 * @module prompt/deterministic/instruments
 */

import { selectInstrumentsForGenre } from '@bun/instruments';
import { articulateInstrument } from '@bun/prompt/articulations';
import { getRandomProgressionForGenre } from '@bun/prompt/chord-progressions';
import { selectInstrumentsForMultiGenre } from '@bun/prompt/genre-parser';
import { getVocalSuggestionsForGenre } from '@bun/prompt/vocal-descriptors';

import type { InstrumentAssemblyResult } from './types';
import type { GenreType } from '@bun/instruments/genres';

/**
 * Assemble instruments string with articulations, chord progression, and vocals.
 * Supports multi-genre blending when multiple components are provided.
 *
 * @param components - Array of genre components (supports single or multi-genre)
 * @param rng - Random number generator
 * @returns Formatted instruments string for prompt
 *
 * @example
 * assembleInstruments(['jazz'], Math.random)
 * // { instruments: ['Rhodes', 'tenor sax'], formatted: 'Arpeggiated Rhodes, breathy tenor sax...', ... }
 *
 * @example
 * assembleInstruments(['jazz', 'rock'], Math.random)
 * // Blends instruments from both jazz and rock pools
 */
export function assembleInstruments(
  components: GenreType[],
  rng: () => number = Math.random
): InstrumentAssemblyResult {
  const primaryGenre = components[0] ?? 'pop';

  // Select base instruments - blend from multiple genres if compound
  const baseInstruments =
    components.length > 1
      ? selectInstrumentsForMultiGenre(components, rng, 4)
      : selectInstrumentsForGenre(primaryGenre, { maxTags: 4, rng });

  // Apply articulations to instruments
  const articulatedInstruments = baseInstruments.map((instrument) =>
    articulateInstrument(instrument, rng)
  );

  // Get chord progression from primary genre
  const progression = getRandomProgressionForGenre(primaryGenre, rng);
  const progressionTag = `${progression.name} (${progression.pattern}) harmony`;

  // Get vocal suggestions from primary genre
  const vocals = getVocalSuggestionsForGenre(primaryGenre, rng);
  const vocalTag = `${vocals.range} vocals, ${vocals.delivery} delivery`;

  // Combine all elements
  const allElements = [...articulatedInstruments, progressionTag, vocalTag];

  return {
    instruments: baseInstruments,
    formatted: allElements.join(', '),
    chordProgression: progressionTag,
    vocalStyle: vocalTag,
  };
}
