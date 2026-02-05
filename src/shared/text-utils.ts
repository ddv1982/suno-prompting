/**
 * Text utility functions for string transformations.
 *
 * @module shared/text-utils
 */

/**
 * Special case mappings for title-case transformation.
 * These words need specific capitalization when displayed.
 */
const SPECIAL_CASES: Record<string, string> = {
  'r&b': 'R&B',
  'lo-fi': 'Lo-Fi',
  'k-pop': 'K-Pop',
  'j-pop': 'J-Pop',
  'g-funk': 'G-Funk',
  'p-funk': 'P-Funk',
  edm: 'EDM',
  'nu-disco': 'Nu-Disco',
  uk: 'UK',
  dnb: 'DnB',
};

/**
 * Convert a string to title case for display.
 * Handles special cases like R&B, Lo-Fi, K-Pop, etc.
 *
 * @param str - The string to convert to title case
 * @returns Title-cased display string
 *
 * @example
 * ```typescript
 * toTitleCase('r&b') // 'R&B'
 * toTitleCase('lo-fi hip hop') // 'Lo-Fi Hip Hop'
 * toTitleCase('16-bit') // '16-Bit'
 * toTitleCase('indie rock') // 'Indie Rock'
 * ```
 */
export function toTitleCase(str: string): string {
  return str
    .split(' ')
    .map((word) => {
      const lower = word.toLowerCase();

      // Check for exact special case match
      if (SPECIAL_CASES[lower]) {
        return SPECIAL_CASES[lower];
      }

      // Handle hyphenated words
      if (word.includes('-')) {
        return word
          .split('-')
          .map((part) => {
            const lowerPart = part.toLowerCase();
            // Check for special case in hyphenated part
            if (SPECIAL_CASES[lowerPart]) {
              return SPECIAL_CASES[lowerPart];
            }
            // Keep numeric parts as-is (e.g., "16-bit" → "16-Bit")
            if (/^\d+$/.test(part)) {
              return part;
            }
            // Standard title case for other parts
            return part.charAt(0).toUpperCase() + part.slice(1).toLowerCase();
          })
          .join('-');
      }

      // Standard title case
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    })
    .join(' ');
}
