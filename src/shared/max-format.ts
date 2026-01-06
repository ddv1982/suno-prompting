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
 * First line of the MAX_MODE_TAGS header.
 */
export const MAX_MODE_TAGS_SIGNATURE = '::tags realistic music ::';

/**
 * Check if text is already in Max Mode format.
 * Detects either the standard header or the Suno V5 tags format.
 */
export function isMaxFormat(text: string): boolean {
  return text.includes(MAX_MODE_SIGNATURE) || text.includes(MAX_MODE_TAGS_SIGNATURE);
}

/**
 * The full Max Mode header with all quality tags.
 * Re-exported from APP_CONSTANTS for convenience.
 */
export const MAX_MODE_HEADER = APP_CONSTANTS.MAX_MODE_HEADER;
