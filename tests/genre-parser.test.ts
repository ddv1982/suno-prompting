import { describe, it, expect } from 'bun:test';

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
  it('returns true for valid single genres', () => {
    expect(isValidGenre('ambient')).toBe(true);
    expect(isValidGenre('rock')).toBe(true);
    expect(isValidGenre('jazz')).toBe(true);
    expect(isValidGenre('symphonic')).toBe(true);
  });

  it('returns false for compound genres', () => {
    expect(isValidGenre('ambient symphonic rock')).toBe(false);
    expect(isValidGenre('jazz fusion')).toBe(false);
  });

  it('returns false for unknown genres', () => {
    expect(isValidGenre('blorgwave')).toBe(false);
    expect(isValidGenre('')).toBe(false);
  });

  it('is case insensitive', () => {
    expect(isValidGenre('AMBIENT')).toBe(true);
    expect(isValidGenre('Rock')).toBe(true);
  });
});

describe('parseGenreComponents', () => {
  it('returns empty array for empty/null input', () => {
    expect(parseGenreComponents('')).toEqual([]);
    expect(parseGenreComponents('   ')).toEqual([]);
  });

  it('returns single valid genre as array', () => {
    expect(parseGenreComponents('ambient')).toEqual(['ambient']);
    expect(parseGenreComponents('rock')).toEqual(['rock']);
  });

  it('extracts components from compound genre strings', () => {
    expect(parseGenreComponents('ambient symphonic rock')).toEqual(['ambient', 'symphonic', 'rock']);
    expect(parseGenreComponents('jazz rock')).toEqual(['jazz', 'rock']);
    expect(parseGenreComponents('electronic pop')).toEqual(['electronic', 'pop']);
  });

  it('handles hyphenated compound genres', () => {
    expect(parseGenreComponents('ambient-rock')).toEqual(['ambient', 'rock']);
    expect(parseGenreComponents('jazz-funk-soul')).toEqual(['jazz', 'funk', 'soul']);
  });

  it('handles "and" separator', () => {
    expect(parseGenreComponents('rock and jazz')).toEqual(['rock', 'jazz']);
    expect(parseGenreComponents('ambient and symphonic and rock')).toEqual(['ambient', 'symphonic', 'rock']);
  });

  it('handles "&" separator', () => {
    expect(parseGenreComponents('rock & jazz')).toEqual(['rock', 'jazz']);
    expect(parseGenreComponents('folk & country')).toEqual(['folk', 'country']);
  });

  it('filters out unrecognized words', () => {
    expect(parseGenreComponents('dark ambient')).toEqual(['ambient']);
    expect(parseGenreComponents('heavy metal fusion')).toEqual(['metal']);
    expect(parseGenreComponents('chill lofi beats')).toEqual(['lofi']);
  });

  it('is case insensitive', () => {
    expect(parseGenreComponents('AMBIENT Symphonic ROCK')).toEqual(['ambient', 'symphonic', 'rock']);
  });

  it('handles mixed separators', () => {
    expect(parseGenreComponents('jazz/rock & soul')).toEqual(['jazz', 'rock', 'soul']);
  });
});

describe('buildBlendedVocalDescriptor', () => {
  const rng = createSeededRng(12345);

  it('returns a valid descriptor for single genre', () => {
    const result = buildBlendedVocalDescriptor(['jazz'], rng);
    expect(result).toContain('Delivery');
    expect(result.split(', ').length).toBe(3);
  });

  it('returns a valid descriptor for multiple genres', () => {
    const result = buildBlendedVocalDescriptor(['ambient', 'symphonic', 'rock'], rng);
    expect(result).toContain('Delivery');
    expect(result.split(', ').length).toBe(3);
  });

  it('returns default descriptor for empty genres', () => {
    const result = buildBlendedVocalDescriptor([], rng);
    expect(result).toContain('Delivery');
  });
});

