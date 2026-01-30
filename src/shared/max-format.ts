/**
 * Max Mode format detection utilities.
 * Shared between frontend and backend.
 */

import { APP_CONSTANTS } from '@shared/constants';

/**
 * The signature that identifies a Max Mode formatted prompt (standard format).
 * This is the first line of the MAX_MODE_HEADER.
 */
export const MAX_MODE_SIGNATURE = '[Is_MAX_MODE: MAX](MAX)';

/**
 * Alternative signature used by deterministic builder (Suno V5 tags format).
 * First line of the MAX_MODE_TAGS_HEADER.
 */
export const MAX_MODE_TAGS_SIGNATURE = '::tags realistic music ::';

/**
 * Full Suno V5 tags header used by deterministic builder.
 * Alternative to MAX_MODE_HEADER for faster generation.
 */
export const MAX_MODE_TAGS_HEADER = `::tags realistic music ::
::quality maximum ::
::style suno v5 ::`;

/**
 * Check if text is already in Max Mode format.
 * Detects either the standard header or the Suno V5 tags format.
 *
 * @param text - The text to check for Max Mode format
 * @returns true if text contains either Max Mode header format
 *
 * @example
 * isMaxFormat('[Is_MAX_MODE: MAX](MAX)\ngenre: "jazz"')
 * // true
 *
 * @example
 * isMaxFormat('::tags realistic music ::\ngenre: "jazz"')
 * // true (Suno V5 tags format)
 *
 * @example
 * isMaxFormat('Genre: jazz\nBPM: 120')
 * // false (standard mode)
 */
export function isMaxFormat(text: string): boolean {
  return text.includes(MAX_MODE_SIGNATURE) || text.includes(MAX_MODE_TAGS_SIGNATURE);
}

/**
 * The full Max Mode header with all quality tags.
 * Re-exported from APP_CONSTANTS for convenience.
 */
export const MAX_MODE_HEADER = APP_CONSTANTS.MAX_MODE_HEADER;

/**
 * Formats a prompt in MAX mode format.
 * Uses lowercase field names consistent with Full Prompt MAX mode.
 *
 * @param genre - The genre string
 * @param mood - The mood string
 * @param instruments - Array of instrument names
 * @returns MAX mode formatted text
 *
 * @example
 * formatMaxModePrompt('jazz', 'smooth', ['Rhodes', 'upright bass', 'brushed drums'])
 * // Returns: 'genre: "jazz"\nmood: "smooth"\ninstruments: "Rhodes, upright bass, brushed drums"'
 */
export function formatMaxModePrompt(
  genre: string,
  mood: string,
  instruments: readonly string[]
): string {
  const lines = [
    `genre: "${genre}"`,
    `mood: "${mood}"`,
    `instruments: "${instruments.join(', ')}"`,
  ];
  return lines.join('\n');
}
