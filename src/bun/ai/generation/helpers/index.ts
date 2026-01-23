/**
 * Generation Helpers
 *
 * Barrel export for generation helper modules.
 *
 * @module ai/generation/helpers
 */

export { extractThematicContextIfAvailable } from './thematic-context';
export {
  resolveGenreStrategy,
  logGenreResolution,
  logThematicContext,
  type GenreStrategyResult,
} from './genre-strategy';
export { buildPromptForMode } from './prompt-builder';
