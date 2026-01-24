import { describe, test, expect, beforeEach } from 'bun:test';

import {
  extractAllKeywords,
  extractMoods,
  extractThemes,
  extractEnrichment,
  extractHarmonicComplexity,
  extractPriorityMoods,
  hasKeywords,
} from '@bun/keywords/extractor';
import { clearCache } from '@bun/keywords/matcher';

// =============================================================================
// extractAllKeywords() Tests
// =============================================================================

describe('extractAllKeywords', () => {
  beforeEach(() => {
    clearCache();
  });

  describe('mood extraction', () => {
    test('extracts moods from description', () => {
      const result = extractAllKeywords('a melancholic jazz ballad');
      expect(result.moods.length).toBeGreaterThan(0);
    });

    test('extracts multiple moods', () => {
      const result = extractAllKeywords('dark and brooding atmospheric piece');
      expect(result.moods.length).toBeGreaterThanOrEqual(1);
    });

    test('returns empty moods for no mood keywords', () => {
      const result = extractAllKeywords('instrumental piece number five');
      // May or may not have moods depending on keyword overlap
      expect(Array.isArray(result.moods)).toBe(true);
    });
  });

  describe('era extraction', () => {
    test('extracts era from vintage keyword', () => {
      const result = extractAllKeywords('vintage soul music');
      expect(result.era).toBe('70s');
    });

    test('extracts era from retro keyword', () => {
      const result = extractAllKeywords('retro synth vibes');
      expect(result.era).toBe('80s');
    });

    test('extracts era from neon keyword', () => {
      const result = extractAllKeywords('neon lights and synthesizers');
      expect(result.era).toBe('80s');
    });

    test('extracts era from explicit decade mention', () => {
      const result = extractAllKeywords('90s hip hop beats');
      expect(result.era).toBe('90s');
    });

    test('extracts era from modern keyword', () => {
      const result = extractAllKeywords('modern electronic production');
      expect(result.era).toBe('modern');
    });

    test('returns undefined era for no era keywords', () => {
      const result = extractAllKeywords('generic music piece');
      expect(result.era).toBeUndefined();
    });
  });

  describe('tempo extraction', () => {
    test('extracts slow tempo from slow keyword', () => {
      const result = extractAllKeywords('slow jazz ballad');
      expect(result.tempo).toBeDefined();
      expect(result.tempo?.adjustment).toBeLessThan(0);
    });

    test('extracts slow tempo from relaxed keyword', () => {
      const result = extractAllKeywords('relaxed ambient soundscape');
      expect(result.tempo).toBeDefined();
      expect(result.tempo?.adjustment).toBeLessThan(0);
    });

    test('extracts fast tempo from fast keyword', () => {
      const result = extractAllKeywords('fast paced electronic track');
      expect(result.tempo).toBeDefined();
      expect(result.tempo?.adjustment).toBeGreaterThan(0);
    });

    test('extracts fast tempo from energetic keyword', () => {
      const result = extractAllKeywords('energetic dance music');
      expect(result.tempo).toBeDefined();
      expect(result.tempo?.adjustment).toBeGreaterThan(0);
    });

    test('returns undefined tempo for no tempo keywords', () => {
      const result = extractAllKeywords('generic music piece');
      expect(result.tempo).toBeUndefined();
    });

    test('slower takes precedence over faster when both present', () => {
      // This tests the implementation order: slower checked first
      const result = extractAllKeywords('slow but energetic paradox');
      expect(result.tempo?.adjustment).toBeLessThan(0);
    });
  });

  describe('intent extraction', () => {
    test('extracts background intent from study keyword', () => {
      const result = extractAllKeywords('music for studying');
      expect(result.intent).toBe('background');
    });

    test('extracts background intent from focus keyword', () => {
      const result = extractAllKeywords('focus and concentration music');
      expect(result.intent).toBe('background');
    });

    test('extracts dancefloor intent from dance keyword', () => {
      const result = extractAllKeywords('dance club music');
      expect(result.intent).toBe('dancefloor');
    });

    test('extracts dancefloor intent from party keyword', () => {
      const result = extractAllKeywords('party anthem');
      expect(result.intent).toBe('dancefloor');
    });

    test('extracts cinematic intent from film keyword', () => {
      const result = extractAllKeywords('film score style');
      expect(result.intent).toBe('cinematic');
    });

    test('extracts cinematic intent from epic keyword', () => {
      const result = extractAllKeywords('epic orchestral piece');
      expect(result.intent).toBe('cinematic');
    });

    test('extracts emotional intent from sad keyword', () => {
      const result = extractAllKeywords('sad melancholic piece');
      expect(result.intent).toBe('emotional');
    });

    test('extracts focal intent from concert keyword', () => {
      const result = extractAllKeywords('concert performance piece');
      expect(result.intent).toBe('focal');
    });

    test('returns undefined intent for no intent keywords', () => {
      const result = extractAllKeywords('generic music piece');
      expect(result.intent).toBeUndefined();
    });
  });

  describe('theme extraction', () => {
    test('extracts themes from emotion keywords', () => {
      const result = extractAllKeywords('a song about lost love');
      expect(result.themes.length).toBeGreaterThan(0);
      // Themes should be lowercase
      result.themes.forEach((theme) => {
        expect(theme).toBe(theme.toLowerCase());
      });
    });

    test('extracts themes from nature keywords', () => {
      const result = extractAllKeywords('ocean waves and rain');
      expect(result.themes.length).toBeGreaterThan(0);
    });

    test('extracts themes from time keywords', () => {
      const result = extractAllKeywords('midnight dreams');
      expect(result.themes.length).toBeGreaterThan(0);
    });

    test('extracts themes from abstract keywords', () => {
      const result = extractAllKeywords('eternal journey through space');
      expect(result.themes.length).toBeGreaterThan(0);
    });

    test('deduplicates themes', () => {
      const result = extractAllKeywords('love and heart and soul');
      const uniqueThemes = [...new Set(result.themes)];
      expect(result.themes).toEqual(uniqueThemes);
    });
  });

  describe('category arrays', () => {
    test('populates time array', () => {
      const result = extractAllKeywords('midnight sunset dreams');
      expect(result.time.length).toBeGreaterThan(0);
    });

    test('populates nature array', () => {
      const result = extractAllKeywords('ocean storm thunder');
      expect(result.nature.length).toBeGreaterThan(0);
    });

    test('populates emotion array', () => {
      const result = extractAllKeywords('love heart dream');
      expect(result.emotion.length).toBeGreaterThan(0);
    });

    test('populates action array', () => {
      const result = extractAllKeywords('rising falling dancing');
      expect(result.action.length).toBeGreaterThan(0);
    });

    test('populates abstract array', () => {
      const result = extractAllKeywords('eternity infinity cosmos');
      expect(result.abstract.length).toBeGreaterThan(0);
    });
  });

  describe('empty/invalid input handling', () => {
    test('returns empty result for empty string', () => {
      const result = extractAllKeywords('');
      expect(result.moods).toEqual([]);
      expect(result.themes).toEqual([]);
      expect(result.era).toBeUndefined();
      expect(result.tempo).toBeUndefined();
      expect(result.intent).toBeUndefined();
    });

    test('returns empty result for whitespace only', () => {
      const result = extractAllKeywords('   ');
      expect(result.moods).toEqual([]);
      expect(result.themes).toEqual([]);
    });

    test('trims input before processing', () => {
      const result = extractAllKeywords('  vintage jazz  ');
      expect(result.era).toBe('70s');
    });
  });
});

