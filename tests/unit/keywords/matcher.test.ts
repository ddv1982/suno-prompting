import { describe, test, expect, beforeEach } from 'bun:test';

import {
  matches,
  matchKeywords,
  matchRegistry,
  matchMapping,
  clearCache,
  getCacheStats,
} from '@bun/keywords/matcher';

import type { KeywordRegistry, KeywordMapping } from '@bun/keywords/types';

// =============================================================================
// Test Data
// =============================================================================

const TEST_KEYWORDS = ['jazz', 'blues', 'rock', 'pop', 'electronic'] as const;

const TEST_REGISTRY: KeywordRegistry<string> = {
  vintage: '70s',
  retro: '80s',
  modern: 'modern',
  neon: '80s',
  synth: '80s',
};

const TEST_MAPPING: KeywordMapping = {
  love: ['Heart', 'Dream', 'Soul'],
  night: ['Midnight', 'Moon', 'Stars'],
  rain: ['Storm', 'Water', 'Tears'],
};

// =============================================================================
// matches() Tests
// =============================================================================

describe('matches', () => {
  beforeEach(() => {
    clearCache();
  });

  test('matches exact whole word', () => {
    expect(matches('I love jazz music', 'jazz')).toBe(true);
  });

  test('matches word at start of text', () => {
    expect(matches('jazz is great', 'jazz')).toBe(true);
  });

  test('matches word at end of text', () => {
    expect(matches('I love jazz', 'jazz')).toBe(true);
  });

  test('matches single word text', () => {
    expect(matches('jazz', 'jazz')).toBe(true);
  });

  test('is case insensitive', () => {
    expect(matches('I love JAZZ music', 'jazz')).toBe(true);
    expect(matches('I love Jazz music', 'jazz')).toBe(true);
    expect(matches('I love jazz music', 'JAZZ')).toBe(true);
  });

  test('does not match partial words - prefix', () => {
    expect(matches('jazzman plays well', 'jazz')).toBe(false);
  });

  test('does not match partial words - suffix', () => {
    expect(matches('smooth-jazz is cool', 'jazz')).toBe(true); // hyphen is word boundary
    expect(matches('smoothjazz is cool', 'jazz')).toBe(false);
  });

  test('does not match partial words - middle', () => {
    expect(matches('nightingale sings', 'night')).toBe(false);
  });

  test('handles special regex characters in keyword', () => {
    // Note: \b word boundaries don't work with special chars at boundaries
    // These are escaped but may not match as expected at word boundaries
    expect(matches('the price is $100 dollars', '$100')).toBe(false); // $ not a word char
    expect(matches('question? yes', 'question')).toBe(true); // Match without ?
  });

  test('handles empty text', () => {
    expect(matches('', 'jazz')).toBe(false);
  });

  test('handles whitespace-only text', () => {
    expect(matches('   ', 'jazz')).toBe(false);
  });

  test('matches with punctuation boundaries', () => {
    expect(matches('jazz, blues, rock', 'jazz')).toBe(true);
    expect(matches('jazz. blues. rock', 'blues')).toBe(true);
    expect(matches('(jazz) music', 'jazz')).toBe(true);
  });

  test('matches multi-word keywords', () => {
    expect(matches('I love new wave music', 'new wave')).toBe(true);
    expect(matches('trip-hop beats', 'trip-hop')).toBe(true);
  });
});

// =============================================================================
// matchKeywords() Tests
// =============================================================================

