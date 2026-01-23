/**
 * Deterministic Prompt Builder
 *
 * Generates Suno prompts deterministically without LLM calls.
 * Uses existing data sources (genres, instruments, chord progressions, etc.)
 * to create high-quality prompts in <50ms.
 *
 * @module prompt/deterministic
 */

// Re-export types
export type {
  DeterministicOptions,
  DeterministicResult,
  DeterministicMetadata,
  ResolvedGenre,
  InstrumentAssemblyResult,
  StyleTagsResult,
  RemixResult,
  TagCategoryWeights,
} from './types';

// Re-export constants
export { DEFAULT_TAG_WEIGHTS } from './types';

// Re-export genre weights
export { GENRE_TAG_WEIGHTS, getTagWeightsForGenre } from './weights';

// Re-export genre aliases
export {
  GENRE_ALIASES,
  resolveGenreAlias,
  findGenreAliasInText,
} from './aliases';

// Re-export genre detection
export { detectAllGenres, detectGenreKeywordsOnly } from './genre';

// Re-export coherence validation
export type { CoherenceResult } from './coherence';
export {
  checkCoherence,
  validateAndFixCoherence,
  getConflictDescription,
  getAllConflictRuleIds,
} from './coherence';

// Re-export main builder functions
export { buildDeterministicMaxPrompt } from './max-builder';
export { buildDeterministicStandardPrompt } from './standard-builder';

// Re-export remix operations
export {
  extractGenreFromPrompt,
  extractGenresFromPrompt,
  extractMoodFromPrompt,
  injectStyleTags,
  remixInstruments,
  remixGenre,
  remixMood,
  remixMoodInPrompt,
  remixStyleTags,
  remixRecording,
  type RemixGenreOptions,
} from './remix-operations';

// Re-export test helpers
import { selectRandomGenre, parseMultiGenre } from './genre';
import { joinRecordingDescriptors, selectMusicalKey, selectMusicalMode, selectKeyAndMode } from './helpers';
import { assembleInstruments } from './instruments';
import { assembleStyleTags } from './styles';

/**
 * @internal
 * Test helpers for unit testing internal functions.
 * Do not use in production code.
 * Note: detectGenreKeywordsOnly is now a public export, not included here.
 */
export const _testHelpers = {
  selectRandomGenre,
  parseMultiGenre,
  assembleInstruments,
  assembleStyleTags,
  joinRecordingDescriptors,
  selectMusicalKey,
  selectMusicalMode,
  selectKeyAndMode,
} as const;