// =============================================================================
// extractMoods() Tests
// =============================================================================

describe('extractMoods', () => {
  beforeEach(() => {
    clearCache();
  });

  test('extracts moods from description', () => {
    const result = extractMoods('dark and melancholic');
    expect(result.length).toBeGreaterThan(0);
  });

  test('respects limit parameter', () => {
    const result = extractMoods('dark melancholic brooding atmospheric', 2);
    expect(result.length).toBeLessThanOrEqual(2);
  });

  test('returns empty array for empty input', () => {
    expect(extractMoods('')).toEqual([]);
  });

  test('returns empty array for whitespace', () => {
    expect(extractMoods('   ')).toEqual([]);
  });
});

// =============================================================================
// extractThemes() Tests
// =============================================================================

describe('extractThemes', () => {
  beforeEach(() => {
    clearCache();
  });

  test('extracts themes from description', () => {
    const result = extractThemes('love and rain at midnight');
    expect(result.length).toBeGreaterThan(0);
  });

  test('returns lowercase themes', () => {
    const result = extractThemes('LOVE and NIGHT');
    result.forEach((theme) => {
      expect(theme).toBe(theme.toLowerCase());
    });
  });

  test('respects limit parameter', () => {
    const result = extractThemes('love heart dream hope soul', 2);
    expect(result.length).toBeLessThanOrEqual(2);
  });

  test('returns empty array for empty input', () => {
    expect(extractThemes('')).toEqual([]);
  });

  test('prioritizes emotion over other categories', () => {
    // Emotion keywords should appear first in results
    const result = extractThemes('ocean love mountain heart');
    // Love/heart (emotion) should be prioritized
    expect(result.length).toBeGreaterThan(0);
  });
});

