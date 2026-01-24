/**
 * Keyword Matching Functions - Efficient keyword extraction with caching
 *
 * Provides lazy-compiled regex patterns and result caching for
 * high-performance keyword extraction from text descriptions.
 *
 * Uses pure functions with module-level closure for caching state.
 *
 * @module keywords/matcher
 */

import type { KeywordMapping, KeywordRegistry, MatchOptions } from '@bun/keywords/types';

// =============================================================================
// Module-Level State (Closure-based caching)
// =============================================================================

/** Compiled regex patterns keyed by keyword */
const patterns = new Map<string, RegExp>();

/** Cache of extraction results: text -> (cacheKey -> result) */
const cache = new Map<string, Map<string, unknown>>();

/** Maximum cache size before eviction */
const MAX_CACHE_SIZE = 200;

// =============================================================================
// Internal Helpers
// =============================================================================

/**
 * Escape special regex characters in a string.
 */
function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Get or create a compiled regex pattern for a keyword.
 * Patterns are lazily compiled and cached for reuse.
 */
function getPattern(keyword: string): RegExp {
  let pattern = patterns.get(keyword);
  if (!pattern) {
    const escaped = escapeRegex(keyword);
    pattern = new RegExp(`\\b${escaped}\\b`, 'i');
    patterns.set(keyword, pattern);
  }
  return pattern;
}

/**
 * Get cached result for a specific category, or undefined if not cached.
 */
function getCached(text: string, cacheKey: string, useCache: boolean): unknown {
  if (!useCache) return undefined;
  return cache.get(text)?.get(cacheKey);
}

/**
 * Store a result in the cache.
 */
function setCached(text: string, cacheKey: string, result: unknown, useCache: boolean): void {
  if (!useCache) return;

  // Evict oldest entries if cache is full
  if (cache.size >= MAX_CACHE_SIZE) {
    const keysToDelete = Array.from(cache.keys()).slice(0, Math.floor(MAX_CACHE_SIZE / 2));
    for (const key of keysToDelete) {
      cache.delete(key);
    }
  }

  const textCache = cache.get(text);
  if (textCache) {
    textCache.set(cacheKey, result);
  } else {
    cache.set(text, new Map([[cacheKey, result]]));
  }
}

/**
 * Build a unique cache key for keyword arrays.
 * Includes first 3 keywords to avoid collisions for same-length arrays.
 */
function buildKeywordsCacheKey(keywords: readonly string[], limit: number | undefined): string {
  const sample = keywords.slice(0, 3).join(',');
  return `keywords:${sample}:${keywords.length}:${limit ?? 'all'}`;
}

/**
 * Build a unique cache key for registries/mappings.
 * Includes first 3 keys to avoid collisions.
 */
function buildRegistryCacheKey(prefix: string, keys: string[]): string {
  const sample = keys.slice(0, 3).join(',');
  return `${prefix}:${sample}:${keys.length}`;
}

// =============================================================================
// Public API
// =============================================================================

/**
 * Check if a keyword exists in the text as a whole word.
 *
 * @param text - Text to search in
 * @param keyword - Keyword to match (case-insensitive, whole word)
 * @returns True if keyword found as whole word
 *
 * @example
 * ```typescript
 * matches('I love jazz music', 'jazz'); // true
 * matches('jazzman plays', 'jazz');     // false (partial word)
 * matches('JAZZ is great', 'jazz');     // true (case-insensitive)
 * ```
 */
export function matches(text: string, keyword: string): boolean {
  return getPattern(keyword).test(text);
}

/**
 * Match text against a list of keywords, returning all matches.
 *
 * @param text - Text to search in
 * @param keywords - Array of keywords to match
 * @param options - Optional limit and cache settings
 * @returns Array of matched keywords (in order of keywords array)
 *
 * @example
 * ```typescript
 * const genres = ['jazz', 'blues', 'rock'];
 * matchKeywords('jazz and blues fusion', genres);
 * // Returns: ['jazz', 'blues']
 *
 * matchKeywords('jazz blues rock', genres, { limit: 2 });
 * // Returns: ['jazz', 'blues']
 * ```
 */
export function matchKeywords(
  text: string,
  keywords: readonly string[],
  options: MatchOptions = {}
): string[] {
  const { limit, useCache = true } = options;
  const cacheKey = buildKeywordsCacheKey(keywords, limit);
  const cached = getCached(text, cacheKey, useCache) as string[] | undefined;
  if (cached) return cached;

  const result: string[] = [];
  for (const keyword of keywords) {
    if (matches(text, keyword)) {
      result.push(keyword);
      if (limit !== undefined && result.length >= limit) break;
    }
  }

  setCached(text, cacheKey, result, useCache);
  return result;
}

/**
 * Match text against a keyword registry, returning the first matched value.
 *
 * @param text - Text to search in
 * @param registry - Mapping of keywords to values
 * @param options - Optional cache settings
 * @returns The value for the first matched keyword, or undefined
 *
 * @example
 * ```typescript
 * const eras = { vintage: '70s', retro: '80s', modern: 'modern' };
 * matchRegistry('vintage soul music', eras);
 * // Returns: '70s'
 * ```
 */
export function matchRegistry<T>(
  text: string,
  registry: KeywordRegistry<T>,
  options: Pick<MatchOptions, 'useCache'> = {}
): T | undefined {
  const { useCache = true } = options;
  const keys = Object.keys(registry);
  const cacheKey = buildRegistryCacheKey('registry', keys);
  const cached = getCached(text, cacheKey, useCache) as T | undefined;
  if (cached !== undefined) return cached;

  for (const [keyword, value] of Object.entries(registry)) {
    if (matches(text, keyword)) {
      setCached(text, cacheKey, value, useCache);
      return value;
    }
  }

  setCached(text, cacheKey, undefined, useCache);
  return undefined;
}

/**
 * Match text against a keyword mapping, returning all mapped output words.
 *
 * @param text - Text to search in
 * @param mapping - Mapping of keywords to output word arrays
 * @param options - Optional cache settings
 * @returns Array of all matched output words (deduplicated)
 *
 * @example
 * ```typescript
 * const themes = {
 *   love: ['Heart', 'Dream'],
 *   night: ['Midnight', 'Moon'],
 * };
 * matchMapping('love at midnight', themes);
 * // Returns: ['Heart', 'Dream', 'Midnight', 'Moon']
 * ```
 */
export function matchMapping(
  text: string,
  mapping: KeywordMapping,
  options: Pick<MatchOptions, 'useCache'> = {}
): string[] {
  const { useCache = true } = options;
  const keys = Object.keys(mapping);
  const cacheKey = buildRegistryCacheKey('mapping', keys);
  const cached = getCached(text, cacheKey, useCache) as string[] | undefined;
  if (cached) return cached;

  const results: string[] = [];
  for (const [keyword, words] of Object.entries(mapping)) {
    if (matches(text, keyword)) {
      results.push(...words);
    }
  }

  const deduplicated = [...new Set(results)];
  setCached(text, cacheKey, deduplicated, useCache);
  return deduplicated;
}

/**
 * Clear all cached results.
 * Useful for testing or when keyword data changes.
 */
export function clearCache(): void {
  cache.clear();
}

/**
 * Get cache statistics for debugging.
 *
 * @returns Object with cache size and pattern count
 */
export function getCacheStats(): { size: number; patternCount: number } {
  return {
    size: cache.size,
    patternCount: patterns.size,
  };
}
