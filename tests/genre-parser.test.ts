import { describe, test, expect, beforeEach } from 'bun:test';

import {
  isValidGenre,
  parseGenreComponents,
  buildBlendedVocalDescriptor,
  buildBlendedProductionDescriptor,
  selectInstrumentsForMultiGenre,
  buildPerformanceGuidance,
  buildMultiGenreGuidance,
  clearGuidanceCache,
} from '@bun/prompt/genre-parser';

// Seeded RNG for deterministic tests
const createSeededRng = (seed: number) => {
  let s = seed;
  return () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
};

describe('isValidGenre', () => {
  test('returns true for valid single genres', () => {
    expect(isValidGenre('ambient')).toBe(true);
    expect(isValidGenre('rock')).toBe(true);
    expect(isValidGenre('jazz')).toBe(true);
    expect(isValidGenre('symphonic')).toBe(true);
  });

  test('returns false for compound genres', () => {
    expect(isValidGenre('ambient symphonic rock')).toBe(false);
    expect(isValidGenre('jazz fusion')).toBe(false);
  });

  test('returns false for unknown genres', () => {
    expect(isValidGenre('blorgwave')).toBe(false);
    expect(isValidGenre('')).toBe(false);
  });

  test('is case insensitive', () => {
    expect(isValidGenre('AMBIENT')).toBe(true);
    expect(isValidGenre('Rock')).toBe(true);
  });
});

describe('parseGenreComponents', () => {
  test('returns empty array for empty/null input', () => {
    expect(parseGenreComponents('')).toEqual([]);
    expect(parseGenreComponents('   ')).toEqual([]);
  });

  test('returns single valid genre as array', () => {
    expect(parseGenreComponents('ambient')).toEqual(['ambient']);
    expect(parseGenreComponents('rock')).toEqual(['rock']);
  });

  test('extracts components from compound genre strings', () => {
    expect(parseGenreComponents('ambient symphonic rock')).toEqual(['ambient', 'symphonic', 'rock']);
    expect(parseGenreComponents('jazz rock')).toEqual(['jazz', 'rock']);
    expect(parseGenreComponents('electronic pop')).toEqual(['electronic', 'pop']);
  });

  test('handles hyphenated compound genres', () => {
    expect(parseGenreComponents('ambient-rock')).toEqual(['ambient', 'rock']);
    expect(parseGenreComponents('jazz-funk-soul')).toEqual(['jazz', 'funk', 'soul']);
  });

  test('handles "and" separator', () => {
    expect(parseGenreComponents('rock and jazz')).toEqual(['rock', 'jazz']);
    expect(parseGenreComponents('ambient and symphonic and rock')).toEqual(['ambient', 'symphonic', 'rock']);
  });

  test('handles "&" separator', () => {
    expect(parseGenreComponents('rock & jazz')).toEqual(['rock', 'jazz']);
    expect(parseGenreComponents('folk & country')).toEqual(['folk', 'country']);
  });

  test('filters out unrecognized words', () => {
    expect(parseGenreComponents('dark ambient')).toEqual(['ambient']);
    expect(parseGenreComponents('heavy metal fusion')).toEqual(['metal']);
    expect(parseGenreComponents('chill lofi beats')).toEqual(['lofi']);
  });

  test('is case insensitive', () => {
    expect(parseGenreComponents('AMBIENT Symphonic ROCK')).toEqual(['ambient', 'symphonic', 'rock']);
  });

  test('handles mixed separators', () => {
    expect(parseGenreComponents('jazz/rock & soul')).toEqual(['jazz', 'rock', 'soul']);
  });
});

describe('buildBlendedVocalDescriptor', () => {
  const rng = createSeededRng(12345);

  test('returns a valid descriptor for single genre', () => {
    const result = buildBlendedVocalDescriptor(['jazz'], rng);
    expect(result).toContain('Delivery');
    expect(result.split(', ').length).toBe(3);
  });

  test('returns a valid descriptor for multiple genres', () => {
    const result = buildBlendedVocalDescriptor(['ambient', 'symphonic', 'rock'], rng);
    expect(result).toContain('Delivery');
    expect(result.split(', ').length).toBe(3);
  });

  test('returns default descriptor for empty genres', () => {
    const result = buildBlendedVocalDescriptor([], rng);
    expect(result).toContain('Delivery');
  });
});

