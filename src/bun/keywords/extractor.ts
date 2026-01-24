/**
 * Unified Keyword Extraction
 *
 * Provides a single-pass extraction of all keyword categories from text.
 * Uses pure matching functions for efficient cached matching.
 *
 * @module keywords/extractor
 */

import { matchKeywords, matchRegistry, matchMapping } from '@bun/keywords/matcher';
import {
  MOOD_KEYWORDS,
  ERA_KEYWORDS,
  TEMPO_SLOWER_KEYWORDS,
  TEMPO_FASTER_KEYWORDS,
  TEMPO_SLOW,
  TEMPO_FAST,
  INTENT_KEYWORDS,
  TIME_KEYWORDS,
  NATURE_KEYWORDS,
  EMOTION_KEYWORDS,
  ACTION_KEYWORDS,
  ABSTRACT_KEYWORDS,
  HARMONIC_COMPLEXITY_KEYWORDS,
} from '@bun/keywords/registries';

import type { KeywordExtractionResult, Intent } from '@bun/keywords/types';
import type { Era, Tempo } from '@shared/schemas/thematic-context';

/**
 * Extract all keyword categories from a description in a single pass.
 *
 * This is the main entry point for keyword extraction. It extracts:
 * - Moods (from MOOD_POOL + MOOD_TO_GENRE keys)
 * - Themes (from emotion/nature/abstract mappings)
 * - Era (production era from keywords)
 * - Tempo (BPM adjustment from energy keywords)
 * - Intent (listening purpose from keywords)
 * - Time, nature, emotion, action, abstract keywords
 *
 * Results are cached per description for efficiency.
 *
 * @param description - User's song description
 * @returns Complete extraction result with all categories
 *
 * @example
 * ```typescript
 * const result = extractAllKeywords('a slow vintage jazz ballad about lost love');
 * // {
 * //   moods: [],
 * //   themes: ['lost', 'shadow', 'memory', 'love', 'heart', 'dream'],
 * //   era: '70s',
 * //   tempo: { adjustment: -15, curve: 'steady' },
 * //   intent: undefined,
 * //   time: [],
 * //   nature: [],
 * //   emotion: ['Lost', 'Shadow', 'Memory', 'Love', 'Heart', 'Dream'],
 * //   action: [],
 * //   abstract: []
 * // }
 * ```
 */
export function extractAllKeywords(description: string): KeywordExtractionResult {
  if (!description?.trim()) {
    return {
      moods: [],
      themes: [],
      era: undefined,
      tempo: undefined,
      intent: undefined,
      time: [],
      nature: [],
      emotion: [],
      action: [],
      abstract: [],
    };
  }

  const text = description.trim();

  // Extract moods (all matches, no limit)
  const moods = matchKeywords(text, MOOD_KEYWORDS);

  // Extract era (first match)
  const era = matchRegistry<Era>(text, ERA_KEYWORDS);

  // Extract tempo (check slower first, then faster)
  let tempo: Tempo | undefined;
  if (matchKeywords(text, TEMPO_SLOWER_KEYWORDS, { limit: 1 }).length > 0) {
    tempo = TEMPO_SLOW;
  } else if (matchKeywords(text, TEMPO_FASTER_KEYWORDS, { limit: 1 }).length > 0) {
    tempo = TEMPO_FAST;
  }

  // Extract intent (first match)
  const intent = matchRegistry<Intent>(text, INTENT_KEYWORDS);

  // Extract theme categories (for title generation)
  const time = matchMapping(text, TIME_KEYWORDS);
  const nature = matchMapping(text, NATURE_KEYWORDS);
  const emotion = matchMapping(text, EMOTION_KEYWORDS);
  const action = matchMapping(text, ACTION_KEYWORDS);
  const abstract = matchMapping(text, ABSTRACT_KEYWORDS);

  // Build themes from all mappings (prioritized)
  const allThemes = [...emotion, ...nature, ...abstract, ...time, ...action];
  const themes = [...new Set(allThemes)].map((t) => t.toLowerCase());

  return {
    moods,
    themes,
    era,
    tempo,
    intent,
    time,
    nature,
    emotion,
    action,
    abstract,
  };
}

/**
 * Extract only moods from a description.
 * Convenience function for mood-specific extraction.
 *
 * @param description - User's song description
 * @param limit - Maximum number of moods to return
 * @returns Array of matched mood keywords
 */
export function extractMoods(description: string, limit?: number): string[] {
  if (!description?.trim()) return [];
  return matchKeywords(description.trim(), MOOD_KEYWORDS, { limit });
}

/**
 * Extract only themes from a description.
 * Returns lowercase theme words suitable for ThematicContext.
 *
 * @param description - User's song description
 * @param limit - Maximum number of themes to return
 * @returns Array of theme strings (lowercase)
 */
export function extractThemes(description: string, limit?: number): string[] {
  if (!description?.trim()) return [];

  const text = description.trim();

  // Prioritize emotion > nature > abstract > time > action
  const emotion = matchMapping(text, EMOTION_KEYWORDS);
  const nature = matchMapping(text, NATURE_KEYWORDS);
  const abstract = matchMapping(text, ABSTRACT_KEYWORDS);
  const time = matchMapping(text, TIME_KEYWORDS);
  const action = matchMapping(text, ACTION_KEYWORDS);

  const allThemes = [...emotion, ...nature, ...abstract, ...time, ...action];
  const unique = [...new Set(allThemes)].map((t) => t.toLowerCase());

  return limit !== undefined ? unique.slice(0, limit) : unique;
}

/**
 * Extract era, tempo, and intent from a description.
 * Returns only the "enrichment" fields for ThematicContext fallback.
 *
 * @param description - User's song description
 * @returns Object with era, tempo, and intent (all optional)
 */
