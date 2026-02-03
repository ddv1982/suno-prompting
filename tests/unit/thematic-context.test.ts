import { test, expect, describe, mock, beforeEach, afterEach } from 'bun:test';

import { ThematicContextSchema } from '@shared/schemas/thematic-context';

import type { LanguageModel } from 'ai';

describe('ThematicContextSchema', () => {
  describe('valid inputs', () => {
    test('accepts valid thematic context with 3 themes and 2 moods', () => {
      const valid = {
        themes: ['alien', 'bioluminescent', 'discovery'],
        moods: ['wondrous', 'curious'],
        scene: 'first steps into an alien jungle',
      };

      const result = ThematicContextSchema.safeParse(valid);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.themes).toEqual(['alien', 'bioluminescent', 'discovery']);
        expect(result.data.moods).toEqual(['wondrous', 'curious']);
        expect(result.data.scene).toBe('first steps into an alien jungle');
      }
    });

    test('accepts valid thematic context with 3 themes and 3 moods', () => {
      const valid = {
        themes: ['love', 'heartbreak', 'memory'],
        moods: ['melancholic', 'nostalgic', 'bittersweet'],
        scene: 'rainy evening watching old photographs',
      };

      const result = ThematicContextSchema.safeParse(valid);
      expect(result.success).toBe(true);
    });

    test('accepts scene at minimum length (10 chars)', () => {
      const valid = {
        themes: ['word', 'another', 'third'],
        moods: ['happy', 'joyful'],
        scene: 'short scen', // exactly 10 chars
      };

      const result = ThematicContextSchema.safeParse(valid);
      expect(result.success).toBe(true);
    });

    test('accepts scene at maximum length (100 chars)', () => {
      const valid = {
        themes: ['word', 'another', 'third'],
        moods: ['happy', 'joyful'],
        scene: 'a'.repeat(100), // exactly 100 chars
      };

      const result = ThematicContextSchema.safeParse(valid);
      expect(result.success).toBe(true);
    });
  });

  describe('themes validation', () => {
    test('accepts themes with 1 element (min allowed)', () => {
      const valid = {
        themes: ['alien'], // 1 is allowed, will be normalized to 3
        moods: ['wondrous', 'curious'],
        scene: 'first steps into an alien jungle',
      };

      const result = ThematicContextSchema.safeParse(valid);
      expect(result.success).toBe(true);
    });

    test('accepts themes with 2 elements', () => {
      const valid = {
        themes: ['alien', 'bioluminescent'], // 2 is allowed, will be normalized to 3
        moods: ['wondrous', 'curious'],
        scene: 'first steps into an alien jungle',
      };

      const result = ThematicContextSchema.safeParse(valid);
      expect(result.success).toBe(true);
    });

    test('accepts themes with 4 elements', () => {
      const valid = {
        themes: ['alien', 'bioluminescent', 'discovery', 'exploration'], // 4 is allowed, will be normalized to 3
        moods: ['wondrous', 'curious'],
        scene: 'first steps into an alien jungle',
      };

      const result = ThematicContextSchema.safeParse(valid);
      expect(result.success).toBe(true);
    });

    test('accepts themes with 5 elements (max allowed)', () => {
      const valid = {
        themes: ['a', 'b', 'c', 'd', 'e'], // 5 is max allowed
        moods: ['wondrous', 'curious'],
        scene: 'first steps into an alien jungle',
      };

      const result = ThematicContextSchema.safeParse(valid);
      expect(result.success).toBe(true);
    });

    test('rejects themes with 6 elements (over max)', () => {
      const invalid = {
        themes: ['a', 'b', 'c', 'd', 'e', 'f'], // 6 is over max
        moods: ['wondrous', 'curious'],
        scene: 'first steps into an alien jungle',
      };

      const result = ThematicContextSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });

    test('rejects empty themes array', () => {
      const invalid = {
        themes: [],
        moods: ['wondrous', 'curious'],
        scene: 'first steps into an alien jungle',
      };

      const result = ThematicContextSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });

    test('rejects missing themes field', () => {
      const invalid = {
        moods: ['wondrous', 'curious'],
        scene: 'first steps into an alien jungle',
      };

      const result = ThematicContextSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });
  });

  describe('moods validation', () => {
    test('rejects too few moods (less than 2)', () => {
      const invalid = {
        themes: ['alien', 'bioluminescent', 'discovery'],
        moods: ['wondrous'], // Only 1
        scene: 'first steps into an alien jungle',
      };

      const result = ThematicContextSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });

    test('rejects too many moods (more than 3)', () => {
      const invalid = {
        themes: ['alien', 'bioluminescent', 'discovery'],
        moods: ['wondrous', 'curious', 'awestruck', 'amazed'], // 4 moods
        scene: 'first steps into an alien jungle',
      };

      const result = ThematicContextSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });

    test('rejects empty moods array', () => {
      const invalid = {
        themes: ['alien', 'bioluminescent', 'discovery'],
        moods: [],
        scene: 'first steps into an alien jungle',
      };

      const result = ThematicContextSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });

    test('rejects missing moods field', () => {
      const invalid = {
        themes: ['alien', 'bioluminescent', 'discovery'],
        scene: 'first steps into an alien jungle',
      };

      const result = ThematicContextSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });
  });

  describe('scene validation', () => {
    test('rejects scene too short (less than 10 chars)', () => {
      const invalid = {
        themes: ['alien', 'bioluminescent', 'discovery'],
        moods: ['wondrous', 'curious'],
        scene: 'too short', // 9 chars
      };

      const result = ThematicContextSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });

    test('rejects scene too long (more than 100 chars)', () => {
      const invalid = {
        themes: ['alien', 'bioluminescent', 'discovery'],
        moods: ['wondrous', 'curious'],
        scene: 'a'.repeat(101), // 101 chars
      };

      const result = ThematicContextSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });

    test('rejects empty scene string', () => {
      const invalid = {
        themes: ['alien', 'bioluminescent', 'discovery'],
        moods: ['wondrous', 'curious'],
        scene: '',
      };

      const result = ThematicContextSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });

    test('rejects missing scene field', () => {
      const invalid = {
        themes: ['alien', 'bioluminescent', 'discovery'],
        moods: ['wondrous', 'curious'],
      };

      const result = ThematicContextSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });
  });

  describe('type safety', () => {
    test('rejects non-string theme elements', () => {
      const invalid = {
        themes: ['alien', 123, 'discovery'],
        moods: ['wondrous', 'curious'],
        scene: 'first steps into an alien jungle',
      };

      const result = ThematicContextSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });

    test('rejects non-string mood elements', () => {
      const invalid = {
        themes: ['alien', 'bioluminescent', 'discovery'],
        moods: ['wondrous', null],
        scene: 'first steps into an alien jungle',
      };

      const result = ThematicContextSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });

    test('rejects non-string scene', () => {
      const invalid = {
        themes: ['alien', 'bioluminescent', 'discovery'],
        moods: ['wondrous', 'curious'],
        scene: 12345,
      };

      const result = ThematicContextSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });
  });
});