describe('buildBlendedProductionDescriptor', () => {
  const rng = createSeededRng(12345);

  test('returns a valid descriptor for single genre', () => {
    const result = buildBlendedProductionDescriptor(['rock'], rng);
    expect(result).toBeTruthy();
    expect(result.split(', ').length).toBe(2);
  });

  test('returns a valid descriptor for multiple genres', () => {
    const result = buildBlendedProductionDescriptor(['ambient', 'symphonic', 'rock'], rng);
    expect(result).toBeTruthy();
    expect(result.split(', ').length).toBe(2);
  });

  test('returns default descriptor for empty genres', () => {
    const result = buildBlendedProductionDescriptor([], rng);
    expect(result).toBeTruthy();
  });
});

describe('selectInstrumentsForMultiGenre', () => {
  const rng = createSeededRng(12345);

  test('returns empty array for empty genres', () => {
    expect(selectInstrumentsForMultiGenre([], rng)).toEqual([]);
  });

  test('returns instruments for single genre', () => {
    const result = selectInstrumentsForMultiGenre(['jazz'], rng);
    expect(result.length).toBeGreaterThan(0);
    expect(result.length).toBeLessThanOrEqual(3);
  });

  test('combines instruments from multiple genres', () => {
    const result = selectInstrumentsForMultiGenre(['ambient', 'rock'], rng);
    expect(result.length).toBeGreaterThan(0);
    expect(result.length).toBeLessThanOrEqual(3);
  });

  test('respects maxInstruments parameter', () => {
    const result = selectInstrumentsForMultiGenre(['jazz', 'rock', 'electronic'], rng, 5);
    expect(result.length).toBeLessThanOrEqual(5);
  });
});

describe('buildPerformanceGuidance', () => {
  const rng = createSeededRng(12345);

  test('returns null for invalid genre string', () => {
    expect(buildPerformanceGuidance('blorgwave', rng)).toBeNull();
    expect(buildPerformanceGuidance('', rng)).toBeNull();
    expect(buildPerformanceGuidance('unknown genre here', rng)).toBeNull();
  });

  test('returns guidance for single valid genre', () => {
    const result = buildPerformanceGuidance('jazz', rng);
    expect(result).not.toBeNull();
    expect(result!.vocal).toContain('Delivery');
    expect(result!.production).toBeTruthy();
    expect(result!.instruments.length).toBeGreaterThan(0);
  });

  test('returns guidance for compound genre string', () => {
    const result = buildPerformanceGuidance('ambient symphonic rock', rng);
    expect(result).not.toBeNull();
    expect(result!.vocal).toContain('Delivery');
    expect(result!.production).toBeTruthy();
    expect(result!.instruments.length).toBeGreaterThan(0);
  });

  test('handles hyphenated genres', () => {
    const result = buildPerformanceGuidance('jazz-rock', rng);
    expect(result).not.toBeNull();
    expect(result!.vocal).toBeTruthy();
    expect(result!.production).toBeTruthy();
  });

  test('handles mixed case input', () => {
    const result = buildPerformanceGuidance('AMBIENT ROCK', rng);
    expect(result).not.toBeNull();
  });
});

