/**
 * Creative Boost Helpers
 *
 * Helper utilities for Creative Boost Engine organized by domain.
 *
 * @module ai/creative-boost/helpers
 */

// Conversion
export { applyMaxModeConversion } from './conversion';

// Length enforcement
export { enforceMaxLength } from './length';

// Vocal injection
export { injectWordlessVocals } from './vocals';

// Genre count enforcement
export { enforceGenreCount } from './genre-count';

// Content generation
export {
  DEFAULT_LYRICS_TOPIC,
  buildCreativeBoostStyle,
  generateCreativeBoostLyrics,
  generateCreativeBoostTitle,
  generateLyricsForCreativeBoost,
  resolveGenreForCreativeBoost,
  type GenerationDebugInfo,
  type GenreDetectionDebugInfo,
} from './content';

// Post-processing
export { postProcessCreativeBoostResponse } from './postprocess';

// Debug helpers
export { buildCreativeBoostDebugInfo } from './debug';
