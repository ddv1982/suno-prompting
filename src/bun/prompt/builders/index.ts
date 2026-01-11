/**
 * Prompt builders for Suno V5
 * 
 * Re-exports all builder functions for backward compatibility.
 * This barrel export maintains the original @bun/prompt/builders import path.
 * 
 * @module prompt/builders
 */

// Standard mode builders
export { buildSystemPrompt, buildContextualPrompt } from './standard';

// Max mode builders
export { buildMaxModeSystemPrompt, buildMaxModeContextualPrompt } from './max-mode';

// Combined builders (style + title, style + title + lyrics)
export {
  buildCombinedSystemPrompt,
  buildCombinedWithLyricsSystemPrompt,
  type RefinementContext,
} from './combined';

// Re-export shared helpers for internal use
export {
  buildSongConceptParts,
  hasAnyGuidance,
  buildPerformanceGuidanceSection,
  buildContextualGuidance,
} from './shared';
