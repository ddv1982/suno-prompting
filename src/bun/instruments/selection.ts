import {
  detectGenre,
  detectCombination,
  detectHarmonic,
  detectPolyrhythmCombination,
  detectTimeSignature,
  detectTimeSignatureJourney,
} from '@bun/instruments/detection';
import { GENRE_REGISTRY } from '@bun/instruments/genres';

import type { GenreType } from '@bun/instruments/genres';
import type { CombinationType, HarmonicStyle } from '@bun/instruments/modes';
import type {
  PolyrhythmCombinationType,
  TimeSignatureType,
  TimeSignatureJourneyType,
} from '@bun/instruments/rhythms';

/**
 * Mode Selection Module
 *
 * Provides fully deterministic mode selection using keyword-based detection.
 * No LLM calls - relies entirely on keyword matching for genre, combination,
 * harmonic style, and rhythm detection.
 *
 * @module instruments/selection
 */

export interface ModeSelection {
  genre: GenreType | null;
  combination: CombinationType | null;
  singleMode: HarmonicStyle | null;
  polyrhythmCombination: PolyrhythmCombinationType | null;
  timeSignature: TimeSignatureType | null;
  timeSignatureJourney: TimeSignatureJourneyType | null;
  reasoning: string;
}

/** Resolve genre from override string */
function resolveGenreOverride(genreOverride: string): GenreType | null {
  if (genreOverride in GENRE_REGISTRY) {
    return genreOverride as GenreType;
  }
  const baseGenre = genreOverride.split(' ').at(0);
  if (baseGenre && baseGenre in GENRE_REGISTRY) {
    return baseGenre as GenreType;
  }
  return null;
}

/**
 * Build ModeSelection with common detections from description.
 *
 * @param description - User's song description
 * @param genre - Detected or overridden genre
 * @param reasoning - Explanation for selection
 * @param singleMode - Optional harmonic style (mutually exclusive with combination)
 * @returns Complete ModeSelection with all detected modes
 */
function buildModeSelection(
  description: string,
  genre: GenreType | null,
  reasoning: string,
  singleMode: HarmonicStyle | null = null
): ModeSelection {
  return {
    genre,
    combination: detectCombination(description),
    singleMode,
    polyrhythmCombination: detectPolyrhythmCombination(description),
    timeSignature: detectTimeSignature(description),
    timeSignatureJourney: detectTimeSignatureJourney(description),
    reasoning,
  };
}

/**
 * Select modes deterministically using keyword-based detection.
 *
 * This function is fully deterministic - no LLM calls are made.
 * It uses keyword matching via detectGenre(), detectCombination(),
 * detectHarmonic(), and rhythm detection functions.
 *
 * @param description - User's song description
 * @param genreOverride - Optional genre override from Advanced Mode selector
 * @returns ModeSelection with detected genre, modes, and rhythms (or null when no match)
 *
 * @example
 * // With detected genre
 * selectModes('smooth jazz night session')
 * // Returns: { genre: 'jazz', combination: null, singleMode: null, ... }
 *
 * @example
 * // With genre override
 * selectModes('something random', 'rock')
 * // Returns: { genre: 'rock', combination: null, ... }
 *
 * @example
 * // No keywords match
 * selectModes('gibberish xyz')
 * // Returns: { genre: null, combination: null, ... }
 */
export function selectModes(description: string, genreOverride?: string): ModeSelection {
  // 1. Handle genre override (takes priority)
  if (genreOverride) {
    return buildModeSelection(
      description,
      resolveGenreOverride(genreOverride),
      `User selected: ${genreOverride}`
    );
  }

  // 2. Try keyword-based genre detection
  const genre = detectGenre(description);
  const reasoning = genre ? `Keyword detection: ${genre}` : 'No genre keywords matched';

  // 3. Detect combination first - if found, use that
  const combination = detectCombination(description);

  // 4. If no combination, try to detect a single harmonic mode
  // combination and singleMode are mutually exclusive
  const singleMode = combination ? null : detectHarmonic(description);

  return buildModeSelection(description, genre, reasoning, singleMode);
}
