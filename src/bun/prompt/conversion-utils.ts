// Shared utilities for prompt conversion modules
// Consolidates duplicate logic between max-conversion.ts and non-max-conversion.ts

import { GENRE_REGISTRY, type GenreType } from '@bun/instruments/genres';
import { selectInstrumentsForGenre } from '@bun/instruments/guidance';
import { articulateInstrument } from '@bun/prompt/articulations';
import { VOCAL_DELIVERIES, VOCAL_TECHNIQUES } from '@bun/prompt/vocal-descriptors';
import { APP_CONSTANTS } from '@shared/constants';
import { formatGenreLabels } from '@shared/labels';

// ============================================================================
// Constants
// ============================================================================

export const DEFAULT_BPM = 90;
export const DEFAULT_GENRE = 'ambient';
export const DEFAULT_INSTRUMENTS_FALLBACK = 'ambient pad, subtle textures';

// ============================================================================
// Genre Utilities
// ============================================================================

/**
 * Extract the first genre from a potentially comma-separated genre string
 * Note: Splits on commas only, not spaces (genres can have spaces like "hip hop")
 */
export function extractFirstGenre(genre: string): string {
  return genre.split(',')[0]?.toLowerCase().trim() || '';
}

// Genre aliases for common variations (defined before normalizeGenre which uses it)
export const GENRE_ALIASES: Record<string, string> = {
  'hip hop': 'trap',
  'hip-hop': 'trap',
  'hiphop': 'trap',
  'rnb': 'rnb',
  'r&b': 'rnb',
  'r and b': 'rnb',
  'lofi': 'lofi',
  'lo-fi': 'lofi',
  'lo fi': 'lofi',
  'edm': 'electronic',
  'dance': 'house',
  'dnb': 'electronic',
  'drum and bass': 'electronic',
  'orchestral': 'cinematic',
  'film score': 'cinematic',
  'soundtrack': 'cinematic',
  'acoustic': 'folk',
  'singer-songwriter': 'folk',
  'singer songwriter': 'folk',
  'r&b/soul': 'rnb',
  'progressive rock': 'rock',
  'prog rock': 'rock',
  'alternative': 'indie',
  'alt rock': 'indie',
  'hard rock': 'rock',
  'classic rock': 'rock',
  'nu metal': 'metal',
  'heavy metal': 'metal',
  'thrash': 'metal',
  'neo soul': 'soul',
  'neo-soul': 'soul',
  'bossa nova': 'jazz',
  'bossa': 'jazz',
  'smooth jazz': 'jazz',
  'bebop': 'jazz',
  'fusion': 'jazz',
};

/**
 * Normalize genre string and look up in registry or aliases
 */
export function normalizeGenre(genre: string): string | null {
  const normalized = genre.toLowerCase().trim();

  // Direct registry lookup
  if (normalized in GENRE_REGISTRY) {
    return normalized;
  }

  // Check aliases
  if (normalized in GENRE_ALIASES) {
    return GENRE_ALIASES[normalized] || null;
  }

  // Try first word for compound genres like "jazz fusion"
  const firstWord = normalized.split(/[\s,]+/)[0];
  if (firstWord && firstWord in GENRE_REGISTRY) {
    return firstWord;
  }

  return null;
}

// ============================================================================
// BPM Inference
// ============================================================================

/**
 * Infer BPM from genre using GENRE_REGISTRY
 * Handles comma-separated multi-genre strings by using the first genre
 * Can use either normalized lookup (with aliases) or direct lookup
 */
export function inferBpm(genre: string | null, useAliases = true): number {
  if (!genre) return DEFAULT_BPM;

  const firstGenre = extractFirstGenre(genre);
  const lookupGenre = useAliases ? normalizeGenre(firstGenre) : firstGenre;
  
  if (lookupGenre && lookupGenre in GENRE_REGISTRY) {
    const genreDef = GENRE_REGISTRY[lookupGenre as GenreType];
    if (genreDef?.bpm) {
      return genreDef.bpm.typical;
    }
  }

  return DEFAULT_BPM;
}

// ============================================================================
// Instrument Enhancement
// ============================================================================

/**
 * Enhance instruments list with articulations.
 * If no instruments provided, selects genre-appropriate defaults.
 * Handles comma-separated multi-genre strings by using the first genre.
 *
 * Priority: parsed instruments > performance guidance > genre fallback
 */
