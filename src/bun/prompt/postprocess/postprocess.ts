/**
 * Post-processing utilities for Suno prompts.
 *
 * Provides functions for meta removal, deduplication, length enforcement,
 * and locked phrase injection.
 *
 * @module prompt/postprocess/postprocess
 */

import {
  stripLeakedMetaLines,
  stripMetaDeterministic,
  dedupDeterministic,
  metaRemovalSuccessful,
  dedupSuccessful,
  detectRepeatedWords,
  validateAndFixFormat,
} from './validators';

/**
 * Injects a locked phrase into the instruments field of a prompt.
 *
 * Supports both quoted format (MAX mode) and unquoted format (standard mode).
 * Falls back to appending at end if no instruments field is found.
 *
 * @param prompt - The prompt to inject into
 * @param lockedPhrase - The phrase to inject (e.g., "acoustic guitar")
 * @param _maxMode - Whether MAX mode is enabled (currently unused)
 * @returns The prompt with the locked phrase injected
 */
export function injectLockedPhrase(prompt: string, lockedPhrase: string, _maxMode: boolean): string {
  if (!lockedPhrase) return prompt;

  // Try quoted format first: instruments: "piano, guitar"
  const quotedMatch = prompt.match(/^(instruments:\s*")([^"]*)/mi);
  if (quotedMatch) {
    const existingValue = (quotedMatch[2] ?? '').trim();
    const separator = existingValue ? ', ' : '';
    return prompt.replace(
      /^(instruments:\s*")([^"]*)/mi,
      `$1$2${separator}${lockedPhrase}`
    );
  }

  // Try unquoted format: instruments: piano, guitar OR Instruments: piano, guitar
  // Use [^\S\n]* for horizontal whitespace only (not newlines), and * to handle empty content
  const unquotedMatch = prompt.match(/^(instruments:[^\S\n]*)([^"\n]*)$/mi);
  if (unquotedMatch) {
    const existingValue = (unquotedMatch[2] ?? '').trim();
    // If no existing value, ensure space after colon; if existing, add comma separator
    const prefix = existingValue ? '' : ((unquotedMatch[1] ?? '').endsWith(' ') ? '' : ' ');
    const separator = existingValue ? ', ' : '';
    return prompt.replace(
      /^(instruments:[^\S\n]*)([^"\n]*)$/mi,
      `$1$2${separator}${prefix}${lockedPhrase}`
    );
  }

  // Fallback: append to end if no instruments field found
  return `${prompt}\n${lockedPhrase}`;
}

/**
 * Truncates text to a character limit, preserving clean break points.
 *
 * Attempts to break at newlines or commas for cleaner truncation.
 * Appends "..." to indicate truncation occurred.
 *
 * @param text - The text to truncate
 * @param limit - Maximum character count
 * @returns Truncated text with "..." suffix if truncated
 */
export function truncateToLimit(text: string, limit: number): string {
  if (text.length <= limit) return text;

  const truncated = text.slice(0, limit - 3);
  const lastNewline = truncated.lastIndexOf('\n');
  const lastComma = truncated.lastIndexOf(',');
  const breakPoint = Math.max(lastNewline, lastComma);

  return (breakPoint > limit * 0.7 ? truncated.slice(0, breakPoint) : truncated) + '...';
}

/**
 * Enforce character limit: condense if over, truncate as last resort.
 * Shared by Full Mode (postProcessPrompt) and Creative Boost (enforceMaxLength).
 */
export async function enforceLengthLimit(
  text: string,
  maxChars: number,
  condense: (text: string) => Promise<string>
): Promise<string> {
  if (text.length <= maxChars) {
    return text;
  }
  const condensed = await condense(text);
  return condensed.length <= maxChars
    ? condensed
    : truncateToLimit(condensed, maxChars);
}

/**
 * Dependencies for post-processing prompts.
 * Provides character limits and LLM-based rewriting functions.
 */
export type PostProcessDeps = {
  /** Maximum allowed character count */
  readonly maxChars: number;
  /** Minimum allowed character count (below this, return original) */
  readonly minChars: number;
  /** LLM function to remove meta-instructions */
  readonly rewriteWithoutMeta: (text: string) => Promise<string>;
  /** LLM function to condense text length */
  readonly condense: (text: string) => Promise<string>;
  /** LLM function to condense and deduplicate repeated words */
  readonly condenseWithDedup: (text: string, repeatedWords: string[]) => Promise<string>;
};

/**
 * Post-processes a generated prompt for quality and compliance.
 *
 * Processing steps:
 * 1. Remove leaked meta-instructions (deterministic first, then LLM fallback)
 * 2. Validate and fix prompt format (add bracket header if missing)
 * 3. Deduplicate repeated words (deterministic first, then LLM fallback)
 * 4. Enforce character length limit (condense if over)
 * 5. Final cleanup pass
 *
 * @param text - The raw prompt text to process
 * @param deps - Processing dependencies (limits and LLM functions)
 * @returns Cleaned and validated prompt text
 */
export async function postProcessPrompt(text: string, deps: PostProcessDeps): Promise<string> {
  // Step 1: Try deterministic meta removal first
  let result = stripLeakedMetaLines(text.trim());
  result = stripMetaDeterministic(result);

  // Only use LLM if deterministic removal didn't fully work
  if (!metaRemovalSuccessful(result)) {
    result = await deps.rewriteWithoutMeta(result);
  }

  result = validateAndFixFormat(result);

  // Step 2: Try deterministic dedup first
  result = dedupDeterministic(result);

  // Only use LLM dedup if deterministic dedup didn't suffice
  const repeated = detectRepeatedWords(result);
  if (repeated.length > 3 && !dedupSuccessful(result)) {
    result = await deps.condenseWithDedup(result, repeated);
  }

  // Step 3: Handle length limit
  if (result.length > deps.maxChars) {
    result = await enforceLengthLimit(result, deps.maxChars, deps.condense);
  }

  // Step 4: Final cleanup - try deterministic first
  result = stripLeakedMetaLines(result);
  result = stripMetaDeterministic(result);

  // Only use LLM if deterministic removal still didn't work
  if (!metaRemovalSuccessful(result)) {
    result = await deps.rewriteWithoutMeta(result);
    result = stripLeakedMetaLines(result);
  }

  if (result.trim().length < deps.minChars) return text.trim();
  return result.trim();
}

// Re-export validators for convenience
export {
  LEAKED_META_SUBSTRINGS,
  hasLeakedMeta,
  stripLeakedMetaLines,
  stripMetaDeterministic,
  dedupDeterministic,
  detectRepeatedWords,
  validateAndFixFormat,
  isValidLockedPhrase,
} from './validators';
