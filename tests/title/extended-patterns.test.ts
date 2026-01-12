/**
 * Tests for extended title patterns (numbers, places, singles, questions)
 *
 * Verifies that the new v3.0 title pattern types work correctly
 * and integrate with the existing pattern system.
 */

import { describe, expect, test } from 'bun:test';

import {
  NUMBER_WORDS,
  PLACE_WORDS,
  SINGLE_WORDS,
  QUESTION_WORDS,
  EXTENDED_PATTERNS,
} from '@bun/prompt/title/datasets/extended';
import { GENRE_TITLE_PATTERNS, DEFAULT_PATTERNS } from '@bun/prompt/title/datasets/modifiers';
import { getWord, interpolatePattern } from '@bun/prompt/title/patterns';

// =============================================================================
// Seeded RNG for deterministic tests
// =============================================================================

function createSeededRng(seed: number): () => number {
  let state = seed;
  return () => {
    state = (state * 1103515245 + 12345) & 0x7fffffff;
    return state / 0x7fffffff;
  };
}

// =============================================================================
// Extended Datasets Tests
// =============================================================================

describe('Extended Title Datasets', () => {
  describe('NUMBER_WORDS', () => {
    test('has sufficient variety (15+ items)', () => {
      expect(NUMBER_WORDS.length).toBeGreaterThanOrEqual(15);
    });

    test('includes numeric formats', () => {
      expect(NUMBER_WORDS).toContain('1984');
      expect(NUMBER_WORDS).toContain('808');
      expect(NUMBER_WORDS).toContain('3AM');
    });

    test('includes number words', () => {
      expect(NUMBER_WORDS).toContain('Zero');
      expect(NUMBER_WORDS).toContain('Seven');
      expect(NUMBER_WORDS).toContain('Infinite');
    });
  });

  describe('PLACE_WORDS', () => {
    test('has sufficient variety (18+ cities)', () => {
      expect(PLACE_WORDS.length).toBeGreaterThanOrEqual(18);
    });

    test('includes global cities', () => {
      expect(PLACE_WORDS).toContain('Tokyo');
      expect(PLACE_WORDS).toContain('Berlin');
      expect(PLACE_WORDS).toContain('Lagos');
      expect(PLACE_WORDS).toContain('New York');
    });
  });

  describe('SINGLE_WORDS', () => {
    test('has sufficient variety (24+ words)', () => {
      expect(SINGLE_WORDS.length).toBeGreaterThanOrEqual(24);
    });

    test('includes evocative words', () => {
      expect(SINGLE_WORDS).toContain('Bloom');
      expect(SINGLE_WORDS).toContain('Pulse');
      expect(SINGLE_WORDS).toContain('Nova');
      expect(SINGLE_WORDS).toContain('Void');
    });
  });

  describe('QUESTION_WORDS', () => {
    test('has sufficient variety (10+ questions)', () => {
      expect(QUESTION_WORDS.length).toBeGreaterThanOrEqual(10);
    });

    test('includes complete questions with punctuation', () => {
      expect(QUESTION_WORDS).toContain('Where Did You Go?');
      expect(QUESTION_WORDS).toContain('What If?');
      expect(QUESTION_WORDS).toContain('Do You Remember?');
    });

    test('all entries end with question mark', () => {
      QUESTION_WORDS.forEach((q) => {
        expect(q.endsWith('?')).toBe(true);
      });
    });
  });

  describe('EXTENDED_PATTERNS', () => {
    test('has all pattern categories', () => {
      expect(EXTENDED_PATTERNS.number).toBeDefined();
      expect(EXTENDED_PATTERNS.place).toBeDefined();
      expect(EXTENDED_PATTERNS.single).toBeDefined();
      expect(EXTENDED_PATTERNS.question).toBeDefined();
    });

    test('patterns include placeholders', () => {
      const numberPatterns = EXTENDED_PATTERNS.number ?? [];
      const placePatterns = EXTENDED_PATTERNS.place ?? [];
      expect(numberPatterns.some((p) => p.includes('{number}'))).toBe(true);
      expect(placePatterns.some((p) => p.includes('{place}'))).toBe(true);
    });
  });
});

// =============================================================================
// Pattern Interpolation Tests
// =============================================================================

