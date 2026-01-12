/**
 * Quick Vibes Engine
 *
 * Barrel export for Quick Vibes module. Maintains backward compatibility
 * with existing imports from '@bun/ai/quick-vibes-engine'.
 *
 * @module ai/quick-vibes
 */

// Main engine functions
export { generateQuickVibes } from './engine';
export { refineQuickVibes } from './refinement';

// Types
export type { GenerateQuickVibesOptions, RefineQuickVibesOptions } from './types';

// Refinement helpers (for testing)
export {
  hashFeedback,
  createSeededRng,
  buildDeterministicQuickVibesFromTemplate,
  refineDeterministicQuickVibes,
} from './refinement';
