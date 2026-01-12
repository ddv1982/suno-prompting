/**
 * Prompt Refinement Module
 *
 * Barrel export for refinement module. Maintains backward compatibility
 * with existing imports from '@bun/ai/refinement'.
 *
 * @module ai/refinement
 */

// Main refinement function
export { refinePrompt } from './refinement';

// Types
export type { RefinePromptOptions } from './types';

// Validation utilities (for testing or advanced use)
export { validateOllamaForRefinement, applyLockedPhraseIfNeeded } from './validation';

// Lyrics refinement (for testing or advanced use)
export { refineLyricsWithFeedback, buildLyricsRefinementPrompt } from './lyrics-refinement';
