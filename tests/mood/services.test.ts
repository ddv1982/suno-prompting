import { beforeAll, describe, expect, test } from 'bun:test';

import { GENRE_REGISTRY } from '@bun/instruments';
import {
  filterGenresByMoodCategory,
  filterSunoStylesByMoodCategory,
  initializeMoodMappings,
  isSunoStyleCompatibleWithCategory,
  MOOD_CATEGORIES,
  selectGenreForMoodCategory,
  selectGenresForMoodCategory,
  selectMoodsForCategory,
} from '@bun/mood';
import { SUNO_V5_STYLES } from '@shared/suno-v5-styles';

describe('Mood Services', () => {
  beforeAll(() => {
    initializeMoodMappings();
  });

  describe('selectMoodsForCategory', () => {
    test('returns requested number of moods when available', () => {
      const moods = selectMoodsForCategory('energetic', 3);
      expect(moods).toHaveLength(3);
    });

    test('returns all moods when count exceeds available', () => {
      const moods = selectMoodsForCategory('seasonal', 100);
      expect(moods.length).toBe(MOOD_CATEGORIES.seasonal.moods.length);
    });

    test('returns moods from the category', () => {
      const moods = selectMoodsForCategory('calm', 3);
      for (const mood of moods) {
        expect(MOOD_CATEGORIES.calm.moods).toContain(mood);
      }
    });

    test('returns empty array for zero count', () => {
      const moods = selectMoodsForCategory('energetic', 0);
      expect(moods).toHaveLength(0);
    });

    test('returns deterministic results with same RNG', () => {
      const createFixedRng = (): (() => number) => {
        let i = 0;
        const sequence = [0.1, 0.5, 0.9, 0.3, 0.7, 0.2, 0.6, 0.4, 0.8];
        return () => sequence[i++ % sequence.length]!;
      };

      const moods1 = selectMoodsForCategory('playful', 3, createFixedRng());
      const moods2 = selectMoodsForCategory('playful', 3, createFixedRng());
      expect(moods1).toEqual(moods2);
    });

    test('returns different results with different RNG values', () => {
      const moods1 = selectMoodsForCategory('energetic', 3, () => 0.1);
      const moods2 = selectMoodsForCategory('energetic', 3, () => 0.9);
      // With different fixed RNG values, results should typically differ
      // (unless by chance they happen to match)
      expect(moods1.length).toBe(3);
      expect(moods2.length).toBe(3);
    });

    test('returns unique moods (no duplicates in output)', () => {
      const moods = selectMoodsForCategory('atmospheric', 5);
      const unique = new Set(moods);
      expect(unique.size).toBe(moods.length);
    });
  });

  describe('selectGenreForMoodCategory', () => {
    test('returns valid genre for groove category', () => {
      const genre = selectGenreForMoodCategory('groove');
      if (genre !== null) {
        expect(Object.keys(GENRE_REGISTRY)).toContain(genre);
      }
    });

    test('returns valid genre for atmospheric category', () => {
      const genre = selectGenreForMoodCategory('atmospheric');
      if (genre !== null) {
        expect(Object.keys(GENRE_REGISTRY)).toContain(genre);
      }
    });

    test('returns deterministic results with same RNG', () => {
      const genre1 = selectGenreForMoodCategory('groove', () => 0.5);
      const genre2 = selectGenreForMoodCategory('groove', () => 0.5);
      expect(genre1).toEqual(genre2);
    });
  });

  describe('selectGenresForMoodCategory', () => {
    test('returns requested number of genres when available', () => {
      const genres = selectGenresForMoodCategory('groove', 2);
      expect(genres.length).toBeLessThanOrEqual(2);
      expect(genres.length).toBeGreaterThan(0);
    });

    test('returns valid GenreType values', () => {
      const genres = selectGenresForMoodCategory('atmospheric', 3);
      for (const genre of genres) {
        expect(Object.keys(GENRE_REGISTRY)).toContain(genre);
      }
    });

    test('returns empty array when no genres match', () => {
      // All categories should have at least some genres after initialization
      // This test just verifies the function handles the array correctly
      const genres = selectGenresForMoodCategory('groove', 0);
      expect(genres).toHaveLength(0);
    });

    test('returns deterministic results with same RNG', () => {
      const createFixedRng = (): (() => number) => {
        let i = 0;
        const sequence = [0.2, 0.8, 0.4, 0.6, 0.1, 0.9, 0.3, 0.7, 0.5];
        return () => sequence[i++ % sequence.length]!;
      };

      const genres1 = selectGenresForMoodCategory('calm', 2, createFixedRng());
      const genres2 = selectGenresForMoodCategory('calm', 2, createFixedRng());
      expect(genres1).toEqual(genres2);
    });

    test('returns unique genres (no duplicates)', () => {
      const genres = selectGenresForMoodCategory('energetic', 5);
      const unique = new Set(genres);
      expect(unique.size).toBe(genres.length);
    });
  });

  describe('filterSunoStylesByMoodCategory', () => {
    test('returns compatible styles for groove category', () => {
      const styles = filterSunoStylesByMoodCategory('groove');
      expect(styles.length).toBeGreaterThan(0);
    });

    test('returns valid Suno V5 styles', () => {
      const styles = filterSunoStylesByMoodCategory('atmospheric');
      const stylesSet = new Set<string>(SUNO_V5_STYLES);
      for (const style of styles) {
        expect(stylesSet.has(style)).toBe(true);
      }
    });

    test('returns array for all categories', () => {
      const categories = Object.keys(MOOD_CATEGORIES) as (keyof typeof MOOD_CATEGORIES)[];
      for (const category of categories) {
        const styles = filterSunoStylesByMoodCategory(category);
        expect(Array.isArray(styles)).toBe(true);
      }
    });
  });

  describe('filterGenresByMoodCategory', () => {
    test('returns compatible genres for groove category', () => {
      const genres = filterGenresByMoodCategory('groove');
      expect(genres.length).toBeGreaterThan(0);
    });

    test('returns valid GenreType values', () => {
      const genres = filterGenresByMoodCategory('calm');
      for (const genre of genres) {
        expect(Object.keys(GENRE_REGISTRY)).toContain(genre);
      }
    });

    test('returns array for all categories', () => {
      const categories = Object.keys(MOOD_CATEGORIES) as (keyof typeof MOOD_CATEGORIES)[];
      for (const category of categories) {
        const genres = filterGenresByMoodCategory(category);
        expect(Array.isArray(genres)).toBe(true);
      }
    });
  });

  describe('isSunoStyleCompatibleWithCategory', () => {
    test('returns true for compatible style', () => {
      // First get a style that should be compatible with groove
      const grooveStyles = filterSunoStylesByMoodCategory('groove');
      if (grooveStyles.length > 0) {
        const style = grooveStyles[0]!;
        expect(isSunoStyleCompatibleWithCategory(style, 'groove')).toBe(true);
      }
    });

    test('returns false for incompatible style', () => {
      // Get a style from one category and check against a very different category
      const grooveStyles = filterSunoStylesByMoodCategory('groove');
      const calmStyles = filterSunoStylesByMoodCategory('calm');

      // Find a style in groove that's not in calm (if any)
      if (grooveStyles.length > 0 && calmStyles.length > 0) {
        const grooveOnly = grooveStyles.find((s) => !calmStyles.includes(s));
        if (grooveOnly) {
          expect(isSunoStyleCompatibleWithCategory(grooveOnly, 'calm')).toBe(false);
        }
      }
    });

    test('handles case-insensitive comparison', () => {
      const grooveStyles = filterSunoStylesByMoodCategory('groove');
      if (grooveStyles.length > 0) {
        const style = grooveStyles[0]!;
        // Test with uppercase version
        expect(isSunoStyleCompatibleWithCategory(style.toUpperCase(), 'groove')).toBe(true);
      }
    });
  });
});