export function extractEnrichment(description: string): {
  era?: Era;
  tempo?: Tempo;
  intent?: Intent;
} {
  if (!description?.trim()) return {};

  const text = description.trim();

  const era = matchRegistry<Era>(text, ERA_KEYWORDS);

  let tempo: Tempo | undefined;
  if (matchKeywords(text, TEMPO_SLOWER_KEYWORDS, { limit: 1 }).length > 0) {
    tempo = TEMPO_SLOW;
  } else if (matchKeywords(text, TEMPO_FASTER_KEYWORDS, { limit: 1 }).length > 0) {
    tempo = TEMPO_FAST;
  }

  const intent = matchRegistry<Intent>(text, INTENT_KEYWORDS);

  const result: { era?: Era; tempo?: Tempo; intent?: Intent } = {};
  if (era !== undefined) result.era = era;
  if (tempo !== undefined) result.tempo = tempo;
  if (intent !== undefined) result.intent = intent;
  return result;
}

/**
 * Check if a description has any extractable keywords.
 * Useful for deciding whether to use fallback extraction.
 *
 * @param description - User's song description
 * @returns True if any keywords were found
 */
export function hasKeywords(description: string): boolean {
  if (!description?.trim()) return false;

  const result = extractAllKeywords(description);
  return (
    result.moods.length > 0 ||
    result.themes.length > 0 ||
    result.era !== undefined ||
    result.tempo !== undefined ||
    result.intent !== undefined
  );
}

/**
 * Extract keywords for title generation.
 * Returns a map of category -> preferred words based on description content.
 *
 * This is a convenience function that wraps extractAllKeywords and returns
 * the format expected by the title generator (category names to word arrays).
 *
 * @param description - User's song description
 * @returns Object with category keys (time, nature, emotion, action, abstract)
 *          mapping to arrays of deduplicated title words. Empty categories are omitted.
 *
 * @example
 * ```typescript
 * extractKeywordsForTitle('A song about midnight rain and lost love')
 * // {
 * //   time: ['Midnight', 'Night'],
 * //   nature: ['Rain', 'Storm'],
 * //   emotion: ['Lost', 'Shadow', 'Love', 'Heart']
 * // }
 * ```
 */
export function extractKeywordsForTitle(description?: string): Record<string, string[]> {
  if (!description?.trim()) return {};

  const result = extractAllKeywords(description);

  const keywords: Record<string, string[]> = {};

  if (result.time.length > 0) {
    keywords.time = [...new Set(result.time)];
  }
  if (result.nature.length > 0) {
    keywords.nature = [...new Set(result.nature)];
  }
  if (result.emotion.length > 0) {
    keywords.emotion = [...new Set(result.emotion)];
  }
  if (result.action.length > 0) {
    keywords.action = [...new Set(result.action)];
  }
  if (result.abstract.length > 0) {
    keywords.abstract = [...new Set(result.abstract)];
  }

  return keywords;
}

// =============================================================================
// Harmonic Complexity Extraction
// =============================================================================

/** Multiplier when no complexity indicators found */
const HARMONIC_MULTIPLIER_DEFAULT = 1.0;

/** Multiplier for 1 complexity indicator match */
const HARMONIC_MULTIPLIER_MODERATE = 1.4;

/** Multiplier for 2+ complexity indicator matches */
const HARMONIC_MULTIPLIER_STRONG = 1.8;

/**
 * Calculate harmonic weight multiplier based on complexity indicators in description.
 *
 * Scans the user's description for keywords indicating harmonic complexity
 * (jazz, progressive, modal, chromatic, etc.) and returns a weight multiplier
 * to boost harmonic tag selection probability.
 *
 * @param description - The user's music description
 * @returns Weight multiplier: 1.0 (none), 1.4 (moderate), 1.8 (strong)
 *
 * @example
 * ```typescript
 * extractHarmonicComplexity('a jazz progressive fusion track')
 * // Returns 1.8 (2+ matches: "jazz", "progressive")
 *
 * extractHarmonicComplexity('a chromatic exploration')
 * // Returns 1.4 (1 match: "chromatic")
 *
 * extractHarmonicComplexity('a simple pop song')
 * // Returns 1.0 (no matches)
 * ```
 */
export function extractHarmonicComplexity(description: string): number {
  if (!description?.trim()) return HARMONIC_MULTIPLIER_DEFAULT;

  const matches = matchKeywords(description.trim(), HARMONIC_COMPLEXITY_KEYWORDS);

  if (matches.length >= 2) return HARMONIC_MULTIPLIER_STRONG;
  if (matches.length >= 1) return HARMONIC_MULTIPLIER_MODERATE;
  return HARMONIC_MULTIPLIER_DEFAULT;
}

// =============================================================================
// Priority Mood Extraction
// =============================================================================

/**
 * Extract moods from description that should be prioritized in style tag selection.
 *
 * Returns moods found in the user's description that exist in MOOD_KEYWORDS.
 * These moods represent the user's explicit mood intent and should take
 * precedence over genre-based mood selection.
 *
 * @param description - User's song description
 * @param limit - Maximum number of moods to return (default: unlimited)
 * @returns Array of matched mood keywords from the description
 *
 * @example
 * ```typescript
 * extractPriorityMoods('a melancholic and brooding jazz piece')
 * // Returns ['melancholic', 'brooding']
 *
 * extractPriorityMoods('upbeat dance track', 1)
 * // Returns ['upbeat']
 *
 * extractPriorityMoods('instrumental piece')
 * // Returns [] (no mood keywords)
 * ```
 */
export function extractPriorityMoods(description: string, limit?: number): string[] {
  if (!description?.trim()) return [];
  return matchKeywords(description.trim(), MOOD_KEYWORDS, { limit });
}