export function enhanceInstruments(
  instruments: string[],
  genre: string | null,
  fallback = DEFAULT_INSTRUMENTS_FALLBACK,
  performanceInstruments?: string[]
): string {
  let instrumentList = instruments;
  
  // Priority: parsed > performance guidance > genre fallback
  if (instrumentList.length === 0 && performanceInstruments?.length) {
    instrumentList = performanceInstruments;
  } else if (instrumentList.length === 0) {
    const firstGenre = genre ? extractFirstGenre(genre) : null;
    const normalizedGenre = firstGenre ? normalizeGenre(firstGenre) : null;
    
    if (normalizedGenre && normalizedGenre in GENRE_REGISTRY) {
      instrumentList = selectInstrumentsForGenre(normalizedGenre as GenreType, { maxTags: 3 });
    } else {
      return fallback;
    }
  }

  const enhanced = instrumentList.map((instrument) =>
    articulateInstrument(instrument, Math.random, APP_CONSTANTS.ARTICULATION_CHANCE)
  );

  return enhanced.join(', ');
}

// ============================================================================
// Vocal Detection
// ============================================================================

const NEGATIVE_VOCALS_PATTERNS = [
  /\bno\s+(?:vocals?|singing|voice)\b/i,
  /\bwithout\s+(?:vocals?|singing|voice)\b/i,
  /\binstrumental\s+only\b/i,
  /\bthis\s+is\s+instrumental\b/i,
] as const;

const VOCAL_RANGE_PATTERN = '(?:bass|baritone|tenor|alto|soprano|contralto|mezzo(?:\s+soprano)?|mezzo-soprano)';
const VOCAL_ADJECTIVE_PATTERN = '(?:soft|intimate|breathy|whisper(?:y|ed)?|ethereal|airy|warm|gentle|raw|powerful|lush)';

const VOCAL_CONTEXT_RE = /\b(vocals?|voice|singing|singer|choir)\b/i;

const SUPPLEMENTAL_VOCAL_DESCRIPTORS = ['haunting'] as const;

const MAX_INSTRUMENT_ITEMS = 6;

const VOCAL_TECHNIQUE_TAG_SET = new Set<string>(VOCAL_TECHNIQUES.map((t) => t.toLowerCase()));
const VOCAL_DELIVERY_TAG_SET = new Set<string>(VOCAL_DELIVERIES.map((d) => `${d.toLowerCase()} vocals`));
const SUPPLEMENTAL_VOCAL_TAG_SET = new Set<string>(SUPPLEMENTAL_VOCAL_DESCRIPTORS.map((d) => `${d.toLowerCase()} vocals`));
const VOCAL_PERFORMANCE_TAG_SET = new Set<string>([
  ...VOCAL_TECHNIQUE_TAG_SET,
  ...VOCAL_DELIVERY_TAG_SET,
  ...SUPPLEMENTAL_VOCAL_TAG_SET,
]);

