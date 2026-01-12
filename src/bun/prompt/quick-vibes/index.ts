/**
 * Quick Vibes Deterministic Templates
 *
 * Provides genre/instrument/mood pools for each Quick Vibes category,
 * enabling fully deterministic generation without LLM calls.
 *
 * @module prompt/quick-vibes
 */

// Builder and utilities
export {
  buildDeterministicQuickVibes,
  generateQuickVibesTitle,
  getQuickVibesTemplate,
} from './builder';

// Templates
export { QUICK_VIBES_TEMPLATES } from './templates';

// Types
export type {
  BuildQuickVibesOptions,
  MoodCategory,
  QuickVibesCategory,
  QuickVibesTemplate,
} from './types';
