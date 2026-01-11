import { beforeAll, describe, expect, test } from 'bun:test';

import { GENRE_REGISTRY } from '@bun/instruments';
import {
  getGenresForCategory,
  getSunoStylesForCategory,
  initializeMoodMappings,
  MOOD_CATEGORIES,
} from '@bun/mood';
import { SUNO_V5_STYLES } from '@shared/suno-v5-styles';

describe('Mood Mappings', () => {
  beforeAll(() => {
    initializeMoodMappings();
  });

  describe('getGenresForCategory', () => {
    test('returns non-empty array for groove category', () => {
      const genres = getGenresForCategory('groove');
      expect(genres.length).toBeGreaterThan(0);
    });

    test('returns non-empty array for calm category', () => {
      const genres = getGenresForCategory('calm');
      expect(genres.length).toBeGreaterThan(0);
    });

    test('returns non-empty array for atmospheric category', () => {
      const genres = getGenresForCategory('atmospheric');
      expect(genres.length).toBeGreaterThan(0);
    });

    test('returns valid GenreType values', () => {
      const validGenreTypes = Object.keys(GENRE_REGISTRY);
      const genres = getGenresForCategory('calm');

      for (const genre of genres) {
        expect(validGenreTypes).toContain(genre);
      }
    });

    test('returns unique genres (no duplicates)', () => {
      const genres = getGenresForCategory('energetic');
      const unique = new Set(genres);
      expect(unique.size).toBe(genres.length);
    });

    test('returns array for all categories', () => {
      const categories = Object.keys(MOOD_CATEGORIES) as (keyof typeof MOOD_CATEGORIES)[];
      for (const category of categories) {
        const genres = getGenresForCategory(category);
        expect(Array.isArray(genres)).toBe(true);
      }
    });

    test('populaties compatibleGenres in MOOD_CATEGORIES after initialization', () => {
      // After initialization, compatibleGenres should be populated
      const grooveGenres = MOOD_CATEGORIES.groove.compatibleGenres;
      expect(Array.isArray(grooveGenres)).toBe(true);
    });
  });

  describe('getSunoStylesForCategory', () => {
    test('returns non-empty array for groove category', () => {
      const styles = getSunoStylesForCategory('groove');
      expect(styles.length).toBeGreaterThan(0);
    });

    test('returns non-empty array for atmospheric category', () => {
      const styles = getSunoStylesForCategory('atmospheric');
      expect(styles.length).toBeGreaterThan(0);
    });

    test('returns valid Suno V5 styles', () => {
      const styles = getSunoStylesForCategory('groove');
      const stylesSet = new Set<string>(SUNO_V5_STYLES);

      for (const style of styles) {
        expect(stylesSet.has(style)).toBe(true);
      }
    });

    test('returns unique styles (no duplicates)', () => {
      const styles = getSunoStylesForCategory('calm');
      const unique = new Set(styles);
      expect(unique.size).toBe(styles.length);
    });

    test('returns array for all categories', () => {
      const categories = Object.keys(MOOD_CATEGORIES) as (keyof typeof MOOD_CATEGORIES)[];
      for (const category of categories) {
        const styles = getSunoStylesForCategory(category);
        expect(Array.isArray(styles)).toBe(true);
      }
    });

    test('returns styles containing genre keywords for groove', () => {
      const styles = getSunoStylesForCategory('groove');
      // Groove should include funk-related styles
      const hasFunkStyle = styles.some((s) => s.includes('funk'));
      expect(hasFunkStyle).toBe(true);
    });

    test('returns styles containing genre keywords for atmospheric', () => {
      const styles = getSunoStylesForCategory('atmospheric');
      // Atmospheric should include ambient-related styles
      const hasAmbientStyle = styles.some((s) => s.includes('ambient'));
      expect(hasAmbientStyle).toBe(true);
    });
  });
});