describe('buildPerformanceGuidance memoization', () => {
  beforeEach(() => {
    // Clear cache before each test to ensure isolation
    clearGuidanceCache();
  });

  test('returns cached result for same genre (default RNG)', () => {
    // First call - will compute and cache
    const result1 = buildPerformanceGuidance('jazz');
    expect(result1).not.toBeNull();

    // Second call - should return cached result (identical object)
    const result2 = buildPerformanceGuidance('jazz');
    expect(result2).toBe(result1); // Same object reference
  });

  test('cache key is case-insensitive', () => {
    const result1 = buildPerformanceGuidance('JAZZ');
    const result2 = buildPerformanceGuidance('jazz');
    const result3 = buildPerformanceGuidance('Jazz');

    // All should return the same cached result
    expect(result2).toBe(result1);
    expect(result3).toBe(result1);
  });

  test('bypasses cache when custom RNG is provided', () => {
    const rng1 = createSeededRng(111);
    const rng2 = createSeededRng(222);

    // Custom RNG calls should bypass cache
    const result1 = buildPerformanceGuidance('rock', rng1);
    const result2 = buildPerformanceGuidance('rock', rng2);

    // Results should be different objects (not cached)
    expect(result1).not.toBe(result2);
    expect(result1).not.toBeNull();
    expect(result2).not.toBeNull();
  });

  test('different genres have different cached results', () => {
    const jazzResult = buildPerformanceGuidance('jazz');
    const rockResult = buildPerformanceGuidance('rock');

    expect(jazzResult).not.toBe(rockResult);
    expect(jazzResult).not.toBeNull();
    expect(rockResult).not.toBeNull();
  });

  test('clearGuidanceCache clears the cache', () => {
    // First call - compute and cache
    const result1 = buildPerformanceGuidance('electronic');
    expect(result1).not.toBeNull();

    // Clear cache
    clearGuidanceCache();

    // After clearing, should compute new result (different object)
    const result2 = buildPerformanceGuidance('electronic');
    expect(result2).not.toBe(result1);
    expect(result2).not.toBeNull();
  });
});

describe('integration: Creative Boost compound genre support', () => {
  test('provides meaningful guidance for "ambient symphonic rock"', () => {
    // ARRANGE
    const rng = createSeededRng(42);

    // ACT
    const result = buildPerformanceGuidance('ambient symphonic rock', rng);

    // ASSERT
    expect(result).not.toBeNull();

    // Vocal descriptor should have range, delivery, and technique
    const vocalParts = result!.vocal.split(', ');
    expect(vocalParts.length).toBe(3);

    // Production descriptor should have texture and reverb
    const productionParts = result!.production.split(', ');
    expect(productionParts.length).toBe(2);

    // Should include instruments from component genres
    expect(result!.instruments.length).toBeGreaterThan(0);
  });

  test('provides guidance for multi-genre combinations from registry', () => {
    // ARRANGE
    const testCases = [
      'jazz fusion',
      'progressive rock',
      'ambient metal',
      'folk rock',
      'electronic pop',
    ];

    for (const genre of testCases) {
      // ACT
      const result = buildPerformanceGuidance(genre, Math.random);

      // ASSERT
      expect(result).not.toBeNull();
    }
  });
});

