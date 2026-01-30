/**
 * Creative Boost Builder
 *
 * Main builder function for deterministic Creative Boost prompts.
 *
 * @module prompt/creative-boost/builder
 */

import { getCreativityLevel } from '@shared/creative-boost-utils';
import { formatMaxModePrompt } from '@shared/max-format';

import {
  generateDeterministicCreativeBoostTitle,
  getInstrumentsForGenre,
  selectGenreForLevel,
  selectMoodForLevel,
} from './selection';

import type { BuildCreativeBoostOptions } from './types';

/**
 * Build a deterministic Creative Boost prompt.
 *
 * When moodCategory is provided:
 * - Mood is selected from the category instead of level-based pools
 * - This affects the mood in the generated prompt
 *
 * @param creativityLevel - Creativity level (0-100, mapped to CreativityLevel)
 * @param seedGenres - User-provided seed genres
 * @param maxMode - Use MAX mode format
 * @param rngOrOptions - Random number generator OR full options object
 * @returns Generated prompt, title, and genre
 */
export function buildDeterministicCreativeBoost(
  creativityLevel: number,
  seedGenres: string[],
  maxMode: boolean,
  rngOrOptions: (() => number) | BuildCreativeBoostOptions = Math.random,
): { text: string; title: string; genre: string } {
  // Handle both old function signature and new options object
  const options: BuildCreativeBoostOptions =
    typeof rngOrOptions === 'function'
      ? { creativityLevel, seedGenres, maxMode, rng: rngOrOptions }
      : rngOrOptions;

  const rng = options.rng ?? Math.random;
  const moodCategory = options.moodCategory;

  // Map slider value to creativity level
  const level = getCreativityLevel(creativityLevel);

  // Select genre based on creativity level and seeds
  const genre = selectGenreForLevel(level, seedGenres, rng);
  const mood = selectMoodForLevel(level, rng, moodCategory, genre);
  const title = generateDeterministicCreativeBoostTitle(level, rng);
  const instruments = getInstrumentsForGenre(genre, rng);

  // Build the prompt based on mode
  if (maxMode) {
    return {
      text: formatMaxModePrompt(genre, mood, instruments),
      title,
      genre,
    };
  }

  // Standard mode
  const lines = [
    `${mood} ${genre}`,
    `Instruments: ${instruments.join(', ')}`,
  ];
  return {
    text: lines.join('\n'),
    title,
    genre,
  };
}