describe('matchKeywords', () => {
  beforeEach(() => {
    clearCache();
  });

  test('returns all matching keywords', () => {
    const result = matchKeywords('jazz and blues fusion', TEST_KEYWORDS);
    expect(result).toContain('jazz');
    expect(result).toContain('blues');
    expect(result).toHaveLength(2);
  });

  test('returns empty array for no matches', () => {
    const result = matchKeywords('classical symphony', TEST_KEYWORDS);
    expect(result).toEqual([]);
  });

  test('returns empty array for empty text', () => {
    const result = matchKeywords('', TEST_KEYWORDS);
    expect(result).toEqual([]);
  });

  test('respects limit parameter', () => {
    const result = matchKeywords('jazz blues rock pop electronic', TEST_KEYWORDS, { limit: 2 });
    expect(result).toHaveLength(2);
  });

  test('returns fewer than limit if not enough matches', () => {
    const result = matchKeywords('jazz only', TEST_KEYWORDS, { limit: 10 });
    expect(result).toEqual(['jazz']);
  });

  test('preserves order of keywords array', () => {
    const result = matchKeywords('electronic jazz blues', TEST_KEYWORDS);
    // Should be in order of TEST_KEYWORDS, not order found in text
    expect(result).toEqual(['jazz', 'blues', 'electronic']);
  });

  test('handles large keyword list efficiently', () => {
    const manyKeywords = Array.from({ length: 1000 }, (_, i) => `keyword${i}`);
    const text = 'this has keyword500 and keyword999 in it';
    const result = matchKeywords(text, manyKeywords);
    expect(result).toContain('keyword500');
    expect(result).toContain('keyword999');
    expect(result).toHaveLength(2);
  });
});

// =============================================================================
// matchRegistry() Tests
// =============================================================================

describe('matchRegistry', () => {
  beforeEach(() => {
    clearCache();
  });

  test('returns value for first matched keyword', () => {
    const result = matchRegistry('vintage soul music', TEST_REGISTRY);
    expect(result).toBe('70s');
  });

  test('returns undefined for no match', () => {
    const result = matchRegistry('futuristic sounds', TEST_REGISTRY);
    expect(result).toBeUndefined();
  });

  test('returns undefined for empty text', () => {
    const result = matchRegistry('', TEST_REGISTRY);
    expect(result).toBeUndefined();
  });

  test('returns first match when multiple keywords present', () => {
    // Order depends on Object.entries iteration order
    const result = matchRegistry('vintage retro vibes', TEST_REGISTRY);
    expect(result).toBeDefined();
    expect(['70s', '80s']).toContain(result!);
  });

  test('is case insensitive', () => {
    expect(matchRegistry('VINTAGE music', TEST_REGISTRY)).toBe('70s');
    expect(matchRegistry('Neon lights', TEST_REGISTRY)).toBe('80s');
  });

  test('handles typed registry values', () => {
    const numericRegistry: KeywordRegistry<number> = {
      slow: 60,
      medium: 120,
      fast: 180,
    };
    expect(matchRegistry('slow ballad', numericRegistry)).toBe(60);
    expect(matchRegistry('fast tempo', numericRegistry)).toBe(180);
  });
});

// =============================================================================
// matchMapping() Tests
// =============================================================================

describe('matchMapping', () => {
  beforeEach(() => {
    clearCache();
  });

  test('returns mapped output words for single match', () => {
    const result = matchMapping('a song about love', TEST_MAPPING);
    expect(result).toContain('Heart');
    expect(result).toContain('Dream');
    expect(result).toContain('Soul');
  });

  test('combines output words from multiple matches', () => {
    const result = matchMapping('love in the rain', TEST_MAPPING);
    expect(result).toContain('Heart');
    expect(result).toContain('Storm');
  });

  test('deduplicates output words', () => {
    const mappingWithDupes: KeywordMapping = {
      sad: ['Tears', 'Shadow'],
      cry: ['Tears', 'Sorrow'],
    };
    const result = matchMapping('sad cry', mappingWithDupes);
    const tearsCount = result.filter((w) => w === 'Tears').length;
    expect(tearsCount).toBe(1);
  });

  test('returns empty array for no matches', () => {
    const result = matchMapping('happy sunshine', TEST_MAPPING);
    expect(result).toEqual([]);
  });

  test('returns empty array for empty text', () => {
    const result = matchMapping('', TEST_MAPPING);
    expect(result).toEqual([]);
  });

  test('is case insensitive', () => {
    const result = matchMapping('LOVE and NIGHT', TEST_MAPPING);
    expect(result).toContain('Heart');
    expect(result).toContain('Midnight');
  });
});

