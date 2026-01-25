/**
 * Creative Boost Builder
 *
 * Main builder function for deterministic Creative Boost prompts.
 *
 * @module prompt/creative-boost/builder
 */

import {
  generateDeterministicCreativeBoostTitle,
  getInstrumentsForGenre,
  selectGenreForLevel,
  selectMoodForLevel,
} from './selection';

import type { BuildCreativeBoostOptions } from './types';
import type { CreativityLevel } from '@shared/types';


/**
 * Map slider value (0-100) to CreativityLevel.
 */
export function mapSliderToLevel(value: number): CreativityLevel {
  if (value <= 10) return 'low';
  if (value <= 30) return 'safe';
  if (value <= 60) return 'normal';
  if (value <= 85) return 'adventurous';
  return 'high';
}

/**
 * Build a deterministic Creative Boost prompt.
 *
 * When moodCategory is provided:
 * - Mood is selected from the category instead of level-based pools
 * - This affects the mood in the generated prompt
 *
 * @param creativityLevel - Creativity level (0-100, mapped to CreativityLevel)
 * @param seedGenres - User-provided seed genres
 * @param withWordlessVocals - Include wordless vocals
 * @param maxMode - Use MAX mode format
 * @param rngOrOptions - Random number generator OR full options object
 * @returns Generated prompt, title, and genre
 */
export function buildDeterministicCreativeBoost(
  creativityLevel: number,
  seedGenres: string[],
  withWordlessVocals: boolean,
  maxMode: boolean,
  rngOrOptions: (() => number) | BuildCreativeBoostOptions = Math.random,
): { text: string; title: string; genre: string } {
  // Handle both old function signature and new options object
  const options: BuildCreativeBoostOptions =
    typeof rngOrOptions === 'function'
      ? { creativityLevel, seedGenres, withWordlessVocals, maxMode, rng: rngOrOptions }
      : rngOrOptions;

  const rng = options.rng ?? Math.random;
  const moodCategory = options.moodCategory;

  // Map slider value to creativity level
  const level = mapSliderToLevel(creativityLevel);

  // Select genre based on creativity level and seeds
  const genre = selectGenreForLevel(level, seedGenres, rng);
  const mood = selectMoodForLevel(level, rng, moodCategory);
  const title = generateDeterministicCreativeBoostTitle(level, rng);
  const instruments = getInstrumentsForGenre(genre, rng);

  // Add wordless vocals if requested
  const instrumentList = withWordlessVocals
    ? [...instruments, 'wordless vocals']
    : instruments;

  // Build the prompt based on mode
  if (maxMode) {
    // Use lowercase field names consistent with Full Prompt MAX mode
    const lines = [
      `genre: "${genre}"`,
      `mood: "${mood}"`,
      `instruments: "${instrumentList.join(', ')}"`,
    ];
    return {
      text: lines.join('\n'),
      title,
      genre,
    };
  }

  // Standard mode
  const lines = [
    `${mood} ${genre}`,
    `Instruments: ${instrumentList.join(', ')}`,
  ];
  return {
    text: lines.join('\n'),
    title,
    genre,
  };
}
