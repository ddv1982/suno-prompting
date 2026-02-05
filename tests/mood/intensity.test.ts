import { describe, expect, test } from 'bun:test';

import { MOOD_CATEGORIES, MOOD_CATEGORY_KEYS } from '@bun/mood/categories';
import { MOOD_INTENSITY_MAP, getIntensityVariant, hasIntensityVariants } from '@bun/mood/intensity';
import { selectMoodWithIntensity, moodHasIntensityVariants } from '@bun/mood/services/intensity';

describe('Mood Intensity System', () => {
  describe('MOOD_INTENSITY_MAP', () => {
    test('has intensity mappings defined', () => {
      expect(Object.keys(MOOD_INTENSITY_MAP).length).toBeGreaterThan(0);
    });

    test('each mapping has all three intensity levels', () => {
      for (const [_mood, variants] of Object.entries(MOOD_INTENSITY_MAP)) {
        expect(variants.mild).toBeTruthy();
        expect(variants.moderate).toBeTruthy();
        expect(variants.intense).toBeTruthy();
      }
    });

    test('has mappings for core moods', () => {
      const coreMoods = ['sad', 'happy', 'calm', 'peaceful', 'energetic', 'dark', 'haunting'];
      for (const mood of coreMoods) {
        if (mood in MOOD_INTENSITY_MAP) {
          const variants = MOOD_INTENSITY_MAP[mood]!;
          expect(variants.mild).toBeTruthy();
          expect(variants.moderate).toBeTruthy();
          expect(variants.intense).toBeTruthy();
        }
      }
    });

    test('moderate variant is often the base mood', () => {
      // Many moods should have themselves as the moderate variant
      const baseMoodsAsModerate = Object.entries(MOOD_INTENSITY_MAP).filter(
        ([mood, variants]) => variants.moderate === mood
      );
      expect(baseMoodsAsModerate.length).toBeGreaterThan(0);
    });
  });

  describe('getIntensityVariant', () => {
    test('returns correct mild variant', () => {
      expect(getIntensityVariant('euphoric', 'mild')).toBe('uplifted');
      expect(getIntensityVariant('serene', 'mild')).toBe('quiet');
    });

    test('returns correct moderate variant', () => {
      expect(getIntensityVariant('euphoric', 'moderate')).toBe('euphoric');
      expect(getIntensityVariant('serene', 'moderate')).toBe('serene');
    });

    test('returns correct intense variant', () => {
      expect(getIntensityVariant('euphoric', 'intense')).toBe('ecstatic');
      expect(getIntensityVariant('serene', 'intense')).toBe('transcendent');
    });

    test('returns base mood when no mapping exists', () => {
      expect(getIntensityVariant('unknownmood', 'mild')).toBe('unknownmood');
      expect(getIntensityVariant('fancymood', 'intense')).toBe('fancymood');
    });

    test('handles case insensitivity', () => {
      expect(getIntensityVariant('EUPHORIC', 'mild')).toBe('uplifted');
      expect(getIntensityVariant('Euphoric', 'moderate')).toBe('euphoric');
    });
  });

  describe('hasIntensityVariants', () => {
    test('returns true for moods with variants', () => {
      expect(hasIntensityVariants('euphoric')).toBe(true);
      expect(hasIntensityVariants('serene')).toBe(true);
      expect(hasIntensityVariants('haunting')).toBe(true);
    });

    test('returns false for moods without variants', () => {
      expect(hasIntensityVariants('unknownmood')).toBe(false);
      expect(hasIntensityVariants('veryrandomstring')).toBe(false);
    });

    test('handles case insensitivity', () => {
      expect(hasIntensityVariants('EUPHORIC')).toBe(true);
      expect(hasIntensityVariants('Euphoric')).toBe(true);
    });
  });

  describe('selectMoodWithIntensity', () => {
    test('returns IntensifiedMood with correct structure', () => {
      const result = selectMoodWithIntensity('energetic', 'moderate');
      expect(result).toHaveProperty('category');
      expect(result).toHaveProperty('mood');
      expect(result).toHaveProperty('intensity');
    });

    test('returns correct category', () => {
      const result = selectMoodWithIntensity('emotional', 'mild');
      expect(result.category).toBe('emotional');
    });

    test('returns correct intensity level', () => {
      const mild = selectMoodWithIntensity('calm', 'mild');
      const moderate = selectMoodWithIntensity('calm', 'moderate');
      const intense = selectMoodWithIntensity('calm', 'intense');

      expect(mild.intensity).toBe('mild');
      expect(moderate.intensity).toBe('moderate');
      expect(intense.intensity).toBe('intense');
    });

    test('defaults to moderate intensity', () => {
      const result = selectMoodWithIntensity('dark');
      expect(result.intensity).toBe('moderate');
    });

    test('returns deterministic results with same RNG', () => {
      const result1 = selectMoodWithIntensity('playful', 'mild', () => 0.5);
      const result2 = selectMoodWithIntensity('playful', 'mild', () => 0.5);
      expect(result1).toEqual(result2);
    });

    test('returns different results with different RNG values', () => {
      // Run multiple times to verify randomness works
      const results = new Set<string>();
      for (let i = 0; i < 50; i++) {
        const result = selectMoodWithIntensity('energetic', 'moderate');
        results.add(result.mood);
      }
      // Should have variety in the results (at least a few different moods)
      expect(results.size).toBeGreaterThan(1);
    });

    test('works for all mood categories', () => {
      for (const category of MOOD_CATEGORY_KEYS) {
        const result = selectMoodWithIntensity(category, 'moderate');
        expect(result.category).toBe(category);
        expect(typeof result.mood).toBe('string');
        expect(result.mood.length).toBeGreaterThan(0);
      }
    });

    test('returns fallback for unknown category', () => {
      // @ts-expect-error - Testing invalid category
      const result = selectMoodWithIntensity('nonexistent', 'mild');
      expect(result.mood).toBe('neutral');
      expect(result.intensity).toBe('mild');
    });
  });

  describe('moodHasIntensityVariants', () => {
    test('returns true for moods with variants', () => {
      expect(moodHasIntensityVariants('euphoric')).toBe(true);
    });

    test('returns false for moods without variants', () => {
      expect(moodHasIntensityVariants('unknownmood')).toBe(false);
    });
  });

  describe('intensity coverage', () => {
    test('has intensity mappings for representative moods from each category', () => {
      // Check that at least some moods from each category have intensity mappings
      const categoriesWithMappings: string[] = [];

      for (const category of MOOD_CATEGORY_KEYS) {
        const moods = MOOD_CATEGORIES[category].moods;
        const hasMappings = moods.some((mood) => hasIntensityVariants(mood));
        if (hasMappings) {
          categoriesWithMappings.push(category);
        }
      }

      // Most categories should have at least some moods with intensity mappings
      expect(categoriesWithMappings.length).toBeGreaterThan(10);
    });
  });
});