describe('buildBlendedProductionDescriptor', () => {
  const rng = createSeededRng(12345);

  it('returns a valid descriptor for single genre', () => {
    const result = buildBlendedProductionDescriptor(['rock'], rng);
    expect(result).toBeTruthy();
    expect(result.split(', ').length).toBe(2);
  });

  it('returns a valid descriptor for multiple genres', () => {
    const result = buildBlendedProductionDescriptor(['ambient', 'symphonic', 'rock'], rng);
    expect(result).toBeTruthy();
    expect(result.split(', ').length).toBe(2);
  });

  it('returns default descriptor for empty genres', () => {
    const result = buildBlendedProductionDescriptor([], rng);
    expect(result).toBeTruthy();
  });
});

describe('selectInstrumentsForMultiGenre', () => {
  const rng = createSeededRng(12345);

  it('returns empty array for empty genres', () => {
    expect(selectInstrumentsForMultiGenre([], rng)).toEqual([]);
  });

  it('returns instruments for single genre', () => {
    const result = selectInstrumentsForMultiGenre(['jazz'], rng);
    expect(result.length).toBeGreaterThan(0);
    expect(result.length).toBeLessThanOrEqual(3);
  });

  it('combines instruments from multiple genres', () => {
    const result = selectInstrumentsForMultiGenre(['ambient', 'rock'], rng);
    expect(result.length).toBeGreaterThan(0);
    expect(result.length).toBeLessThanOrEqual(3);
  });

  it('respects maxInstruments parameter', () => {
    const result = selectInstrumentsForMultiGenre(['jazz', 'rock', 'electronic'], rng, 5);
    expect(result.length).toBeLessThanOrEqual(5);
  });
});

describe('buildPerformanceGuidance', () => {
  const rng = createSeededRng(12345);

  it('returns null for invalid genre string', () => {
    expect(buildPerformanceGuidance('blorgwave', rng)).toBeNull();
    expect(buildPerformanceGuidance('', rng)).toBeNull();
    expect(buildPerformanceGuidance('unknown genre here', rng)).toBeNull();
  });

  it('returns guidance for single valid genre', () => {
    const result = buildPerformanceGuidance('jazz', rng);
    expect(result).not.toBeNull();
    expect(result!.vocal).toContain('Delivery');
    expect(result!.production).toBeTruthy();
    expect(result!.instruments.length).toBeGreaterThan(0);
  });

  it('returns guidance for compound genre string', () => {
    const result = buildPerformanceGuidance('ambient symphonic rock', rng);
    expect(result).not.toBeNull();
    expect(result!.vocal).toContain('Delivery');
    expect(result!.production).toBeTruthy();
    expect(result!.instruments.length).toBeGreaterThan(0);
  });

  it('handles hyphenated genres', () => {
    const result = buildPerformanceGuidance('jazz-rock', rng);
    expect(result).not.toBeNull();
    expect(result!.vocal).toBeTruthy();
    expect(result!.production).toBeTruthy();
  });

  it('handles mixed case input', () => {
    const result = buildPerformanceGuidance('AMBIENT ROCK', rng);
    expect(result).not.toBeNull();
  });
});

describe('integration: Creative Boost compound genre support', () => {
  it('provides meaningful guidance for "ambient symphonic rock"', () => {
    const rng = createSeededRng(42);
    const result = buildPerformanceGuidance('ambient symphonic rock', rng);

    expect(result).not.toBeNull();

    // Should have vocal descriptor with range, delivery, and technique
    const vocalParts = result!.vocal.split(', ');
    expect(vocalParts.length).toBe(3);

    // Should have production descriptor with texture and reverb
    const productionParts = result!.production.split(', ');
    expect(productionParts.length).toBe(2);

    // Should have instruments
    expect(result!.instruments.length).toBeGreaterThan(0);
  });

  it('provides guidance for multi-genre combinations from registry', () => {
    const testCases = [
      'jazz fusion',
      'progressive rock',
      'ambient metal',
      'folk rock',
      'electronic pop',
    ];

    for (const genre of testCases) {
      const result = buildPerformanceGuidance(genre, Math.random);
      expect(result).not.toBeNull();
    }
  });
});