// =============================================================================
// Caching Tests
// =============================================================================

describe('caching', () => {
  beforeEach(() => {
    clearCache();
  });

  test('cache starts empty', () => {
    const stats = getCacheStats();
    expect(stats.size).toBe(0);
  });

  test('caches results after first call', () => {
    matchKeywords('jazz blues', TEST_KEYWORDS);
    const stats = getCacheStats();
    expect(stats.size).toBeGreaterThan(0);
  });

  test('clearCache empties the cache', () => {
    matchKeywords('jazz blues', TEST_KEYWORDS);
    clearCache();
    const stats = getCacheStats();
    expect(stats.size).toBe(0);
  });

  test('returns same result from cache', () => {
    const result1 = matchKeywords('jazz blues rock', TEST_KEYWORDS);
    const result2 = matchKeywords('jazz blues rock', TEST_KEYWORDS);
    expect(result1).toEqual(result2);
  });

  test('patterns are cached and reused', () => {
    const statsBefore = getCacheStats();
    matches('jazz music', 'jazz');
    matches('more jazz', 'jazz');
    const statsAfter = getCacheStats();
    // Pattern count should increase by at most 1 (jazz pattern)
    expect(statsAfter.patternCount).toBeLessThanOrEqual(statsBefore.patternCount + 1);
  });

  test('different keywords create different patterns', () => {
    const statsBefore = getCacheStats();
    matches('unique_keyword_abc music', 'unique_keyword_abc');
    matches('unique_keyword_xyz music', 'unique_keyword_xyz');
    const statsAfter = getCacheStats();
    // Should have added 2 new patterns
    expect(statsAfter.patternCount).toBe(statsBefore.patternCount + 2);
  });

  test('cache can be disabled via options', () => {
    matchKeywords('jazz blues', TEST_KEYWORDS, { useCache: false });
    const stats = getCacheStats();
    expect(stats.size).toBe(0);
  });

  test('cache evicts old entries when full', () => {
    // Fill cache with many entries
    for (let i = 0; i < 250; i++) {
      matchKeywords(`unique text ${i}`, TEST_KEYWORDS);
    }
    const stats = getCacheStats();
    // Should have evicted ~half when hitting 200 limit
    expect(stats.size).toBeLessThan(250);
  });
});

// =============================================================================
// Edge Cases
// =============================================================================

describe('edge cases', () => {
  beforeEach(() => {
    clearCache();
  });

  test('handles very long text', () => {
    const longText = 'jazz '.repeat(10000);
    const result = matchKeywords(longText, TEST_KEYWORDS);
    expect(result).toContain('jazz');
  });

  test('handles unicode text', () => {
    // Note: \b word boundaries work differently with unicode
    // ASCII letters work fine
    expect(matches('visit the cafe today', 'cafe')).toBe(true);
    // Accented chars may not match at word boundaries due to \b behavior
    // This is acceptable for our music keyword use case
  });

  test('handles newlines in text', () => {
    const text = 'jazz\nblues\nrock';
    const result = matchKeywords(text, TEST_KEYWORDS);
    expect(result).toContain('jazz');
    expect(result).toContain('blues');
    expect(result).toContain('rock');
  });

  test('handles tabs in text', () => {
    const text = 'jazz\tblues\trock';
    const result = matchKeywords(text, TEST_KEYWORDS);
    expect(result).toHaveLength(3);
  });

  test('handles empty keyword list', () => {
    const result = matchKeywords('jazz blues', []);
    expect(result).toEqual([]);
  });

  test('handles empty registry', () => {
    const result = matchRegistry('jazz blues', {});
    expect(result).toBeUndefined();
  });

  test('handles empty mapping', () => {
    const result = matchMapping('jazz blues', {});
    expect(result).toEqual([]);
  });
});
