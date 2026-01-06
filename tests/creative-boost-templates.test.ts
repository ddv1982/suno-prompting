import { describe, it, expect } from 'bun:test';

import {
  CREATIVITY_POOLS,
  selectGenreForLevel,
  mapSliderToLevel,
  selectMoodForLevel,
  getInstrumentsForGenre,
  generateCreativeBoostTitle,
  getCreativityPool,
} from '@bun/prompt/creative-boost-templates';

// =============================================================================
// Test Constants
// =============================================================================

/** Standard RNG value for middle-of-range selection */
const RNG_MID = 0.5;

/** RNG value for determinism tests */
const RNG_DETERMINISTIC = 0.3;

/** RNG value that triggers blending in normal mode (< 0.4) */
const RNG_BLEND_TRIGGER = 0.1;

/** Number of iterations for variety tests */
const VARIETY_TEST_ITERATIONS = 20;

describe('CREATIVITY_POOLS', () => {
  it('has pools for all 5 creativity levels', () => {
    const levels = ['low', 'safe', 'normal', 'adventurous', 'high'] as const;

    for (const level of levels) {
      expect(CREATIVITY_POOLS[level]).toBeDefined();
      expect(CREATIVITY_POOLS[level].genres).toBeDefined();
      expect(CREATIVITY_POOLS[level].genres.length).toBeGreaterThan(0);
    }
  });

  it('low level does not allow blending', () => {
    expect(CREATIVITY_POOLS.low.allowBlending).toBe(false);
    expect(CREATIVITY_POOLS.low.maxGenres).toBe(1);
  });

  it('safe level does not allow blending', () => {
    expect(CREATIVITY_POOLS.safe.allowBlending).toBe(false);
    expect(CREATIVITY_POOLS.safe.maxGenres).toBe(1);
  });

  it('normal level allows blending up to 2 genres', () => {
    expect(CREATIVITY_POOLS.normal.allowBlending).toBe(true);
    expect(CREATIVITY_POOLS.normal.maxGenres).toBe(2);
  });

  it('adventurous level allows blending up to 3 genres', () => {
    expect(CREATIVITY_POOLS.adventurous.allowBlending).toBe(true);
    expect(CREATIVITY_POOLS.adventurous.maxGenres).toBe(3);
  });

  it('high level allows experimental fusions', () => {
    expect(CREATIVITY_POOLS.high.allowBlending).toBe(true);
  });
});

describe('mapSliderToLevel', () => {
  it('maps 0-10 to low', () => {
    expect(mapSliderToLevel(0)).toBe('low');
    expect(mapSliderToLevel(5)).toBe('low');
    expect(mapSliderToLevel(10)).toBe('low');
  });

  it('maps 11-30 to safe', () => {
    expect(mapSliderToLevel(11)).toBe('safe');
    expect(mapSliderToLevel(20)).toBe('safe');
    expect(mapSliderToLevel(30)).toBe('safe');
  });

  it('maps 31-60 to normal', () => {
    expect(mapSliderToLevel(31)).toBe('normal');
    expect(mapSliderToLevel(50)).toBe('normal');
    expect(mapSliderToLevel(60)).toBe('normal');
  });

  it('maps 61-85 to adventurous', () => {
    expect(mapSliderToLevel(61)).toBe('adventurous');
    expect(mapSliderToLevel(75)).toBe('adventurous');
    expect(mapSliderToLevel(85)).toBe('adventurous');
  });

  it('maps 86-100 to high', () => {
    expect(mapSliderToLevel(86)).toBe('high');
    expect(mapSliderToLevel(100)).toBe('high');
  });
});

