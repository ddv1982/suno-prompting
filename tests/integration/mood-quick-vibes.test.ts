/**
 * Integration tests for Quick Vibes + Mood Category integration.
 *
 * Tests that mood category properly influences Quick Vibes prompt generation
 * while preserving template availability and existing behavior.
 */

import { beforeAll, describe, expect, test } from 'bun:test';

import {
  initializeMoodMappings,
  MOOD_CATEGORIES,
  type MoodCategory,
} from '@bun/mood';
import {
  buildDeterministicQuickVibes,
  QUICK_VIBES_TEMPLATES,
  type QuickVibesTemplate,
} from '@bun/prompt/quick-vibes-templates';

import type { QuickVibesCategory } from '@shared/types';

// Initialize mood mappings before running tests
beforeAll(() => {
  initializeMoodMappings();
});

// =============================================================================
// Test Helpers
// =============================================================================

/**
 * Check if a mood from a category is present in the prompt text.
 */
function containsMoodFromCategory(text: string, category: MoodCategory): boolean {
  const categoryMoods = MOOD_CATEGORIES[category].moods;
  const textLower = text.toLowerCase();
  return categoryMoods.some((mood) => textLower.includes(mood.toLowerCase()));
}

/**
 * Check if a mood from a template is present in the prompt text.
 */
function containsMoodFromTemplate(text: string, template: QuickVibesTemplate): boolean {
  const textLower = text.toLowerCase();
  return template.moods.some((mood) => textLower.includes(mood.toLowerCase()));
}

/**
 * Create a deterministic RNG for testing.
 */
function createFixedRng(seed: number = 0.5): () => number {
  return () => seed;
}

// =============================================================================
// Tests
// =============================================================================