describe('Extended Pattern Interpolation', () => {
  const rng = createSeededRng(42);

  describe('getWord() with extended categories', () => {
    test('returns valid number', () => {
      const word = getWord('number', 'energetic', rng);
      expect(NUMBER_WORDS).toContain(word);
    });

    test('returns valid place', () => {
      const word = getWord('place', 'dreamy', rng);
      expect(PLACE_WORDS).toContain(word);
    });

    test('returns valid single word', () => {
      const word = getWord('single', 'melancholic', rng);
      expect(SINGLE_WORDS).toContain(word);
    });

    test('returns complete question (as-is without filtering)', () => {
      const word = getWord('question', 'aggressive', rng);
      expect(QUESTION_WORDS).toContain(word);
      expect(word.endsWith('?')).toBe(true);
    });
  });

  describe('interpolatePattern() with extended placeholders', () => {
    test('{number} produces valid number', () => {
      const result = interpolatePattern('{number}', 'upbeat', rng);
      expect(NUMBER_WORDS).toContain(result);
    });

    test('{place} produces city name', () => {
      const result = interpolatePattern('{place}', 'calm', rng);
      expect(PLACE_WORDS).toContain(result);
    });

    test('{single} produces evocative word', () => {
      const result = interpolatePattern('{single}', 'dark', rng);
      expect(SINGLE_WORDS).toContain(result);
    });

    test('{question} produces complete question', () => {
      const result = interpolatePattern('{question}', 'romantic', rng);
      expect(QUESTION_WORDS).toContain(result);
    });

    test('Track {number} produces correct format', () => {
      const result = interpolatePattern('Track {number}', 'energetic', rng);
      expect(result).toMatch(/^Track .+$/);
    });

    test('{place} Nights produces correct format', () => {
      const result = interpolatePattern('{place} Nights', 'upbeat', rng);
      expect(result).toMatch(/^.+ Nights$/);
      // Extract place name and verify
      const place = result.replace(' Nights', '');
      expect(PLACE_WORDS).toContain(place);
    });

    test('Lost in {place} produces correct format', () => {
      const result = interpolatePattern('Lost in {place}', 'melancholic', rng);
      expect(result).toMatch(/^Lost in .+$/);
    });
  });
});

// =============================================================================
// Genre-Specific Extended Patterns Tests
// =============================================================================

describe('Genre-Specific Extended Patterns', () => {
  test('electronic genre has extended patterns', () => {
    const patterns = GENRE_TITLE_PATTERNS.electronic ?? [];
    expect(patterns.length).toBeGreaterThan(0);
    expect(patterns.some((p) => p.includes('{number}'))).toBe(true);
    expect(patterns.some((p) => p.includes('{single}'))).toBe(true);
    expect(patterns.some((p) => p.includes('{place}'))).toBe(true);
  });

  test('ambient genre has extended patterns', () => {
    const patterns = GENRE_TITLE_PATTERNS.ambient ?? [];
    expect(patterns.length).toBeGreaterThan(0);
    expect(patterns.some((p) => p.includes('{single}'))).toBe(true);
    expect(patterns.some((p) => p.includes('{place}'))).toBe(true);
    expect(patterns.some((p) => p.includes('{question}'))).toBe(true);
  });

  test('synthwave genre has extended patterns', () => {
    const patterns = GENRE_TITLE_PATTERNS.synthwave ?? [];
    expect(patterns.length).toBeGreaterThan(0);
    expect(patterns.some((p) => p.includes('{place}'))).toBe(true);
    expect(patterns.some((p) => p.includes('{number}'))).toBe(true);
    expect(patterns.some((p) => p.includes('{single}'))).toBe(true);
  });

  test('rock genre has extended patterns', () => {
    const patterns = GENRE_TITLE_PATTERNS.rock ?? [];
    expect(patterns.length).toBeGreaterThan(0);
    expect(patterns.some((p) => p.includes('{single}'))).toBe(true);
    expect(patterns.some((p) => p.includes('{question}'))).toBe(true);
  });

  test('pop genre has extended patterns', () => {
    const patterns = GENRE_TITLE_PATTERNS.pop ?? [];
    expect(patterns.length).toBeGreaterThan(0);
    expect(patterns.some((p) => p.includes('{single}'))).toBe(true);
    expect(patterns.some((p) => p.includes('{question}'))).toBe(true);
  });
});

// =============================================================================
// Backward Compatibility Tests
// =============================================================================

describe('Backward Compatibility', () => {
  const rng = createSeededRng(123);

  test('existing patterns still work', () => {
    // Test traditional pattern
    const result = interpolatePattern('{time} {emotion}', 'melancholic', rng);
    expect(result).toBeTruthy();
    expect(typeof result).toBe('string');
    expect(result.split(' ').length).toBe(2);
  });

  test('DEFAULT_PATTERNS still work', () => {
    DEFAULT_PATTERNS.forEach((pattern) => {
      const result = interpolatePattern(pattern, 'calm', rng);
      expect(result).toBeTruthy();
      expect(result).not.toContain('{');
      expect(result).not.toContain('}');
    });
  });

  test('existing genre patterns still work', () => {
    const genres = ['jazz', 'blues', 'metal', 'classical', 'folk'];
    genres.forEach((genre) => {
      const patterns = GENRE_TITLE_PATTERNS[genre];
      if (patterns) {
        patterns.forEach((pattern) => {
          const result = interpolatePattern(pattern, 'upbeat', rng);
          expect(result).toBeTruthy();
          expect(result).not.toContain('{');
          expect(result).not.toContain('}');
        });
      }
    });
  });

  test('mixed patterns (old + new placeholders) work', () => {
    // Pattern with both old and new placeholders
    const result = interpolatePattern('{emotion} in {place}', 'romantic', rng);
    expect(result).toMatch(/^.+ in .+$/);
  });
});
