import { describe, expect, test } from 'bun:test';

import {
  MOOD_CATEGORIES,
  MOOD_CATEGORY_KEYS,
  getMoodCategoryOptions,
} from '@bun/mood';

describe('MOOD_CATEGORIES', () => {
  test('should have 20 categories registered', () => {
    expect(Object.keys(MOOD_CATEGORIES).length).toBe(20);
  });

  test('MOOD_CATEGORY_KEYS should match MOOD_CATEGORIES keys', () => {
    expect(MOOD_CATEGORY_KEYS).toEqual(Object.keys(MOOD_CATEGORIES) as typeof MOOD_CATEGORY_KEYS);
  });

  test('returns all categories have non-empty moods array', () => {
    for (const [_key, def] of Object.entries(MOOD_CATEGORIES)) {
      expect(def.moods.length).toBeGreaterThan(0);
    }
  });

  test('returns all moods are unique within each category', () => {
    for (const [_key, def] of Object.entries(MOOD_CATEGORIES)) {
      const unique = new Set(def.moods);
      expect(unique.size).toBe(def.moods.length);
    }
  });

  test('returns all categories have name property', () => {
    for (const [_key, def] of Object.entries(MOOD_CATEGORIES)) {
      expect(def.name).toBeTruthy();
      expect(typeof def.name).toBe('string');
    }
  });

  test('returns all categories have compatibleGenres array', () => {
    for (const [_key, def] of Object.entries(MOOD_CATEGORIES)) {
      expect(Array.isArray(def.compatibleGenres)).toBe(true);
    }
  });

  test('returns energetic category has expected moods', () => {
    expect(MOOD_CATEGORIES.energetic.moods).toContain('euphoric');
    expect(MOOD_CATEGORIES.energetic.moods).toContain('vibrant');
    expect(MOOD_CATEGORIES.energetic.moods).toContain('dynamic');
  });

  test('returns calm category has expected moods', () => {
    expect(MOOD_CATEGORIES.calm.moods).toContain('serene');
    expect(MOOD_CATEGORIES.calm.moods).toContain('peaceful');
    expect(MOOD_CATEGORIES.calm.moods).toContain('tranquil');
  });

  test('returns groove category has expected moods', () => {
    expect(MOOD_CATEGORIES.groove.moods).toContain('groovy');
    expect(MOOD_CATEGORIES.groove.moods).toContain('funky');
    expect(MOOD_CATEGORIES.groove.moods).toContain('bouncy');
  });
});

describe('getMoodCategoryOptions', () => {
  test('returns array with None/Auto as first option', () => {
    const options = getMoodCategoryOptions();
    expect(options[0]).toEqual({ value: '', label: 'None (Auto)' });
  });

  test('returns correct number of options including None/Auto', () => {
    const options = getMoodCategoryOptions();
    // 20 categories + 1 "None (Auto)" = 21
    expect(options.length).toBe(21);
  });

  test('returns all 20 mood categories', () => {
    const options = getMoodCategoryOptions();
    const categoryValues = options.slice(1).map((opt) => opt.value);
    expect(categoryValues.length).toBe(20);
    expect(categoryValues).toContain('energetic');
    expect(categoryValues).toContain('calm');
    expect(categoryValues).toContain('dark');
    expect(categoryValues).toContain('emotional');
    expect(categoryValues).toContain('playful');
    expect(categoryValues).toContain('intense');
    expect(categoryValues).toContain('atmospheric');
    expect(categoryValues).toContain('seasonal');
    expect(categoryValues).toContain('social');
    expect(categoryValues).toContain('sophisticated');
    expect(categoryValues).toContain('gritty');
    expect(categoryValues).toContain('epic');
    expect(categoryValues).toContain('vulnerable');
    expect(categoryValues).toContain('tense');
    expect(categoryValues).toContain('groove');
    expect(categoryValues).toContain('spiritual');
    expect(categoryValues).toContain('eclectic');
    expect(categoryValues).toContain('attitude');
    expect(categoryValues).toContain('texture');
    expect(categoryValues).toContain('movement');
  });

  test('returns options with correct label format', () => {
    const options = getMoodCategoryOptions();
    // Check a few specific labels
    const energeticOption = options.find((opt) => opt.value === 'energetic');
    expect(energeticOption?.label).toBe('Energetic');

    const grooveOption = options.find((opt) => opt.value === 'groove');
    expect(grooveOption?.label).toBe('Groove');

    const atmosphericOption = options.find((opt) => opt.value === 'atmospheric');
    expect(atmosphericOption?.label).toBe('Atmospheric');
  });
});