describe('buildMultiGenreGuidance', () => {
  const rng = createSeededRng(12345);

  test('returns null for empty/invalid genre string', () => {
    expect(buildMultiGenreGuidance('', rng)).toBeNull();
    expect(buildMultiGenreGuidance('   ', rng)).toBeNull();
    expect(buildMultiGenreGuidance('unknown genre here', rng)).toBeNull();
  });

  test('returns complete object for single genre', () => {
    const result = buildMultiGenreGuidance('jazz', rng);
    
    expect(result).not.toBeNull();
    expect(result!.vocal).toBeTruthy();
    expect(result!.production).toBeTruthy();
    expect(result!.instruments.length).toBeGreaterThan(0);
    expect(result!.bpmRange).toBeTruthy();
    expect(result!.harmonicStyle).toBeTruthy();
    expect(result!.timeSignature).toBeTruthy();
  });

  test('returns complete object for multi-genre string', () => {
    const result = buildMultiGenreGuidance('jazz rock', rng);
    
    expect(result).not.toBeNull();
    expect(result!.vocal).toBeTruthy();
    expect(result!.production).toBeTruthy();
    expect(result!.instruments.length).toBeGreaterThan(0);
    expect(result!.bpmRange).toBeTruthy();
    expect(result!.harmonicStyle).toBeTruthy();
    expect(result!.timeSignature).toBeTruthy();
  });

  test('includes polyrhythm only for applicable genres', () => {
    // Afrobeat has polyrhythm mappings
    const afrobeatJazz = buildMultiGenreGuidance('afrobeat jazz', rng);
    expect(afrobeatJazz).not.toBeNull();
    expect(afrobeatJazz!.polyrhythm).not.toBeNull();

    // Pop and trap don't have explicit polyrhythm mappings
    const popTrap = buildMultiGenreGuidance('pop trap', rng);
    expect(popTrap).not.toBeNull();
    expect(popTrap!.polyrhythm).toBeNull();
  });

  test('includes BPM range for genres with BPM data', () => {
    const result = buildMultiGenreGuidance('jazz rock', rng);
    expect(result).not.toBeNull();
    expect(result!.bpmRange).toMatch(/between \d+ and \d+/);
  });

  test('handles various genre combinations', () => {
    const testCases = [
      'jazz rock',
      'afrobeat jazz',
      'pop electronic',
      'ambient metal',
      'folk country',
      'latin jazz',
    ];

    for (const genreString of testCases) {
      const result = buildMultiGenreGuidance(genreString, rng);
      expect(result).not.toBeNull();
      expect(result!.vocal).toBeTruthy();
      expect(result!.production).toBeTruthy();
      expect(result!.bpmRange).toBeTruthy();
    }
  });

  test('returns harmonic styles from blended pool for multi-genre', () => {
    // Jazz rock should have modes from both jazz and rock
    // Jazz includes: dorian, mixolydian, lydian_dominant, melodic_minor
    // Rock includes: mixolydian, aeolian, ionian, dorian
    const jazzRockModes = [
      'dorian', 'mixolydian', 'lydian_dominant', 'melodic_minor',
      'aeolian', 'ionian',
    ];
    
    // Run multiple times to test randomness
    const results = new Set<string>();
    for (let i = 0; i < 20; i++) {
      const result = buildMultiGenreGuidance('jazz rock', () => Math.random());
      if (result?.harmonicStyle) {
        results.add(result.harmonicStyle);
      }
    }
    
    // All returned modes should be from the combined pool
    for (const mode of results) {
      expect(jazzRockModes).toContain(mode);
    }
  });
});

describe('integration: Multi-genre guidance flow', () => {
  test('complete guidance flow for compound genres', () => {
    const rng = createSeededRng(42);
    const genreString = 'ambient symphonic rock';
    
    // Get multi-genre guidance
    const guidance = buildMultiGenreGuidance(genreString, rng);
    
    expect(guidance).not.toBeNull();
    
    // Verify all expected properties exist
    expect(guidance).toHaveProperty('vocal');
    expect(guidance).toHaveProperty('production');
    expect(guidance).toHaveProperty('instruments');
    expect(guidance).toHaveProperty('bpmRange');
    expect(guidance).toHaveProperty('harmonicStyle');
    expect(guidance).toHaveProperty('timeSignature');
    expect(guidance).toHaveProperty('polyrhythm');
    
    // BPM range should be formatted correctly
    expect(guidance!.bpmRange).toMatch(/between \d+ and \d+/);
    
    // Harmonic style should be a valid mode
    expect(typeof guidance!.harmonicStyle).toBe('string');
    
    // Time signature should be a valid type
    expect(typeof guidance!.timeSignature).toBe('string');
    expect(guidance!.timeSignature!.startsWith('time_')).toBe(true);
  });
  
  test('single genre still works (backward compatibility)', () => {
    const rng = createSeededRng(42);
    
    // Single genres should still work
    const jazz = buildMultiGenreGuidance('jazz', rng);
    expect(jazz).not.toBeNull();
    expect(jazz!.bpmRange).toBeTruthy();
    
    const rock = buildMultiGenreGuidance('rock', rng);
    expect(rock).not.toBeNull();
    expect(rock!.bpmRange).toBeTruthy();
  });
});
