/**
 * Prompt Validators for Post-processing
 *
 * Contains validation and detection functions for prompt quality.
 * Extracted from postprocess.ts for better separation of concerns.
 *
 * @module prompt/postprocess/validators
 */

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
export function metaRemovalSuccessful(text: string): boolean {
  return !hasLeakedMeta(text);
}

/**
 * Check if deterministic dedup was sufficient.
 * Returns true if duplicate word count is below threshold.
 */
export function dedupSuccessful(text: string, threshold: number = 3): boolean {
  const repeated = detectRepeatedWords(text);
  return repeated.length <= threshold;
}

/**
 * Detects repeated significant words in text.
 *
 * Words under 4 characters are ignored (common articles, prepositions).
 *
 * @param text - The text to analyze
 * @returns Array of repeated word strings
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
 * Validates that a locked phrase doesn't contain template syntax.
 *
 * @param phrase - The phrase to validate
 * @returns True if the phrase is valid (no {{ or }} syntax)
 */
export function isValidLockedPhrase(phrase: string): boolean {
  if (!phrase) return true;
  return !phrase.includes('{{') && !phrase.includes('}}');
}

/**
 * Validates and fixes prompt format to ensure proper bracket tag header.
 *
 * Standard mode prompts must start with [Mood, Genre, Key: X mode].
 * If missing, extracts genre/mood from the prompt and adds the header.
 *
 * @param text - The prompt text to validate
 * @returns Prompt with proper format (bracket tag header)
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
