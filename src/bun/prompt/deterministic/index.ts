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
} from './types';

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
import { detectGenreKeywordsOnly, selectRandomGenre, parseMultiGenre } from './genre';
import { joinRecordingDescriptors, selectMusicalKey, selectMusicalMode, selectKeyAndMode } from './helpers';
import { assembleInstruments } from './instruments';
import { assembleStyleTags } from './styles';

/**
 * @internal
 * Test helpers for unit testing internal functions.
 * Do not use in production code.
 */
export const _testHelpers = {
  detectGenreKeywordsOnly,
  selectRandomGenre,
  parseMultiGenre,
  assembleInstruments,
  assembleStyleTags,
  joinRecordingDescriptors,
  selectMusicalKey,
  selectMusicalMode,
  selectKeyAndMode,
} as const;
