import { ALIAS_TO_CANONICAL } from '@bun/instruments/registry';

export interface ExtractionResult {
  readonly found: readonly string[];
  readonly unrecognized: readonly string[];
}

const INSTRUMENT_CONTEXT_PATTERNS = [
  /\bwith\s+(?:a\s+)?(.+?)(?:\s+and\s+|\s*,\s*|\s*$)/gi,
  /\bfeaturing\s+(.+?)(?:\s+and\s+|\s*,\s*|\s*$)/gi,
  /\busing\s+(.+?)(?:\s+and\s+|\s*,\s*|\s*$)/gi,
  /\binstruments?:\s*(.+?)(?:\.|$)/gi,
] as const;

export function normalizeToken(token: string): string {
  return token
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, ' ');
}

export function matchInstrument(token: string): string | null {
  const normalized = normalizeToken(token);
  if (!normalized) return null;
  
  // Direct match
  const direct = ALIAS_TO_CANONICAL.get(normalized);
  if (direct) return direct;

  // Try without common prefixes/suffixes
  const withoutArticles = normalized.replace(/^(a|an|the|some)\s+/, '');
  const withArticlesRemoved = ALIAS_TO_CANONICAL.get(withoutArticles);
  if (withArticlesRemoved) return withArticlesRemoved;

  return null;
}

function extractTokensFromText(text: string): string[] {
  const tokens: string[] = [];
  
  // First try context patterns
  for (const pattern of INSTRUMENT_CONTEXT_PATTERNS) {
    const regex = new RegExp(pattern.source, pattern.flags);
    let match;
    while ((match = regex.exec(text)) !== null) {
      if (match[1]) {
        // Split on common delimiters
        const parts = match[1].split(/\s*(?:,|and|&)\s*/i);
        tokens.push(...parts.map(p => p.trim()).filter(Boolean));
      }
    }
  }

  // Also scan for known instruments directly in text
  const words = text.split(/[\s,;.()[\]]+/);
  
  // Try single words and 2-3 word combinations
  for (let i = 0; i < words.length; i++) {
    const word = words[i];
    if (word) tokens.push(word);
    if (i + 1 < words.length) {
      const next = words[i + 1];
      if (word && next) tokens.push(`${word} ${next}`);
    }
    if (i + 2 < words.length) {
      const next = words[i + 1];
      const nextNext = words[i + 2];
      if (word && next && nextNext) tokens.push(`${word} ${next} ${nextNext}`);
    }
  }

  return tokens;
}

export function extractInstruments(text: string): ExtractionResult {
  const tokens = extractTokensFromText(text);
  const found = new Set<string>();
  const checkedTokens = new Set<string>();
  const unmatchedTokens: string[] = [];

  for (const token of tokens) {
    const normalized = normalizeToken(token);
    if (!normalized || checkedTokens.has(normalized)) continue;
    checkedTokens.add(normalized);

    const canonical = matchInstrument(token);
    if (canonical) {
      found.add(canonical);
    }
  }

  // Track unrecognized tokens that look like they might be instruments
  // (longer tokens from context patterns that didn't match)
  for (const pattern of INSTRUMENT_CONTEXT_PATTERNS) {
    const regex = new RegExp(pattern.source, pattern.flags);
    let match;
    while ((match = regex.exec(text)) !== null) {
      if (match[1]) {
        const parts = match[1].split(/\s*(?:,|and|&)\s*/i);
        for (const part of parts) {
          const normalized = normalizeToken(part);
          if (normalized && !matchInstrument(part) && normalized.length > 2) {
            unmatchedTokens.push(part.trim());
          }
        }
      }
    }
  }

  return {
    found: Array.from(found),
    unrecognized: [...new Set(unmatchedTokens)],
  };
}

// Test helper exports
export const _testHelpers = {
  extractTokensFromText,
  INSTRUMENT_CONTEXT_PATTERNS,
};
