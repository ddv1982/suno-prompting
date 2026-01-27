/**
 * Genre utility functions
 *
 * Shared utilities for genre string manipulation.
 *
 * @module shared/utils/genre
 */

/**
 * Extract the base genre from a compound genre string.
 *
 * Compound genres like "jazz ambient" or "dark electronic" have a primary
 * genre as the first word. This function extracts it for registry lookups.
 *
 * @param genre - The genre string (may be compound like "jazz ambient")
 * @returns The lowercase base genre (first word), or empty string if invalid
 *
 * @example
 * extractBaseGenre('jazz ambient') // 'jazz'
 * extractBaseGenre('Dark Electronic') // 'dark'
 * extractBaseGenre('rock') // 'rock'
 * extractBaseGenre('') // ''
 */
export function extractBaseGenre(genre: string): string {
  return genre.split(' ')[0]?.toLowerCase() ?? '';
}
