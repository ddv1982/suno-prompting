/**
 * Unit tests for Zod superRefine validation patterns.
 * Tests the migrated validation schemas with ctx.addIssue() pattern.
 *
 * @module tests/unit/schemas/validation
 */
import { describe, expect, test } from 'bun:test';

import { GenerateCreativeBoostSchema, RefineCreativeBoostSchema } from '@shared/schemas/creative-boost';
import { GenerateQuickVibesSchema, RefineQuickVibesSchema } from '@shared/schemas/quick-vibes';
import {
  CreativeBoostSubmitSchema,
  FullPromptRefineSchema,
  FullPromptSubmitSchema,
  QuickVibesRefineSchema,
  QuickVibesSubmitSchema,
} from '@shared/schemas/submit-validation';

// ============================================
// Quick Vibes Schema Tests
// ============================================

describe('GenerateQuickVibesSchema', () => {
  describe('mutual exclusivity validation', () => {
    test('passes when using only category', () => {
      const result = GenerateQuickVibesSchema.safeParse({
        category: 'lofi-study',
        customDescription: '',
        withWordlessVocals: false,
        sunoStyles: [],
      });
      expect(result.success).toBe(true);
    });

    test('passes when using only suno styles', () => {
      const result = GenerateQuickVibesSchema.safeParse({
        category: null,
        customDescription: '',
        withWordlessVocals: false,
        sunoStyles: ['dream-pop'],
      });
      expect(result.success).toBe(true);
    });

    test('fails when using both category and suno styles', () => {
      const result = GenerateQuickVibesSchema.safeParse({
        category: 'lofi-study',
        customDescription: '',
        withWordlessVocals: false,
        sunoStyles: ['dream-pop'],
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        const issue = result.error.issues.find(i => i.path.includes('sunoStyles'));
        expect(issue).toBeDefined();
        expect(issue?.message).toBe('Cannot use both Category and Suno V5 Styles. Please select only one.');
      }
    });

    test('passes when using description with null category', () => {
      const result = GenerateQuickVibesSchema.safeParse({
        category: null,
        customDescription: 'A relaxing summer vibe',
        withWordlessVocals: false,
        sunoStyles: [],
      });
      expect(result.success).toBe(true);
    });
  });
});

describe('RefineQuickVibesSchema', () => {
  test('passes when category is null and no suno styles', () => {
    const result = RefineQuickVibesSchema.safeParse({
      currentPrompt: 'existing prompt',
      feedback: 'make it more chill',
      withWordlessVocals: false,
      category: null,
      sunoStyles: [],
    });
    expect(result.success).toBe(true);
  });

  test('fails when both category and suno styles are set', () => {
    const result = RefineQuickVibesSchema.safeParse({
      currentPrompt: 'existing prompt',
      feedback: 'make it more chill',
      withWordlessVocals: false,
      category: 'cafe-coffeeshop',
      sunoStyles: ['jazz'],
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const issue = result.error.issues.find(i => i.path.includes('sunoStyles'));
      expect(issue).toBeDefined();
    }
  });
});

// ============================================
// Creative Boost Schema Tests
// ============================================

describe('GenerateCreativeBoostSchema', () => {
  describe('creativity level validation', () => {
    test('passes with valid creativity levels', () => {
      for (const level of [0, 25, 50, 75, 100]) {
        const result = GenerateCreativeBoostSchema.safeParse({
          creativityLevel: level,
          seedGenres: [],
          sunoStyles: [],
          description: '',
          lyricsTopic: '',
          withWordlessVocals: false,
          maxMode: false,
          withLyrics: false,
        });
        expect(result.success).toBe(true);
      }
    });

    test('fails with invalid creativity level', () => {
      const result = GenerateCreativeBoostSchema.safeParse({
        creativityLevel: 30,
        seedGenres: [],
        sunoStyles: [],
        description: '',
        lyricsTopic: '',
        withWordlessVocals: false,
        maxMode: false,
        withLyrics: false,
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        const issue = result.error.issues[0];
        expect(issue?.message).toContain('Invalid creativity level: 30');
        expect(issue?.message).toContain('Must be one of: 0, 25, 50, 75, 100');
      }
    });

    test('fails with negative creativity level', () => {
      const result = GenerateCreativeBoostSchema.safeParse({
        creativityLevel: -10,
        seedGenres: [],
        sunoStyles: [],
        description: '',
        lyricsTopic: '',
        withWordlessVocals: false,
        maxMode: false,
        withLyrics: false,
      });
      expect(result.success).toBe(false);
    });
  });

  describe('mutual exclusivity validation', () => {
    test('passes when using only seed genres', () => {
      const result = GenerateCreativeBoostSchema.safeParse({
        creativityLevel: 50,
        seedGenres: ['jazz', 'funk'],
        sunoStyles: [],
        description: '',
        lyricsTopic: '',
        withWordlessVocals: false,
        maxMode: false,
        withLyrics: false,
      });
      expect(result.success).toBe(true);
    });

    test('passes when using only suno styles', () => {
      const result = GenerateCreativeBoostSchema.safeParse({
        creativityLevel: 50,
        seedGenres: [],
        sunoStyles: ['indie-rock'],
        description: '',
        lyricsTopic: '',
        withWordlessVocals: false,
        maxMode: false,
        withLyrics: false,
      });
      expect(result.success).toBe(true);
    });

    test('fails when using both seed genres and suno styles', () => {
      const result = GenerateCreativeBoostSchema.safeParse({
        creativityLevel: 50,
        seedGenres: ['jazz'],
        sunoStyles: ['indie-rock'],
        description: '',
        lyricsTopic: '',
        withWordlessVocals: false,
        maxMode: false,
        withLyrics: false,
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        const issue = result.error.issues.find(i => i.path.includes('sunoStyles'));
        expect(issue).toBeDefined();
        expect(issue?.message).toBe('Cannot use both Seed Genres and Suno V5 Styles. Please select only one.');
      }
    });
  });

});

describe('RefineCreativeBoostSchema', () => {
  test('fails when using both seed genres and suno styles', () => {
    const result = RefineCreativeBoostSchema.safeParse({
      currentPrompt: 'existing prompt',
      currentTitle: 'Existing Title',
      feedback: 'make it more funky',
      lyricsTopic: '',
      description: '',
      seedGenres: ['funk'],
      sunoStyles: ['disco'],
      withWordlessVocals: false,
      maxMode: false,
      withLyrics: false,
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const issue = result.error.issues.find(i => i.path.includes('sunoStyles'));
      expect(issue).toBeDefined();
    }
  });
});

// ============================================
// Submit Validation Schema Tests
// ============================================

describe('FullPromptSubmitSchema', () => {
  test('fails when no input provided', () => {
    const result = FullPromptSubmitSchema.safeParse({
      description: '',
      lyricsTopic: '',
      lyricsMode: false,
      hasAdvancedSelection: false,
      sunoStyles: [],
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const issue = result.error.issues.find(i => i.path.includes('description'));
      expect(issue).toBeDefined();
      expect(issue?.message).toContain('Provide a description');
    }
  });

  test('passes with description only', () => {
    const result = FullPromptSubmitSchema.safeParse({
      description: 'A jazz song',
      lyricsTopic: '',
      lyricsMode: false,
      hasAdvancedSelection: false,
      sunoStyles: [],
    });
    expect(result.success).toBe(true);
  });

  test('passes with advanced selection only', () => {
    const result = FullPromptSubmitSchema.safeParse({
      description: '',
      lyricsTopic: '',
      lyricsMode: false,
      hasAdvancedSelection: true,
      sunoStyles: [],
    });
    expect(result.success).toBe(true);
  });

  test('passes with suno styles only', () => {
    const result = FullPromptSubmitSchema.safeParse({
      description: '',
      lyricsTopic: '',
      lyricsMode: false,
      hasAdvancedSelection: false,
      sunoStyles: ['dream-pop'],
    });
    expect(result.success).toBe(true);
  });

  test('passes with lyrics topic in lyrics mode', () => {
    const result = FullPromptSubmitSchema.safeParse({
      description: '',
      lyricsTopic: 'Love and heartbreak',
      lyricsMode: true,
      hasAdvancedSelection: false,
      sunoStyles: [],
    });
    expect(result.success).toBe(true);
  });
});

describe('FullPromptRefineSchema', () => {
  test('fails when no feedback and no style changes', () => {
    const result = FullPromptRefineSchema.safeParse({
      feedbackText: '',
      styleChanges: undefined,
      lyricsMode: true,
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const issue = result.error.issues.find(i => i.path.includes('feedbackText'));
      expect(issue).toBeDefined();
    }
  });

  test('passes with feedback only', () => {
    const result = FullPromptRefineSchema.safeParse({
      feedbackText: 'make it more emotional',
      styleChanges: undefined,
      lyricsMode: true,
    });
    expect(result.success).toBe(true);
  });

  test('passes with style changes only', () => {
    const result = FullPromptRefineSchema.safeParse({
      feedbackText: '',
      styleChanges: { seedGenres: ['rock'] },
      lyricsMode: true,
    });
    expect(result.success).toBe(true);
  });
});

describe('QuickVibesSubmitSchema', () => {
  test('fails when no input provided', () => {
    const result = QuickVibesSubmitSchema.safeParse({
      category: null,
      customDescription: '',
      sunoStyles: [],
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const issue = result.error.issues.find(i => i.path.includes('category'));
      expect(issue).toBeDefined();
    }
  });

  test('passes with category only', () => {
    const result = QuickVibesSubmitSchema.safeParse({
      category: 'lofi-study',
      customDescription: '',
      sunoStyles: [],
    });
    expect(result.success).toBe(true);
  });

  test('passes with any string category (backward compatible)', () => {
    // Submit schema uses z.string().nullable() for backward compatibility
    const result = QuickVibesSubmitSchema.safeParse({
      category: 'chill',  // Not a valid enum value, but submit doesn't care
      customDescription: '',
      sunoStyles: [],
    });
    expect(result.success).toBe(true);
  });

  test('passes with both category and suno styles (submit does not check mutual exclusivity)', () => {
    // Note: Submit validation only checks if there's at least one input.
    // Mutual exclusivity is enforced by GenerateQuickVibesSchema during generation.
    const result = QuickVibesSubmitSchema.safeParse({
      category: 'lofi-study',
      customDescription: '',
      sunoStyles: ['jazz'],
    });
    expect(result.success).toBe(true);
  });
});

describe('QuickVibesRefineSchema', () => {
  const original = {
    category: 'lofi-study' as const,
    customDescription: '',
    sunoStyles: [] as string[],
  };

  test('fails when nothing changed', () => {
    const result = QuickVibesRefineSchema.safeParse({
      category: 'lofi-study',
      customDescription: '',
      sunoStyles: [],
      original,
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const issue = result.error.issues.find(i => i.path.includes('customDescription'));
      expect(issue).toBeDefined();
      expect(issue?.message).toBe('Make changes to refine the prompt');
    }
  });

  test('passes when category changed', () => {
    const result = QuickVibesRefineSchema.safeParse({
      category: 'cafe-coffeeshop',
      customDescription: '',
      sunoStyles: [],
      original,
    });
    expect(result.success).toBe(true);
  });

  test('falls back to submit validation when no original', () => {
    const result = QuickVibesRefineSchema.safeParse({
      category: 'lofi-study',
      customDescription: '',
      sunoStyles: [],
      original: null,
    });
    expect(result.success).toBe(true);
  });
});

describe('CreativeBoostSubmitSchema', () => {
  test('fails when no input provided', () => {
    const result = CreativeBoostSubmitSchema.safeParse({
      description: '',
      lyricsTopic: '',
      lyricsMode: false,
      sunoStyles: [],
      seedGenres: [],
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const issue = result.error.issues.find(i => i.path.includes('description'));
      expect(issue).toBeDefined();
    }
  });

  test('passes with seed genres only', () => {
    const result = CreativeBoostSubmitSchema.safeParse({
      description: '',
      lyricsTopic: '',
      lyricsMode: false,
      sunoStyles: [],
      seedGenres: ['jazz'],
    });
    expect(result.success).toBe(true);
  });

  test('passes with both seed genres and suno styles (submit does not check mutual exclusivity)', () => {
    // Note: Submit validation only checks if there's at least one input.
    // Mutual exclusivity is enforced by GenerateCreativeBoostSchema during generation.
    const result = CreativeBoostSubmitSchema.safeParse({
      description: '',
      lyricsTopic: '',
      lyricsMode: false,
      sunoStyles: ['rock'],
      seedGenres: ['jazz'],
    });
    expect(result.success).toBe(true);
  });
});


