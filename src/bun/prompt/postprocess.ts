/**
 * Post-processing utilities for Suno prompts.
 *
 * Re-exports from the postprocess directory for backward compatibility.
 * See @bun/prompt/postprocess/ for implementation details.
 *
 * @module prompt/postprocess
 */

export {
  injectLockedPhrase,
  truncateToLimit,
  enforceLengthLimit,
  postProcessPrompt,
  LEAKED_META_SUBSTRINGS,
  hasLeakedMeta,
  stripLeakedMetaLines,
  stripMetaDeterministic,
  dedupDeterministic,
  detectRepeatedWords,
  validateAndFixFormat,
  isValidLockedPhrase,
} from './postprocess/index';

export type { PostProcessDeps } from './postprocess/index';
