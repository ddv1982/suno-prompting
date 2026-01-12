/**
 * Creative Boost Genre Count Enforcement
 *
 * Genre count validation and enforcement utilities.
 *
 * @module ai/creative-boost/helpers/genre-count
 */

import { GENRE_REGISTRY, type GenreType } from '@bun/instruments';
import { createLogger } from '@bun/logger';
import { extractGenresFromPrompt } from '@bun/prompt/deterministic';
import { replaceFieldLine } from '@bun/prompt/remix';

const log = createLogger('CreativeBoostHelpers');

/**
 * Select random genres from the registry, excluding specified genres.
 *
 * WHY: When the LLM returns fewer genres than requested, we need to add
 * more to meet the target count. This selects from the genre registry
 * while avoiding duplicates with existing genres.
 */
function selectRandomGenres(excludeGenres: string[], count: number): string[] {
  const allGenres = Object.keys(GENRE_REGISTRY) as GenreType[];
  const excludeSet = new Set(excludeGenres.map(g => g.toLowerCase()));
  const available = allGenres.filter(g => !excludeSet.has(g.toLowerCase()));

  // Shuffle and take count genres
  const shuffled = [...available].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

/**
 * Enforce a specific genre count in a prompt by trimming or adding genres.
 *
 * WHY: LLMs don't always follow genre count instructions precisely. This
 * post-processing step guarantees the output matches the user's selected
 * genre count, maintaining their fusion complexity preference even if the
 * LLM suggests a different number of genres.
 *
 * @param prompt - The prompt to enforce genre count on
 * @param targetCount - The exact number of genres required (1-4)
 * @returns Modified prompt with exactly targetCount genres
 */
export function enforceGenreCount(prompt: string, targetCount: number): string {
  // Clamp target to valid range
  const clampedTarget = Math.max(1, Math.min(4, targetCount));

  // Extract current genres
  const currentGenres = extractGenresFromPrompt(prompt);

  // If count matches, return unchanged
  if (currentGenres.length === clampedTarget) {
    return prompt;
  }

  let newGenres: string[];

  if (currentGenres.length > clampedTarget) {
    // Too many genres: trim to first N
    newGenres = currentGenres.slice(0, clampedTarget);
    log.info('enforceGenreCount:trimmed', {
      from: currentGenres.length,
      to: clampedTarget,
      kept: newGenres,
    });
  } else {
    // Too few genres: add from registry
    const neededCount = clampedTarget - currentGenres.length;
    const additionalGenres = selectRandomGenres(currentGenres, neededCount);
    newGenres = [...currentGenres, ...additionalGenres];
    log.info('enforceGenreCount:added', {
      from: currentGenres.length,
      to: clampedTarget,
      added: additionalGenres,
    });
  }

  // Check if prompt has a genre field at all
  const hasGenreField = /^genre:\s*/im.test(prompt) || /^Genre:\s*/m.test(prompt);

  if (!hasGenreField) {
    // No genre field: add one at the beginning
    const genreLine = `genre: "${newGenres.join(', ')}"`;
    log.info('enforceGenreCount:added_field', { genres: newGenres });
    return `${genreLine}\n${prompt}`;
  }

  // Replace existing genre field
  return replaceFieldLine(prompt, 'Genre', newGenres.join(', '));
}