function escapeRegExp(input: string): string {
  return input.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function phraseToWordBoundaryRegex(phrase: string): RegExp {
  const parts = phrase
    .trim()
    .split(/\s+/)
    .map(escapeRegExp)
    .join('\\s+');
  return new RegExp(`\\b${parts}\\b`, 'i');
}

function splitIntoSentences(text: string): string[] {
  return text
    .split(/[.!?]+|\n+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

function splitCsvItems(csv: string): string[] {
  return csv
    .split(',')
    .map((i) => i.trim())
    .filter(Boolean);
}

function hasNegativeVocals(text: string): boolean {
  return NEGATIVE_VOCALS_PATTERNS.some((re) => re.test(text));
}

function hasAnyVocalContext(text: string): boolean {
  const rangeRe = new RegExp(`\\b${VOCAL_RANGE_PATTERN}\\b`, 'i');
  return VOCAL_CONTEXT_RE.test(text) || rangeRe.test(text);
}

function getVocalContextSentences(text: string): { vocalSentences: string[]; chorusOrHookSentences: string[] } {
  const rangeRe = new RegExp(`\\b${VOCAL_RANGE_PATTERN}\\b`, 'i');
  const sentences = splitIntoSentences(text);

  return {
    vocalSentences: sentences.filter((s) => VOCAL_CONTEXT_RE.test(s) || rangeRe.test(s)),
    chorusOrHookSentences: sentences.filter((s) => /\b(chorus|hook|hooks)\b/i.test(s)),
  };
}

const DELIVERY_REGEXES = VOCAL_DELIVERIES.map((d) => ({
  re: phraseToWordBoundaryRegex(d),
  out: `${d.toLowerCase()} vocals`,
}));

const TECHNIQUE_REGEXES = VOCAL_TECHNIQUES.map((t) => ({
  re: phraseToWordBoundaryRegex(t),
  out: t.toLowerCase(),
}));

const SUPPLEMENTAL_REGEXES = SUPPLEMENTAL_VOCAL_DESCRIPTORS.map((d) => ({
  re: phraseToWordBoundaryRegex(d),
  out: `${d.toLowerCase()} vocals`,
}));

function extractDeliveryTags(vocalSentences: string[]): string[] {
  const matches: string[] = [];
  for (const { re, out } of DELIVERY_REGEXES) {
    if (vocalSentences.some((s) => re.test(s))) {
      matches.push(out);
    }
  }
  return matches;
}

function extractTechniqueTags(vocalSentences: string[], chorusOrHookSentences: string[]): string[] {
  const matches: string[] = [];
  for (const { re, out } of TECHNIQUE_REGEXES) {
    if (vocalSentences.some((s) => re.test(s)) || chorusOrHookSentences.some((s) => re.test(s))) {
      matches.push(out);
    }
  }
  return matches;
}

function extractSupplementalTags(vocalSentences: string[]): string[] {
  const matches: string[] = [];
  for (const { re, out } of SUPPLEMENTAL_REGEXES) {
    if (vocalSentences.some((s) => re.test(s))) {
      matches.push(out);
    }
  }
  return matches;
}

function selectTopVocalPerformanceTags(
  input: { deliveries: string[]; techniques: string[]; supplemental: string[] },
  maxTags = 3
): string[] {
  const selected: string[] = [];

  // Prefer a diverse set of tags over stacking many deliveries.
  if (input.deliveries[0]) selected.push(input.deliveries[0]);
  if (input.techniques[0]) selected.push(input.techniques[0]);
  if (input.supplemental[0]) selected.push(input.supplemental[0]);

  const fillFrom = (arr: string[]): void => {
    for (const t of arr) {
      if (selected.length >= maxTags) return;
      selected.push(t);
    }
  };

  if (selected.length < maxTags) fillFrom(input.deliveries.slice(1));
  if (selected.length < maxTags) fillFrom(input.techniques.slice(1));
  if (selected.length < maxTags) fillFrom(input.supplemental.slice(1));

  const seen = new Set<string>();
  return selected
    .filter((t) => {
      if (seen.has(t)) return false;
      seen.add(t);
      return true;
    })
    .slice(0, maxTags);
}

function isWordlessVocalsTag(item: string): boolean {
  return item.toLowerCase().includes('wordless vocals');
}

function isVocalRangeTag(item: string): boolean {
  if (!/\bvocals?\b/i.test(item)) return false;
  const rangeRe = new RegExp(`\\b${VOCAL_RANGE_PATTERN}\\b`, 'i');
  return rangeRe.test(item);
}

function isVocalPerformanceTag(item: string): boolean {
  return VOCAL_PERFORMANCE_TAG_SET.has(item.toLowerCase());
}

function capInstrumentsList(instrumentsCsv: string, maxItems: number): string {
  const items = splitCsvItems(instrumentsCsv);
  if (items.length <= maxItems) return items.join(', ');

  const rangeIndices = items
    .map((item, idx) => ({ item, idx }))
    .filter(({ item }) => isWordlessVocalsTag(item) || isVocalRangeTag(item))
    .map(({ idx }) => idx);

  const performanceIndices = items
    .map((item, idx) => ({ item, idx }))
    .filter(({ item }) => isVocalPerformanceTag(item) && !isVocalRangeTag(item) && !isWordlessVocalsTag(item))
    .map(({ idx }) => idx);

  const keep = new Set<number>();
  const addIndices = (indices: number[]): void => {
    for (const idx of indices) {
      if (keep.size >= maxItems) return;
      keep.add(idx);
    }
  };

  addIndices(rangeIndices);
  addIndices(performanceIndices);

  if (keep.size < maxItems) {
    for (let idx = 0; idx < items.length; idx++) {
      if (keep.size >= maxItems) break;
      if (keep.has(idx)) continue;
      keep.add(idx);
    }
  }

  return items.filter((_, idx) => keep.has(idx)).join(', ');
}

export function extractVocalPerformanceTags(sourceText: string): string[] {
  if (!sourceText.trim()) return [];
  if (hasNegativeVocals(sourceText)) return [];
  if (!hasAnyVocalContext(sourceText)) return [];

  const { vocalSentences, chorusOrHookSentences } = getVocalContextSentences(sourceText);

  const deliveries = extractDeliveryTags(vocalSentences);
  const techniques = extractTechniqueTags(vocalSentences, chorusOrHookSentences);
  const supplemental = extractSupplementalTags(vocalSentences);

  return selectTopVocalPerformanceTags({ deliveries, techniques, supplemental });
}

export function applyVocalPerformanceTagsToInstruments(instruments: string, sourceText: string): string {
  const perfTags = extractVocalPerformanceTags(sourceText);
  if (perfTags.length === 0) return instruments;

  const items = splitCsvItems(instruments);

  const lowerItems = items.map((i) => i.toLowerCase());
  const result = [...items];

  for (const tag of perfTags) {
    const lowerTag = tag.toLowerCase();
    if (lowerItems.includes(lowerTag)) continue;

    if (lowerTag.endsWith(' vocals')) {
      const descriptor = lowerTag.replace(/\s+vocals$/, '');
      const hasSimilar = lowerItems.some((i) => i.includes('vocals') && i.includes(descriptor));
      if (hasSimilar) continue;
    }

    result.push(tag);
    lowerItems.push(lowerTag);
  }

  return result.join(', ');
}

export function extractVocalTag(sourceText: string): string | null {
  if (!sourceText.trim()) return null;
  if (hasNegativeVocals(sourceText)) return null;

  const lower = sourceText.toLowerCase();

  if (lower.includes('wordless vocals')) {
    return 'wordless vocals';
  }

  const adjectiveAndRange = new RegExp(`\\b${VOCAL_ADJECTIVE_PATTERN}\\s+${VOCAL_RANGE_PATTERN}\\s+vocals?\\b`, 'i');
  const adjectiveMatch = sourceText.match(adjectiveAndRange);
  if (adjectiveMatch?.[0]) {
    return adjectiveMatch[0].trim().toLowerCase();
  }

  const range = new RegExp(`\\b${VOCAL_RANGE_PATTERN}\\s+vocals?\\b`, 'i');
  const rangeMatch = sourceText.match(range);
  if (rangeMatch?.[0]) {
    return rangeMatch[0].trim().toLowerCase();
  }

  if (/(?:\bvocals?\b|\bsinger\b|\bsinging\b|\bvoice\b|\bchoir\b)/i.test(sourceText)) {
    return 'vocals';
  }

  return null;
}

export function applyVocalTagToInstruments(instruments: string, sourceText: string): string {
  const vocalTag = extractVocalTag(sourceText);
  if (!vocalTag) return instruments;

  const items = splitCsvItems(instruments);

  const hasAnyVocalItem = items.some((i) => /\b(vocals?|singer|singing|voice|choir)\b/i.test(i));
  const hasRangeTag = items.some((i) => isWordlessVocalsTag(i) || isVocalRangeTag(i));

  const isGenericVocalItem = (item: string): boolean => {
    const lower = item.toLowerCase();
    return lower === 'vocals' || lower === 'voice' || lower === 'vocal';
  };

  let withRange = instruments;

  if (!hasAnyVocalItem) {
    withRange = items.length > 0 ? `${items.join(', ')}, ${vocalTag}` : vocalTag;
  } else if (vocalTag !== 'vocals' && !hasRangeTag) {
    const replaced = items.map((i) => (isGenericVocalItem(i) ? vocalTag : i));
    withRange = items.some(isGenericVocalItem) ? replaced.join(', ') : `${items.join(', ')}, ${vocalTag}`;
  }

  const withPerformanceTags = applyVocalPerformanceTagsToInstruments(withRange, sourceText);
  return capInstrumentsList(withPerformanceTags, MAX_INSTRUMENT_ITEMS);
}

// ============================================================================
// Genre Resolution
// ============================================================================

export interface ResolvedGenre {
  forOutput: string;   // Display string for the output
  forLookup: string;   // Key for BPM/instrument lookups
}

/**
 * Resolve effective genre from priority sources:
 * 1. sunoStyles (if provided) - inject directly as-is
 * 2. seedGenres (if provided) - format using display names
 * 3. detected (fallback) - use as-is
 */
export function resolveGenre(
  detected: string | null,
  seedGenres?: string[],
  sunoStyles?: string[]
): ResolvedGenre {
  if (sunoStyles?.length) {
    // Suno V5 styles: inject EXACTLY as-is (comma-separated if multiple)
    return {
      forOutput: sunoStyles.join(', '),
      forLookup: sunoStyles[0]?.split(' ')[0] || DEFAULT_GENRE,
    };
  }
  
  if (seedGenres?.length) {
    // Seed genres: format using display names
    return {
      forOutput: formatGenreLabels(seedGenres),
      forLookup: seedGenres[0] || DEFAULT_GENRE,
    };
  }
  
  // Detected from text (fallback)
  return {
    forOutput: detected || DEFAULT_GENRE,
    forLookup: detected || DEFAULT_GENRE,
  };
}