describe('extractThematicContext', () => {
  let extractThematicContext: typeof import('@bun/ai/thematic-context').extractThematicContext;
  let clearThematicCache: typeof import('@bun/ai/thematic-context').clearThematicCache;
  let mockGenerateText: ReturnType<typeof mock>;

  beforeEach(async () => {
    mockGenerateText = mock(() => {
      throw new Error('Unexpected generateText call');
    });

    await mock.module('ai', () => ({
      generateText: mockGenerateText,
    }));

    ({ extractThematicContext, clearThematicCache } = await import('@bun/ai/thematic-context'));
    clearThematicCache();
  });

  afterEach(() => {
    mock.restore();
  });

  /** Creates a mock LanguageModel for testing */
  function createMockModel(): LanguageModel {
    return {
      provider: 'test',
      modelId: 'test-model',
    } as unknown as LanguageModel;
  }

  /** Creates a mock getModel function */
  function createMockGetModel(): () => LanguageModel {
    return () => createMockModel();
  }

  describe('description validation', () => {
    test('returns null for empty description', async () => {
      const result = await extractThematicContext({
        description: '',
        getModel: createMockGetModel(),
      });

      expect(result).toBeNull();
    });

    test('returns null for whitespace-only description', async () => {
      const result = await extractThematicContext({
        description: '   \n\t   ',
        getModel: createMockGetModel(),
      });

      expect(result).toBeNull();
    });

    test('returns null for short description (less than 10 chars)', async () => {
      const result = await extractThematicContext({
        description: 'too short', // 9 chars
        getModel: createMockGetModel(),
      });

      expect(result).toBeNull();
    });

    test('returns null for description at boundary (exactly 9 chars)', async () => {
      const result = await extractThematicContext({
        description: 'exactly 9', // 9 chars
        getModel: createMockGetModel(),
      });

      expect(result).toBeNull();
    });
  });

  describe('JSON response parsing', () => {
    test('correctly parses valid JSON response', async () => {
      const validResponse = JSON.stringify({
        themes: ['alien', 'bioluminescent', 'discovery'],
        moods: ['wondrous', 'curious'],
        scene: 'first steps into an alien jungle',
      });

      mockGenerateText.mockResolvedValueOnce({ text: validResponse });

      const result = await extractThematicContext({
        description: 'exploring an alien jungle with bioluminescent plants',
        getModel: createMockGetModel(),
      });

      expect(result).not.toBeNull();
      expect(result?.themes).toEqual(['alien', 'bioluminescent', 'discovery']);
      expect(result?.moods).toEqual(['wondrous', 'curious']);
      expect(result?.scene).toBe('first steps into an alien jungle');
    });

    test('returns null on malformed JSON (not valid JSON)', async () => {
      mockGenerateText.mockResolvedValueOnce({ text: 'this is not json' });

      const result = await extractThematicContext({
        description: 'malformed json test description here',
        getModel: createMockGetModel(),
      });

      expect(result).toBeNull();
    });

    test('returns null on valid JSON but invalid schema (missing field)', async () => {
      const invalidResponse = JSON.stringify({
        themes: ['alien', 'bioluminescent', 'discovery'],
        moods: ['wondrous', 'curious'],
        // Missing 'scene' field
      });

      mockGenerateText.mockResolvedValueOnce({ text: invalidResponse });

      const result = await extractThematicContext({
        description: 'missing field test description here',
        getModel: createMockGetModel(),
      });

      expect(result).toBeNull();
    });

    test('accepts valid JSON with 2 themes (normalized to 3)', async () => {
      const validResponse = JSON.stringify({
        themes: ['alien', 'bioluminescent'], // 2 is now allowed
        moods: ['wondrous', 'curious'],
        scene: 'first steps into an alien jungle',
      });

      mockGenerateText.mockResolvedValueOnce({ text: validResponse });

      const result = await extractThematicContext({
        description: 'two themes test description here',
        getModel: createMockGetModel(),
      });

      // 2 themes is now valid, normalized to 3
      expect(result).not.toBeNull();
      expect(result?.themes).toEqual(['alien', 'bioluminescent', 'alien']);
    });
  });

  describe('error handling', () => {
    test('returns null on timeout', async () => {
      mockGenerateText.mockRejectedValueOnce(new Error('Timeout: AbortError'));

      const result = await extractThematicContext({
        description: 'timeout test description here',
        getModel: createMockGetModel(),
      });

      expect(result).toBeNull();
    });

    test('returns null on LLM unavailable error', async () => {
      mockGenerateText.mockRejectedValueOnce(new Error('API key not configured'));

      const result = await extractThematicContext({
        description: 'llm unavailable test description',
        getModel: createMockGetModel(),
      });

      expect(result).toBeNull();
    });

    test('returns null on network error', async () => {
      mockGenerateText.mockRejectedValueOnce(new Error('Network error: ECONNREFUSED'));

      const result = await extractThematicContext({
        description: 'network error test description',
        getModel: createMockGetModel(),
      });

      expect(result).toBeNull();
    });
  });

  describe('edge cases', () => {
    test('handles description with exactly 10 characters', async () => {
      const validResponse = JSON.stringify({
        themes: ['word', 'another', 'third'],
        moods: ['happy', 'joyful'],
        scene: 'a short scene here',
      });

      mockGenerateText.mockResolvedValueOnce({ text: validResponse });

      const result = await extractThematicContext({
        description: '10 chars!x', // exactly 10 chars
        getModel: createMockGetModel(),
      });

      // Should attempt extraction (not be skipped)
      expect(result).not.toBeNull();
    });

    test('trims whitespace from description before length check', async () => {
      const result = await extractThematicContext({
        description: '   short   ', // 5 chars after trim
        getModel: createMockGetModel(),
      });

      expect(result).toBeNull();
    });

    test('handles JSON with extra whitespace', async () => {
      const validResponse = `
        {
          "themes": ["alien", "bioluminescent", "discovery"],
          "moods": ["wondrous", "curious"],
          "scene": "first steps into an alien jungle"
        }
      `;

      mockGenerateText.mockResolvedValueOnce({ text: validResponse });

      const result = await extractThematicContext({
        description: 'exploring an alien jungle with bioluminescent plants',
        getModel: createMockGetModel(),
      });

      expect(result).not.toBeNull();
      expect(result?.themes).toEqual(['alien', 'bioluminescent', 'discovery']);
    });

    test('handles JSON with markdown code fence (should now work)', async () => {
      const responseWithMarkdown = '```json\n{"themes":["a","b","c"],"moods":["x","y"],"scene":"short scene here"}\n```';

      mockGenerateText.mockResolvedValueOnce({ text: responseWithMarkdown });

      const result = await extractThematicContext({
        description: 'exploring an alien jungle with bioluminescent plants',
        getModel: createMockGetModel(),
      });

      // Markdown fence is now stripped before parsing
      expect(result).not.toBeNull();
      expect(result?.themes).toEqual(['a', 'b', 'c']);
    });
  });

  describe('caching', () => {
    test('returns cached result for same description', async () => {
      let callCount = 0;
      const validResponse = JSON.stringify({
        themes: ['alien', 'bioluminescent', 'discovery'],
        moods: ['wondrous', 'curious'],
        scene: 'first steps into an alien jungle',
      });

      mockGenerateText.mockImplementation(() => {
        callCount++;
        return Promise.resolve({ text: validResponse });
      });

      const result1 = await extractThematicContext({
        description: 'exploring an alien jungle',
        getModel: createMockGetModel(),
      });

      const result2 = await extractThematicContext({
        description: 'exploring an alien jungle',
        getModel: createMockGetModel(),
      });

      expect(result1).toEqual(result2);
      expect(callCount).toBe(1); // Only one LLM call
    });

    test('cache is case-insensitive', async () => {
      let callCount = 0;
      const validResponse = JSON.stringify({
        themes: ['alien', 'bioluminescent', 'discovery'],
        moods: ['wondrous', 'curious'],
        scene: 'first steps into an alien jungle',
      });

      mockGenerateText.mockImplementation(() => {
        callCount++;
        return Promise.resolve({ text: validResponse });
      });

      await extractThematicContext({
        description: 'Exploring An Alien Jungle',
        getModel: createMockGetModel(),
      });

      await extractThematicContext({
        description: 'exploring an alien jungle',
        getModel: createMockGetModel(),
      });

      expect(callCount).toBe(1); // Only one LLM call due to case-insensitive cache
    });
  });

  describe('theme normalization', () => {
    test('normalizes 1 theme to 3 by repeating', async () => {
      const response = JSON.stringify({
        themes: ['alien'],
        moods: ['wondrous', 'curious'],
        scene: 'first steps into an alien jungle',
      });

      mockGenerateText.mockResolvedValueOnce({ text: response });

      const result = await extractThematicContext({
        description: 'exploring an alien jungle with many plants',
        getModel: createMockGetModel(),
      });

      expect(result?.themes).toEqual(['alien', 'alien', 'alien']);
    });

    test('normalizes 2 themes to 3 by repeating first', async () => {
      const response = JSON.stringify({
        themes: ['alien', 'jungle'],
        moods: ['wondrous', 'curious'],
        scene: 'first steps into an alien jungle',
      });

      mockGenerateText.mockResolvedValueOnce({ text: response });

      const result = await extractThematicContext({
        description: 'exploring alien jungles with plants',
        getModel: createMockGetModel(),
      });

      expect(result?.themes).toEqual(['alien', 'jungle', 'alien']);
    });

    test('takes first 3 themes when 4 provided', async () => {
      const response = JSON.stringify({
        themes: ['a', 'b', 'c', 'd'],
        moods: ['wondrous', 'curious'],
        scene: 'first steps into an alien jungle',
      });

      mockGenerateText.mockResolvedValueOnce({ text: response });

      const result = await extractThematicContext({
        description: 'exploring alien jungles with lots of plants',
        getModel: createMockGetModel(),
      });

      expect(result?.themes).toEqual(['a', 'b', 'c']);
    });
  });
});
