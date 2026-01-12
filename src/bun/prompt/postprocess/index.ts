/**
 * Post-processing Module
 *
 * Barrel export for postprocess module. Maintains backward compatibility
 * with existing imports from '@bun/prompt/postprocess'.
 *
 * @module prompt/postprocess
 */

// Main postprocess functions
export {
  injectLockedPhrase,
  truncateToLimit,
  enforceLengthLimit,
  postProcessPrompt,
} from './postprocess';

// Types
export type { PostProcessDeps } from './postprocess';

// Validators
export {
  LEAKED_META_SUBSTRINGS,
  hasLeakedMeta,
  stripLeakedMetaLines,
  stripMetaDeterministic,
  dedupDeterministic,
  detectRepeatedWords,
  validateAndFixFormat,
  isValidLockedPhrase,
  metaRemovalSuccessful,
  dedupSuccessful,
} from './validators';
