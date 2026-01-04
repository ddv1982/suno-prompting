import { describe, test, expect } from 'bun:test';

import {
  isValidGenre,
  parseGenreComponents,
  buildBlendedVocalDescriptor,
  buildBlendedProductionDescriptor,
  selectInstrumentsForMultiGenre,
  buildPerformanceGuidance,
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
