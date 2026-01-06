/**
 * Creative Boost Engine
 *
 * Generates and refines creative music prompts with configurable
 * creativity levels, genre seeds, and lyrics options.
 *
 * @module ai/creative-boost
 */

// Public API - Generation
export { generateCreativeBoost, generateDirectMode } from './generate';

// Public API - Refinement
export { refineCreativeBoost } from './refine';

// Public API - Types
export type {
  CreativeBoostEngineConfig,
  GenerateCreativeBoostOptions,
  RefineCreativeBoostOptions,
} from './types';
