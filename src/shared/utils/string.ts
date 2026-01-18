/**
 * String matching utilities.
 *
 * @module shared/utils/string
 */

/**
 * Escape special regex characters in a string.
 */
function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Check if a word appears as a whole word in text (not as substring).
 * Uses word boundary matching to avoid false positives like "disco" in "discovering".
 * Handles special regex characters safely (e.g., "r&b", "lo-fi", "80s").
 *
 * @param text - The text to search in
 * @param word - The word to find
 * @returns true if word appears as a whole word (case-insensitive)
 *
 * @example
 * ```typescript
 * matchesWholeWord('discovering new worlds', 'disco') // false
 * matchesWholeWord('disco music', 'disco') // true
 * matchesWholeWord('Ambient song', 'ambient') // true (case-insensitive)
 * matchesWholeWord('r&b vibes', 'r&b') // true (special chars handled)
 * ```
 */
export function matchesWholeWord(text: string, word: string): boolean {
  const escaped = escapeRegex(word);
  const pattern = new RegExp(`\\b${escaped}\\b`, 'i');
  return pattern.test(text);
}