describe('selectGenreForLevel', () => {
  it('returns single genre for low level', () => {
    const genre = selectGenreForLevel('low', [], () => RNG_MID);
    expect(genre).toBeDefined();
    expect(genre.split(' ').length).toBe(1);
  });

  it('uses seed genres when provided', () => {
    const genre = selectGenreForLevel('low', ['rock'], () => RNG_MID);
    expect(genre).toBe('rock');
  });

  it('can blend genres at normal level', () => {
    // Multiple runs with different RNG to cover blending case
    const genres = new Set<string>();
    for (let i = 0; i < VARIETY_TEST_ITERATIONS; i++) {
      const genre = selectGenreForLevel('normal', [], () => i / VARIETY_TEST_ITERATIONS);
      genres.add(genre);
    }
    // Should have at least some variety
    expect(genres.size).toBeGreaterThan(1);
  });

  it('produces experimental fusions at high level', () => {
    const genre = selectGenreForLevel('high', [], () => RNG_MID);
    // High level always produces fusions (2 genres)
    expect(genre.split(' ').length).toBeGreaterThanOrEqual(2);
  });

  it('respects seed genres for blending', () => {
    const genre = selectGenreForLevel('normal', ['jazz', 'rock'], () => RNG_BLEND_TRIGGER);
    // Should use the seed genres
    expect(genre).toContain('jazz');
  });
});

describe('selectMoodForLevel', () => {
  it('returns mood appropriate for low level', () => {
    const mood = selectMoodForLevel('low', () => RNG_MID);
    const lowMoods = ['calm', 'peaceful', 'relaxed', 'mellow', 'gentle', 'serene'];
    expect(lowMoods).toContain(mood);
  });

  it('returns mood appropriate for high level', () => {
    const mood = selectMoodForLevel('high', () => RNG_MID);
    const highMoods = ['apocalyptic', 'surreal', 'dystopian', 'psychedelic', 'otherworldly', 'feral'];
    expect(highMoods).toContain(mood);
  });

  it('is deterministic with same RNG', () => {
    const mood1 = selectMoodForLevel('normal', () => RNG_DETERMINISTIC);
    const mood2 = selectMoodForLevel('normal', () => RNG_DETERMINISTIC);
    expect(mood1).toBe(mood2);
  });
});

describe('getInstrumentsForGenre', () => {
  it('returns instruments for known genre', () => {
    const instruments = getInstrumentsForGenre('jazz', () => RNG_MID);
    expect(instruments).toBeDefined();
    expect(instruments.length).toBeGreaterThan(0);
    expect(instruments.length).toBeLessThanOrEqual(4);
  });

  it('returns fallback instruments for unknown genre', () => {
    const instruments = getInstrumentsForGenre('unknown_genre_xyz', () => RNG_MID);
    expect(instruments).toContain('piano');
  });

  it('handles compound genres', () => {
    const instruments = getInstrumentsForGenre('jazz rock', () => RNG_MID);
    expect(instruments).toBeDefined();
    expect(instruments.length).toBeGreaterThan(0);
  });
});

describe('generateCreativeBoostTitle', () => {
  it('generates title for low level', () => {
    const title = generateCreativeBoostTitle('low', 'jazz', () => RNG_MID);
    expect(title).toBeDefined();
    expect(title.length).toBeGreaterThan(0);
  });

  it('generates more elaborate titles for high level', () => {
    const lowTitle = generateCreativeBoostTitle('low', 'jazz', () => RNG_MID);
    const highTitle = generateCreativeBoostTitle('high', 'jazz', () => RNG_MID);

    // High level titles should have 3 words (adjective + noun + suffix)
    expect(highTitle.split(' ').length).toBe(3);
    expect(lowTitle.split(' ').length).toBe(2);
  });

  it('is deterministic with same RNG', () => {
    const title1 = generateCreativeBoostTitle('normal', 'rock', () => RNG_DETERMINISTIC);
    const title2 = generateCreativeBoostTitle('normal', 'rock', () => RNG_DETERMINISTIC);
    expect(title1).toBe(title2);
  });
});

describe('getCreativityPool', () => {
  it('returns pool for valid level', () => {
    const pool = getCreativityPool('adventurous');
    expect(pool).toBeDefined();
    expect(pool.genres).toBeDefined();
    expect(pool.allowBlending).toBe(true);
  });
});
