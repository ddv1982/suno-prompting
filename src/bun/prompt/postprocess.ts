export function isValidLockedPhrase(phrase: string): boolean {
  if (!phrase) return true;
  return !phrase.includes('{{') && !phrase.includes('}}');
}

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

export function hasLeakedMeta(text: string): boolean {
  const lower = text.toLowerCase();
  return LEAKED_META_SUBSTRINGS.some(s => lower.includes(s));
}

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

export type PostProcessDeps = {
  readonly maxChars: number;
  readonly minChars: number;
  readonly rewriteWithoutMeta: (text: string) => Promise<string>;
  readonly condense: (text: string) => Promise<string>;
  readonly condenseWithDedup: (text: string, repeatedWords: string[]) => Promise<string>;
};

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
