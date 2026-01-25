import { APP_CONSTANTS } from '@shared/constants';

// Re-export from shared module for backend use
export {
  QUICK_VIBES_CATEGORIES,
  QUICK_VIBES_CATEGORY_LIST,
  type QuickVibesCategoryDefinition,
} from '@shared/quick-vibes-categories';

// Re-export constants from APP_CONSTANTS for backward compatibility
export const QUICK_VIBES_MAX_CHARS = APP_CONSTANTS.QUICK_VIBES_MAX_CHARS;
export const QUICK_VIBES_GENERATION_LIMIT = APP_CONSTANTS.QUICK_VIBES_GENERATION_LIMIT;
