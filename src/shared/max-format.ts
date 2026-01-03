/**
 * Max Mode format detection utilities.
 * Shared between frontend and backend.
 */

import { APP_CONSTANTS } from '@shared/constants';

/**
 * The signature that identifies a Max Mode formatted prompt.
 * This is the first line of the MAX_MODE_HEADER.
 */
export const MAX_MODE_SIGNATURE = '[Is_MAX_MODE: MAX](MAX)';

/**
 * Check if text is already in Max Mode format.
 * Detects the presence of the Max Mode signature header.
 */
export function isMaxFormat(text: string): boolean {
  return text.includes(MAX_MODE_SIGNATURE);
}

/**
 * The full Max Mode header with all quality tags.
 * Re-exported from APP_CONSTANTS for convenience.
 */
export const MAX_MODE_HEADER = APP_CONSTANTS.MAX_MODE_HEADER;