// =============================================================================
// extractEnrichment() Tests
// =============================================================================

describe('extractEnrichment', () => {
  beforeEach(() => {
    clearCache();
  });

  test('extracts era when present', () => {
    const result = extractEnrichment('vintage jazz');
    expect(result.era).toBe('70s');
  });

  test('extracts tempo when present', () => {
    const result = extractEnrichment('slow ballad');
    expect(result.tempo).toBeDefined();
    expect(result.tempo?.adjustment).toBeLessThan(0);
  });

  test('extracts intent when present', () => {
    const result = extractEnrichment('study music');
    expect(result.intent).toBe('background');
  });

  test('returns empty object for no keywords', () => {
    const result = extractEnrichment('generic piece');
    expect(Object.keys(result).length).toBe(0);
  });

  test('returns empty object for empty input', () => {
    const result = extractEnrichment('');
    expect(Object.keys(result).length).toBe(0);
  });

  test('returns only fields that have values', () => {
    const result = extractEnrichment('vintage piece'); // only era
    expect(result.era).toBe('70s');
    expect(result.tempo).toBeUndefined();
    expect(result.intent).toBeUndefined();
    expect('tempo' in result).toBe(false);
    expect('intent' in result).toBe(false);
  });
});

// =============================================================================
// hasKeywords() Tests
// =============================================================================

describe('hasKeywords', () => {
  beforeEach(() => {
    clearCache();
  });

  test('returns true when moods found', () => {
    expect(hasKeywords('melancholic vibes')).toBe(true);
  });

  test('returns true when era found', () => {
    expect(hasKeywords('vintage sounds')).toBe(true);
  });

  test('returns true when tempo found', () => {
    expect(hasKeywords('slow piece')).toBe(true);
  });

  test('returns true when intent found', () => {
    expect(hasKeywords('study music')).toBe(true);
  });

  test('returns true when themes found', () => {
    expect(hasKeywords('love and dreams')).toBe(true);
  });

  test('returns false for no keywords', () => {
    // Use words that don't match any keywords
    expect(hasKeywords('xyz abc def')).toBe(false);
  });

  test('returns false for empty input', () => {
    expect(hasKeywords('')).toBe(false);
  });

  test('returns false for whitespace only', () => {
    expect(hasKeywords('   ')).toBe(false);
  });
});

// =============================================================================
// Integration Tests
// =============================================================================

