import { describe, expect, test } from 'bun:test';

import { COMPOUND_MOODS, type CompoundMood } from '@bun/mood/compound';
import { selectCompoundMood, getCompoundMoodsForGenre } from '@bun/mood/services/compound';

describe('Compound Moods', () => {
  describe('COMPOUND_MOODS', () => {
    test('has at least 25 compound moods defined', () => {
      expect(COMPOUND_MOODS.length).toBeGreaterThanOrEqual(25);
    });

    test('all compound moods are non-empty strings', () => {
      for (const mood of COMPOUND_MOODS) {
        expect(typeof mood).toBe('string');
        expect(mood.length).toBeGreaterThan(0);
      }
    });

    test('all compound moods contain two words', () => {
      for (const mood of COMPOUND_MOODS) {
        const words = mood.split(' ');
        expect(words.length).toBe(2);
      }
    });

    test('contains expected contrasting moods', () => {
      expect(COMPOUND_MOODS).toContain('bittersweet nostalgia');
      expect(COMPOUND_MOODS).toContain('dark euphoria');
      expect(COMPOUND_MOODS).toContain('aggressive hope');
      expect(COMPOUND_MOODS).toContain('tender melancholy');
    });

    test('contains expected complex emotional states', () => {
      expect(COMPOUND_MOODS).toContain('melancholic triumph');
      expect(COMPOUND_MOODS).toContain('restless serenity');
      expect(COMPOUND_MOODS).toContain('gentle fury');
      expect(COMPOUND_MOODS).toContain('luminous grief');
    });

    test('contains expected atmospheric combinations', () => {
      expect(COMPOUND_MOODS).toContain('ethereal darkness');
      expect(COMPOUND_MOODS).toContain('warm desolation');
      expect(COMPOUND_MOODS).toContain('bright sorrow');
    });

    test('contains expected textural emotions', () => {
      expect(COMPOUND_MOODS).toContain('rough tenderness');
      expect(COMPOUND_MOODS).toContain('sharp comfort');
      expect(COMPOUND_MOODS).toContain('soft rage');
      expect(COMPOUND_MOODS).toContain('raw elegance');
    });

    test('all compound moods are unique', () => {
      const unique = new Set(COMPOUND_MOODS);
      expect(unique.size).toBe(COMPOUND_MOODS.length);
    });
  });

  describe('selectCompoundMood', () => {
    test('returns a valid compound mood', () => {
      const mood = selectCompoundMood('jazz');
      expect(COMPOUND_MOODS).toContain(mood);
    });

    test('returns deterministic results with same RNG', () => {
      const mood1 = selectCompoundMood('electronic', () => 0.5);
      const mood2 = selectCompoundMood('electronic', () => 0.5);
      expect(mood1).toEqual(mood2);
    });

    test('returns different results with different RNG values', () => {
      const results = new Set<string>();
      for (let i = 0; i < 50; i++) {
        results.add(selectCompoundMood('rock'));
      }
      // Should have variety
      expect(results.size).toBeGreaterThan(1);
    });

    test('returns valid compound mood for unknown genre (fallback)', () => {
      const mood = selectCompoundMood('unknowngenre');
      expect(COMPOUND_MOODS).toContain(mood);
    });

    test('prefers genre-appropriate moods for jazz', () => {
      // Run multiple times and check that jazz-appropriate moods appear
      const results: CompoundMood[] = [];
      for (let i = 0; i < 100; i++) {
        results.push(selectCompoundMood('jazz'));
      }
      // Should include some jazz-appropriate moods
      const jazzMoods: CompoundMood[] = ['bittersweet nostalgia', 'raw elegance', 'wistful optimism'];
      const hasJazzMood = results.some((r) => jazzMoods.includes(r));
      expect(hasJazzMood).toBe(true);
    });

    test('prefers genre-appropriate moods for electronic', () => {
      const results: CompoundMood[] = [];
      for (let i = 0; i < 100; i++) {
        results.push(selectCompoundMood('electronic'));
      }
      const electronicMoods: CompoundMood[] = ['dark euphoria', 'chaotic joy', 'anxious bliss'];
      const hasElectronicMood = results.some((r) => electronicMoods.includes(r));
      expect(hasElectronicMood).toBe(true);
    });

    test('prefers genre-appropriate moods for metal', () => {
      const results: CompoundMood[] = [];
      for (let i = 0; i < 100; i++) {
        results.push(selectCompoundMood('metal'));
      }
      const metalMoods: CompoundMood[] = ['fierce tenderness', 'gentle fury', 'luminous grief'];
      const hasMetalMood = results.some((r) => metalMoods.includes(r));
      expect(hasMetalMood).toBe(true);
    });

    test('handles genre names with spaces and special characters', () => {
      const mood = selectCompoundMood('drum and bass');
      expect(COMPOUND_MOODS).toContain(mood);
    });
  });

  describe('getCompoundMoodsForGenre', () => {
    test('returns affinities for jazz', () => {
      const moods = getCompoundMoodsForGenre('jazz');
      expect(moods.length).toBeGreaterThan(0);
      expect(moods).toContain('bittersweet nostalgia');
    });

    test('returns affinities for electronic', () => {
      const moods = getCompoundMoodsForGenre('electronic');
      expect(moods.length).toBeGreaterThan(0);
      expect(moods).toContain('dark euphoria');
    });

    test('returns affinities for metal', () => {
      const moods = getCompoundMoodsForGenre('metal');
      expect(moods.length).toBeGreaterThan(0);
      expect(moods).toContain('fierce tenderness');
    });

    test('returns empty array for unknown genre', () => {
      const moods = getCompoundMoodsForGenre('unknowngenre');
      expect(moods).toEqual([]);
    });

    test('handles case insensitivity', () => {
      const lower = getCompoundMoodsForGenre('jazz');
      const upper = getCompoundMoodsForGenre('JAZZ');
      const mixed = getCompoundMoodsForGenre('Jazz');
      expect(lower).toEqual(upper);
      expect(lower).toEqual(mixed);
    });
  });

  describe('CompoundMood type', () => {
    test('type represents valid compound mood string', () => {
      const validMood: CompoundMood = 'bittersweet nostalgia';
      expect(COMPOUND_MOODS).toContain(validMood);
    });
  });
});
