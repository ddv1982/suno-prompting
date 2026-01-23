/**
 * Constants for Initial Prompt Generation Module
 *
 * @module ai/generation/constants
 */

import { APP_CONSTANTS } from '@shared/constants';

/** Maximum time to wait for thematic extraction before falling back to deterministic */
export const THEMATIC_EXTRACTION_TIMEOUT_MS = APP_CONSTANTS.AI.THEMATIC_EXTRACTION_TIMEOUT_MS;

/** Maximum characters to log for description to avoid oversized log entries */
export const MAX_LOG_DESCRIPTION_LENGTH = 100;