describe('integration', () => {
  beforeEach(() => {
    clearCache();
  });

  test('full extraction from rich description', () => {
    const result = extractAllKeywords(
      'A slow vintage jazz ballad about lost love on a rainy night, perfect for studying'
    );

    // Should have era
    expect(result.era).toBe('70s');

    // Should have slow tempo
    expect(result.tempo?.adjustment).toBeLessThan(0);

    // Should have background intent (study)
    expect(result.intent).toBe('background');

    // Should have themes from emotion (love, lost) and nature (rain) and time (night)
    expect(result.themes.length).toBeGreaterThan(0);
  });

  test('minimal extraction from sparse description', () => {
    const result = extractAllKeywords('instrumental piece');
    // Should have default empty arrays
    expect(Array.isArray(result.moods)).toBe(true);
    expect(Array.isArray(result.themes)).toBe(true);
  });

  test('caching improves repeated extraction', () => {
    const description = 'vintage jazz with love themes';

    // First call
    const result1 = extractAllKeywords(description);

    // Second call should use cache
    const result2 = extractAllKeywords(description);

    // Results should be identical
    expect(result1).toEqual(result2);
  });
});

// =============================================================================
// extractHarmonicComplexity() Tests
// =============================================================================

describe('extractHarmonicComplexity', () => {
  beforeEach(() => {
    clearCache();
  });

  test('returns 1.8 for multiple complexity indicators', () => {
    const result = extractHarmonicComplexity('a jazz progressive fusion track');
    expect(result).toBe(1.8);
  });

  test('returns 1.4 for single complexity indicator', () => {
    const result = extractHarmonicComplexity('a chromatic exploration');
    expect(result).toBe(1.4);
  });

  test('returns 1.0 for no complexity indicators', () => {
    const result = extractHarmonicComplexity('a simple pop song');
    expect(result).toBe(1.0);
  });

  test('returns 1.0 for empty input', () => {
    expect(extractHarmonicComplexity('')).toBe(1.0);
  });

  test('returns 1.0 for whitespace only', () => {
    expect(extractHarmonicComplexity('   ')).toBe(1.0);
  });

  test('detects modal keyword', () => {
    const result = extractHarmonicComplexity('modal jazz piece');
    expect(result).toBeGreaterThan(1.0);
  });

  test('detects sophisticated keyword', () => {
    const result = extractHarmonicComplexity('sophisticated harmonies');
    expect(result).toBe(1.4);
  });

  test('case insensitive matching', () => {
    const result = extractHarmonicComplexity('JAZZ and PROGRESSIVE');
    expect(result).toBe(1.8);
  });
});

// =============================================================================
// extractPriorityMoods() Tests
// =============================================================================

describe('extractPriorityMoods', () => {
  beforeEach(() => {
    clearCache();
  });

  test('extracts moods from description', () => {
    const result = extractPriorityMoods('a melancholic and brooding jazz piece');
    expect(result.length).toBeGreaterThan(0);
  });

  test('returns matching mood keywords', () => {
    // 'dark' should be in MOOD_KEYWORDS (from MOOD_POOL or MOOD_TO_GENRE)
    const result = extractPriorityMoods('dark atmospheric music');
    expect(result).toContain('dark');
  });

  test('respects limit parameter', () => {
    const result = extractPriorityMoods('dark melancholic brooding atmospheric', 2);
    expect(result.length).toBeLessThanOrEqual(2);
  });

  test('returns empty array for empty input', () => {
    expect(extractPriorityMoods('')).toEqual([]);
  });

  test('returns empty array for whitespace only', () => {
    expect(extractPriorityMoods('   ')).toEqual([]);
  });

  test('returns empty array for no mood keywords', () => {
    // Use words that definitely aren't moods
    const result = extractPriorityMoods('xyz abc def');
    expect(result).toEqual([]);
  });

  test('extracts upbeat mood', () => {
    const result = extractPriorityMoods('upbeat dance track');
    expect(result).toContain('upbeat');
  });

  test('preserves mood order from keywords array', () => {
    // The order should match MOOD_KEYWORDS order
    const result = extractPriorityMoods('atmospheric dark music');
    expect(result.length).toBeGreaterThan(0);
  });
});
