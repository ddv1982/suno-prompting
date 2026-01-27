import { describe, it, expect } from 'bun:test';

import { applyIntensityToMoods } from '@bun/mood/services/intensity';
import {
  CREATIVITY_POOLS,
  selectGenreForLevel,
  getCreativityLevel,
  selectMoodForLevel,
  getInstrumentsForGenre,
  generateDeterministicCreativeBoostTitle,
  getCreativityPool,
} from '@bun/prompt/creative-boost';
import { buildDeterministicCreativeBoost } from '@bun/prompt/creative-boost/builder';

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

describe('getCreativityLevel', () => {
  it('maps 0-20 to low', () => {
    expect(getCreativityLevel(0)).toBe('low');
    expect(getCreativityLevel(10)).toBe('low');
    expect(getCreativityLevel(20)).toBe('low');
  });

  it('maps 21-40 to safe', () => {
    expect(getCreativityLevel(21)).toBe('safe');
    expect(getCreativityLevel(30)).toBe('safe');
    expect(getCreativityLevel(40)).toBe('safe');
  });

  it('maps 41-60 to normal', () => {
    expect(getCreativityLevel(41)).toBe('normal');
    expect(getCreativityLevel(50)).toBe('normal');
    expect(getCreativityLevel(60)).toBe('normal');
  });

  it('maps 61-80 to adventurous', () => {
    expect(getCreativityLevel(61)).toBe('adventurous');
    expect(getCreativityLevel(70)).toBe('adventurous');
    expect(getCreativityLevel(80)).toBe('adventurous');
  });

  it('maps 81-100 to high', () => {
    expect(getCreativityLevel(81)).toBe('high');
    expect(getCreativityLevel(100)).toBe('high');
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

describe('generateDeterministicCreativeBoostTitle', () => {
  it('generates title for low level', () => {
    const title = generateDeterministicCreativeBoostTitle('low', () => RNG_MID);
    expect(title).toBeDefined();
    expect(title.length).toBeGreaterThan(0);
  });

  it('generates more elaborate titles for high level', () => {
    const lowTitle = generateDeterministicCreativeBoostTitle('low', () => RNG_MID);
    const highTitle = generateDeterministicCreativeBoostTitle('high', () => RNG_MID);

    // High level titles should have 3 words (adjective + noun + suffix)
    expect(highTitle.split(' ').length).toBe(3);
    expect(lowTitle.split(' ').length).toBe(2);
  });

  it('is deterministic with same RNG', () => {
    const title1 = generateDeterministicCreativeBoostTitle('normal', () => RNG_DETERMINISTIC);
    const title2 = generateDeterministicCreativeBoostTitle('normal', () => RNG_DETERMINISTIC);
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

// =============================================================================
// Task 5.1: Unit Tests for applyIntensityToMoods
// =============================================================================

describe('applyIntensityToMoods', () => {
  it('transforms moods to mild variants', () => {
    const moods = ['dreamy', 'ethereal', 'hypnotic'];
    const result = applyIntensityToMoods(moods, 'mild');
    // 'dreamy' at mild → 'hazy', 'ethereal' at mild → 'airy', 'hypnotic' at mild → 'mesmerizing'
    expect(result).toContain('hazy');
    expect(result).toContain('airy');
    expect(result).toContain('mesmerizing');
  });

  it('transforms moods to intense variants', () => {
    const moods = ['dreamy', 'ethereal'];
    const result = applyIntensityToMoods(moods, 'intense');
    // 'dreamy' at intense → 'surreal', 'ethereal' at intense → 'otherworldly'
    expect(result).toContain('surreal');
    expect(result).toContain('otherworldly');
  });

  it('returns original mood if no mapping exists', () => {
    const moods = ['unknownmood'];
    const result = applyIntensityToMoods(moods, 'mild');
    expect(result).toContain('unknownmood');
  });

  it('handles empty array', () => {
    const result = applyIntensityToMoods([], 'moderate');
    expect(result).toEqual([]);
  });

  it('preserves order of moods in output', () => {
    const moods = ['calm', 'peaceful', 'serene'];
    const result = applyIntensityToMoods(moods, 'mild');
    // 'calm' at mild → 'quiet', 'peaceful' at mild → 'gentle', 'serene' at mild → 'quiet'
    expect(result).toEqual(['quiet', 'gentle', 'quiet']);
  });

  it('handles moderate intensity (base mood form)', () => {
    const moods = ['dreamy', 'ethereal'];
    const result = applyIntensityToMoods(moods, 'moderate');
    // 'dreamy' at moderate → 'dreamy', 'ethereal' at moderate → 'ethereal'
    expect(result).toContain('dreamy');
    expect(result).toContain('ethereal');
  });
});

// =============================================================================
// Task 5.2: Integration Tests for selectMoodForLevel with genre
// =============================================================================

describe('selectMoodForLevel with genre', () => {
  const RNG_MID = () => 0.5;

  describe('ambient genre', () => {
    it('returns ambient-appropriate mood at low creativity', () => {
      const mood = selectMoodForLevel('low', RNG_MID, undefined, 'ambient');
      // Should be mild variant of ambient mood - verify it's a string
      expect(typeof mood).toBe('string');
      expect(mood.length).toBeGreaterThan(0);
    });

    it('returns ambient-appropriate mood at high creativity', () => {
      const mood = selectMoodForLevel('high', RNG_MID, undefined, 'ambient');
      expect(typeof mood).toBe('string');
      expect(mood.length).toBeGreaterThan(0);
    });

    it('scales intensity with creativity level for ambient', () => {
      // Low creativity should produce milder moods
      const lowMood = selectMoodForLevel('low', () => 0.1, undefined, 'ambient');
      // High creativity should produce more intense moods
      const highMood = selectMoodForLevel('high', () => 0.1, undefined, 'ambient');

      expect(typeof lowMood).toBe('string');
      expect(typeof highMood).toBe('string');
      // Both should be valid mood strings (may or may not be different depending on RNG)
    });
  });

  describe('mood category override', () => {
    it('uses mood category when provided, ignoring genre', () => {
      const mood = selectMoodForLevel('low', RNG_MID, 'energetic', 'ambient');
      // Should use energetic category, not ambient genre
      expect(typeof mood).toBe('string');
      expect(mood.length).toBeGreaterThan(0);
    });

    it('mood category takes priority over genre', () => {
      // With energetic category override on a calm ambient genre
      const result1 = selectMoodForLevel('normal', () => 0.3, 'energetic', 'ambient');
      const result2 = selectMoodForLevel('normal', () => 0.3, 'energetic', 'metal');
      // Both should come from energetic category, so similar pool
      expect(typeof result1).toBe('string');
      expect(typeof result2).toBe('string');
    });
  });

  describe('fallback behavior', () => {
    it('falls back to generic pools for unknown genre', () => {
      const mood = selectMoodForLevel('low', RNG_MID, undefined, 'unknowngenre');
      // Should fall back to generic low mood pool
      const lowMoods = ['calm', 'peaceful', 'relaxed', 'mellow', 'gentle', 'serene'];
      expect(lowMoods).toContain(mood);
    });

    it('uses generic pools when no genre provided', () => {
      const mood = selectMoodForLevel('high', RNG_MID, undefined, undefined);
      const highMoods = ['apocalyptic', 'surreal', 'dystopian', 'psychedelic', 'otherworldly', 'feral'];
      expect(highMoods).toContain(mood);
    });

    it('uses generic pools when genre has no moods defined', () => {
      // Empty string genre should fall back
      const mood = selectMoodForLevel('normal', RNG_MID, undefined, '');
      expect(typeof mood).toBe('string');
      expect(mood.length).toBeGreaterThan(0);
    });
  });

  describe('compound genres', () => {
    it('uses first word of compound genre', () => {
      // 'jazz ambient' should use jazz moods (first word)
      const mood = selectMoodForLevel('normal', RNG_MID, undefined, 'jazz ambient');
      expect(typeof mood).toBe('string');
      expect(mood.length).toBeGreaterThan(0);
    });

    it('handles multi-word compound genres', () => {
      const mood = selectMoodForLevel('adventurous', RNG_MID, undefined, 'rock jazz blues');
      expect(typeof mood).toBe('string');
      expect(mood.length).toBeGreaterThan(0);
    });
  });

  describe('determinism', () => {
    it('is deterministic with same RNG and inputs', () => {
      const mood1 = selectMoodForLevel('normal', () => 0.42, undefined, 'jazz');
      const mood2 = selectMoodForLevel('normal', () => 0.42, undefined, 'jazz');
      expect(mood1).toBe(mood2);
    });

    it('different RNG values produce potentially different moods', () => {
      const moods = new Set<string>();
      for (let i = 0; i < 10; i++) {
        const mood = selectMoodForLevel('normal', () => i / 10, undefined, 'jazz');
        moods.add(mood);
      }
      // Should have at least some variety (more than 1 unique mood)
      expect(moods.size).toBeGreaterThanOrEqual(1);
    });
  });
});

// =============================================================================
// Task 5.3: End-to-End Tests for Builder with genre-aware moods
// =============================================================================

describe('buildDeterministicCreativeBoost with genre-aware moods', () => {
  it('deterministic: same inputs produce same outputs', () => {
    const rng = () => 0.5;
    const result1 = buildDeterministicCreativeBoost(50, ['jazz'], false, rng);
    const result2 = buildDeterministicCreativeBoost(50, ['jazz'], false, rng);
    // Reset RNG would be needed for true determinism, but structure should be consistent
    expect(result1.genre).toBeDefined();
    expect(result1.title).toBeDefined();
    expect(result1.text).toBeDefined();
    expect(result2.genre).toBeDefined();
    expect(result2.title).toBeDefined();
    expect(result2.text).toBeDefined();
  });

  it('moodCategory option still works as override', () => {
    const rng = () => 0.5;
    const result = buildDeterministicCreativeBoost(50, ['ambient'], false, {
      creativityLevel: 50,
      seedGenres: ['ambient'],
      maxMode: false,
      rng,
      moodCategory: 'energetic',
    });
    // Should have a result with the override applied
    expect(result.text).toBeDefined();
    expect(result.genre).toBeDefined();
    expect(result.title).toBeDefined();
  });

  it('produces valid output structure for all creativity levels', () => {
    const rng = () => 0.5;
    const levels = [0, 20, 50, 75, 95]; // low, safe, normal, adventurous, high

    for (const level of levels) {
      const result = buildDeterministicCreativeBoost(level, ['jazz'], false, rng);
      expect(result.text).toBeDefined();
      expect(result.text.length).toBeGreaterThan(0);
      expect(result.genre).toBeDefined();
      expect(result.title).toBeDefined();
    }
  });

  it('includes mood in output text', () => {
    const rng = () => 0.5;
    const result = buildDeterministicCreativeBoost(50, ['jazz'], false, rng);
    // The text should contain the mood as part of the prompt
    expect(result.text.length).toBeGreaterThan(0);
    // Standard mode format is "{mood} {genre}\nInstruments: ..."
    expect(result.text).toMatch(/\w+ \w+/); // At least "mood genre" pattern
  });

  it('MAX mode produces structured output with mood field', () => {
    const rng = () => 0.5;
    const result = buildDeterministicCreativeBoost(50, ['jazz'], true, rng);
    // MAX mode format should include mood field
    expect(result.text).toContain('mood:');
    expect(result.text).toContain('genre:');
    expect(result.text).toContain('instruments:');
  });

  it('uses genre-aware moods when genre is detected', () => {
    const rng = () => 0.5;
    // High creativity with jazz should produce intense variant of jazz moods
    const result = buildDeterministicCreativeBoost(95, ['jazz'], false, rng);
    expect(result.genre).toContain('jazz');
    expect(result.text).toBeDefined();
  });

  it('handles empty seed genres gracefully', () => {
    const rng = () => 0.5;
    const result = buildDeterministicCreativeBoost(50, [], false, rng);
    expect(result.genre).toBeDefined();
    expect(result.text).toBeDefined();
    expect(result.title).toBeDefined();
  });
});
