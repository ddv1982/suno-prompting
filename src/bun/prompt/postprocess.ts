/**
 * Post-processing utilities for Suno prompts.
 *
 * Provides functions for meta removal, deduplication, length enforcement,
 * and locked phrase injection.
 *
 * @module prompt/postprocess
 */

/**
 * Validates that a locked phrase doesn't contain template syntax.
 *
 * @param phrase - The phrase to validate
 * @returns True if the phrase is valid (no {{ or }} syntax)
 *
 * @example
 * isValidLockedPhrase('piano, guitar') // true
 * isValidLockedPhrase('{{instrument}}') // false
 */
export function isValidLockedPhrase(phrase: string): boolean {
  if (!phrase) return true;
  return !phrase.includes('{{') && !phrase.includes('}}');
}

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
 *
 * @example
 * // Quoted format (MAX mode)
 * injectLockedPhrase('instruments: "piano"', 'guitar', true)
 * // Returns: 'instruments: "piano, guitar"'
 *
 * @example
 * // Unquoted format (standard mode)
 * injectLockedPhrase('Instruments: piano', 'guitar', false)
 * // Returns: 'Instruments: piano, guitar'
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
 * Known substrings that indicate leaked meta-instructions in LLM output.
 * Used to detect and remove LLM meta-commentary from generated prompts.
 */
export const LEAKED_META_SUBSTRINGS = [
  'remove word repetition',
  'remove repetition',
  'these words repeat',
  'output only',
  'condense to under',
  'strict constraints',
  "here's the revised prompt",
  'here is the revised prompt',
] as const;

/**
 * Checks if text contains leaked meta-instructions from LLM.
 *
 * @param text - The text to check
 * @returns True if any leaked meta substring is found
 *
 * @example
 * hasLeakedMeta('Great song here is the revised prompt') // true
 * hasLeakedMeta('Genre: jazz, Mood: smooth') // false
 */
export function hasLeakedMeta(text: string): boolean {
  const lower = text.toLowerCase();
  return LEAKED_META_SUBSTRINGS.some(s => lower.includes(s));
}

/**
 * Removes lines containing leaked meta-instructions from text.
 *
 * @param text - The text to filter
 * @returns Text with leaked meta lines removed
 *
 * @example
 * stripLeakedMetaLines('Genre: jazz\nHere is the revised prompt:\nMood: smooth')
 * // Returns: 'Genre: jazz\nMood: smooth'
 */
export function stripLeakedMetaLines(text: string): string {
  const lines = text.split('\n');
  const filtered = lines.filter(line => {
    const lower = line.toLowerCase();
    return !LEAKED_META_SUBSTRINGS.some(s => lower.includes(s));
  });
  return filtered.join('\n').trim();
}

/**
 * Attempt deterministic meta removal first, fall back to LLM if needed.
 * Removes common meta patterns like [Note: ...], (Note: ...), **Note**: etc.
 */
export function stripMetaDeterministic(text: string): string {
  return text
    .replace(/\[Note:.*?\]/gi, '')
    .replace(/\(Note:.*?\)/gi, '')
    .replace(/^Note:.*$/gim, '')
    .replace(/\*\*Note\*\*:.*$/gim, '')
    .replace(/^Instructions?:.*$/gim, '')
    .replace(/^Output:.*$/gim, '')
    .replace(/^Response:.*$/gim, '')
    .replace(/^Here is.*:$/gim, '')
    .replace(/^Here's.*:$/gim, '')
    .replace(/\n{3,}/g, '\n\n') // Normalize multiple newlines
    .trim();
}

/**
 * Attempt deterministic deduplication first.
 * Removes exact duplicate lines while preserving order.
 */
export function dedupDeterministic(text: string): string {
  const lines = text.split('\n');
  const seen = new Set<string>();
  return lines
    .filter(line => {
      const trimmed = line.trim();
      // Keep empty lines for formatting
      if (!trimmed) return true;
      if (seen.has(trimmed)) return false;
      seen.add(trimmed);
      return true;
    })
    .join('\n');
}

/**
 * Check if deterministic meta removal was successful.
 * Returns true if no leaked meta remains.
 */
function metaRemovalSuccessful(text: string): boolean {
  return !hasLeakedMeta(text);
}

/**
 * Check if deterministic dedup was sufficient.
 * Returns true if duplicate word count is below threshold.
 */
function dedupSuccessful(text: string, threshold: number = 3): boolean {
  const repeated = detectRepeatedWords(text);
  return repeated.length <= threshold;
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
 *
 * @example
 * truncateToLimit('Line 1\nLine 2\nLine 3', 10)
 * // Returns: 'Line 1...'
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
 * Detects repeated significant words in text.
 *
 * Words under 4 characters are ignored (common articles, prepositions).
 *
 * @param text - The text to analyze
 * @returns Array of repeated word strings
 *
 * @example
 * detectRepeatedWords('jazz jazz smooth smooth cool')
 * // Returns: ['jazz', 'smooth']
 */
export function detectRepeatedWords(text: string): string[] {
  const words = text.toLowerCase().split(/[\s,;.()[\]]+/);
  const seen = new Set<string>();
  const repeated = new Set<string>();

  for (const word of words) {
    if (word.length < 4) continue;
    if (seen.has(word)) repeated.add(word);
    seen.add(word);
  }

  return Array.from(repeated);
}

/**
 * Validates and fixes prompt format to ensure proper bracket tag header.
 *
 * Standard mode prompts must start with [Mood, Genre, Key: X mode].
 * If missing, extracts genre/mood from the prompt and adds the header.
 *
 * @param text - The prompt text to validate
 * @returns Prompt with proper format (bracket tag header)
 *
 * @example
 * validateAndFixFormat('Genre: Jazz\nMood: Smooth')
 * // Returns: '[Smooth, Jazz, Key: C Major]\n\nGenre: Jazz\nMood: Smooth'
 */
export function validateAndFixFormat(text: string): string {
  const trimmed = text.trim();
  if (trimmed.startsWith('[')) return trimmed;

  const genreMatch = trimmed.match(/^Genre:\s*(.+)$/m);
  const moodMatch = trimmed.match(/^Mood:\s*([^,]+)/m);

  const genre = genreMatch?.[1]?.trim() || 'Cinematic';
  const mood = moodMatch?.[1]?.trim() || 'Evocative';
  const bracketTag = `[${mood}, ${genre}, Key: C Major]`;

  return `${bracketTag}\n\n${trimmed}`;
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
 *
 * @example
 * ```typescript
 * const result = await postProcessPrompt(rawPrompt, {
 *   maxChars: 1000,
 *   minChars: 50,
 *   rewriteWithoutMeta: (t) => rewriteWithoutMeta(t, getModel),
 *   condense: (t) => condense(t, getModel),
 *   condenseWithDedup: (t, words) => condenseWithDedup(t, words, getModel),
 * });
 * ```
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