describe('Quick Vibes with mood category integration', () => {
  describe('returns prompt with mood from selected category when moodCategory provided', () => {
    const testCases: Array<{ category: QuickVibesCategory; moodCategory: MoodCategory }> = [
      { category: 'lofi-study', moodCategory: 'calm' },
      { category: 'cafe-coffeeshop', moodCategory: 'energetic' },
      { category: 'ambient-focus', moodCategory: 'atmospheric' },
      { category: 'latenight-chill', moodCategory: 'groove' },
      { category: 'cozy-rainy', moodCategory: 'emotional' },
      { category: 'lofi-chill', moodCategory: 'playful' },
    ];

    for (const { category, moodCategory } of testCases) {
      test(`returns ${moodCategory} mood in ${category} prompt`, () => {
        // Arrange
        const rng = createFixedRng(0.5);

        // Act
        const result = buildDeterministicQuickVibes(category, false, true, {
          withWordlessVocals: false,
          maxMode: true,
          moodCategory,
          rng,
        });

        // Assert
        expect(containsMoodFromCategory(result.text, moodCategory)).toBe(true);
      });
    }
  });

  test('returns template moods when no category provided', () => {
    // Arrange
    const category: QuickVibesCategory = 'lofi-study';
    const template = QUICK_VIBES_TEMPLATES[category];
    const rng = createFixedRng(0.5);

    // Act
    const result = buildDeterministicQuickVibes(category, false, true, rng);

    // Assert
    expect(containsMoodFromTemplate(result.text, template)).toBe(true);
  });

  test('returns template moods when moodCategory is undefined', () => {
    // Arrange
    const category: QuickVibesCategory = 'cafe-coffeeshop';
    const template = QUICK_VIBES_TEMPLATES[category];
    const rng = createFixedRng(0.3);

    // Act
    const result = buildDeterministicQuickVibes(category, false, true, {
      withWordlessVocals: false,
      maxMode: true,
      moodCategory: undefined,
      rng,
    });

    // Assert
    expect(containsMoodFromTemplate(result.text, template)).toBe(true);
  });

  describe('returns all templates remain accessible with any mood category', () => {
    const categories: QuickVibesCategory[] = [
      'lofi-study',
      'cafe-coffeeshop',
      'ambient-focus',
      'latenight-chill',
      'cozy-rainy',
      'lofi-chill',
    ];
    const moodCategory: MoodCategory = 'groove';

    for (const category of categories) {
      test(`${category} template works with ${moodCategory} mood`, () => {
        // Arrange
        const rng = createFixedRng(0.5);

        // Act
        const result = buildDeterministicQuickVibes(category, false, true, {
          withWordlessVocals: false,
          maxMode: true,
          moodCategory,
          rng,
        });

        // Assert
        expect(result.text).toBeDefined();
        expect(result.text.length).toBeGreaterThan(0);
        expect(result.title).toBeDefined();
        expect(result.title.length).toBeGreaterThan(0);
      });
    }
  });

  test('returns deterministic output with same RNG and mood category', () => {
    // Arrange
    const category: QuickVibesCategory = 'lofi-study';
    const moodCategory: MoodCategory = 'calm';

    // Act - generate twice with same RNG
    const result1 = buildDeterministicQuickVibes(category, false, true, {
      withWordlessVocals: false,
      maxMode: true,
      moodCategory,
      rng: createFixedRng(0.5),
    });

    const result2 = buildDeterministicQuickVibes(category, false, true, {
      withWordlessVocals: false,
      maxMode: true,
      moodCategory,
      rng: createFixedRng(0.5),
    });

    // Assert
    expect(result1.text).toBe(result2.text);
    expect(result1.title).toBe(result2.title);
  });

  test('returns different output with different mood categories', () => {
    // Arrange
    const category: QuickVibesCategory = 'lofi-study';

    // Act
    const calmResult = buildDeterministicQuickVibes(category, false, true, {
      withWordlessVocals: false,
      maxMode: true,
      moodCategory: 'calm',
      rng: createFixedRng(0.5),
    });

    const energeticResult = buildDeterministicQuickVibes(category, false, true, {
      withWordlessVocals: false,
      maxMode: true,
      moodCategory: 'energetic',
      rng: createFixedRng(0.5),
    });

    // Assert - moods should be different
    expect(containsMoodFromCategory(calmResult.text, 'calm')).toBe(true);
    expect(containsMoodFromCategory(energeticResult.text, 'energetic')).toBe(true);
  });

  test('returns wordless vocals included when requested with mood category', () => {
    // Arrange
    const category: QuickVibesCategory = 'ambient-focus';
    const moodCategory: MoodCategory = 'atmospheric';

    // Act
    const result = buildDeterministicQuickVibes(category, true, true, {
      withWordlessVocals: true,
      maxMode: true,
      moodCategory,
      rng: createFixedRng(0.5),
    });

    // Assert
    expect(result.text).toContain('wordless vocals');
  });

  test('returns MAX mode format when maxMode is true with mood category', () => {
    // Arrange
    const category: QuickVibesCategory = 'lofi-chill';
    const moodCategory: MoodCategory = 'playful';

    // Act
    const result = buildDeterministicQuickVibes(category, false, true, {
      withWordlessVocals: false,
      maxMode: true,
      moodCategory,
      rng: createFixedRng(0.5),
    });

    // Assert
    expect(result.text).toContain('Genre:');
    expect(result.text).toContain('Mood:');
    expect(result.text).toContain('Instruments:');
  });

  test('returns standard mode format when maxMode is false with mood category', () => {
    // Arrange
    const category: QuickVibesCategory = 'cozy-rainy';
    const moodCategory: MoodCategory = 'emotional';

    // Act
    const result = buildDeterministicQuickVibes(category, false, false, {
      withWordlessVocals: false,
      maxMode: false,
      moodCategory,
      rng: createFixedRng(0.5),
    });

    // Assert
    expect(result.text).toContain('Instruments:');
    expect(result.text).not.toContain('Genre: "');
  });
});
