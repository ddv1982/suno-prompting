import { LOCKED_PLACEHOLDER } from './builders';

export function isValidLockedPhrase(phrase: string): boolean {
  if (!phrase) return true;
  return !phrase.includes('{{') && !phrase.includes('}}');
}

export function swapLockedPhraseIn(text: string, lockedPhrase: string): string {
  if (!lockedPhrase) return text;
  return text.replaceAll(lockedPhrase, LOCKED_PLACEHOLDER);
}

export function swapLockedPhraseOut(text: string, lockedPhrase: string): string {
  if (!lockedPhrase) return text;
  return text.replaceAll(LOCKED_PLACEHOLDER, lockedPhrase);
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

export function truncateToLimit(text: string, limit: number): string {
  if (text.length <= limit) return text;

  const truncated = text.slice(0, limit - 3);
  const lastNewline = truncated.lastIndexOf('\n');
  const lastComma = truncated.lastIndexOf(',');
  const breakPoint = Math.max(lastNewline, lastComma);

  return (breakPoint > limit * 0.7 ? truncated.slice(0, breakPoint) : truncated) + '...';
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
  let result = stripLeakedMetaLines(text.trim());
  if (hasLeakedMeta(result)) {
    result = await deps.rewriteWithoutMeta(result);
  }

  result = validateAndFixFormat(result);

  const repeated = detectRepeatedWords(result);
  if (repeated.length > 3) {
    result = await deps.condenseWithDedup(result, repeated);
  }

  if (result.length > deps.maxChars) {
    const condensed = await deps.condense(result);
    result = condensed.length <= deps.maxChars ? condensed : truncateToLimit(condensed, deps.maxChars);
  }

  result = stripLeakedMetaLines(result);
  if (hasLeakedMeta(result)) {
    result = await deps.rewriteWithoutMeta(result);
    result = stripLeakedMetaLines(result);
  }

  if (result.trim().length < deps.minChars) return text.trim();
  return result.trim();
}
