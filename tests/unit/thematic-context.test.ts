import { test, expect, describe, mock, afterEach } from 'bun:test';

import { extractThematicContext } from '@bun/ai/thematic-context';
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
    test('rejects themes with only 2 elements', () => {
      const invalid = {
        themes: ['alien', 'bioluminescent'], // Only 2
        moods: ['wondrous', 'curious'],
        scene: 'first steps into an alien jungle',
      };

      const result = ThematicContextSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });

    test('rejects themes with 4 elements', () => {
      const invalid = {
        themes: ['alien', 'bioluminescent', 'discovery', 'exploration'], // 4 elements
        moods: ['wondrous', 'curious'],
        scene: 'first steps into an alien jungle',
      };

      const result = ThematicContextSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });

    test('rejects themes with 1 element', () => {
      const invalid = {
        themes: ['alien'], // Only 1
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

      // Mock the AI module by importing dynamically
      void mock.module('ai', () => ({
        generateText: () => Promise.resolve({ text: validResponse }),
      }));

      // Re-import to get mocked version
      const { extractThematicContext: extract } = await import('@bun/ai/thematic-context');

      const result = await extract({
        description: 'exploring an alien jungle with bioluminescent plants',
        getModel: createMockGetModel(),
        
      });

      expect(result).not.toBeNull();
      expect(result?.themes).toEqual(['alien', 'bioluminescent', 'discovery']);
      expect(result?.moods).toEqual(['wondrous', 'curious']);
      expect(result?.scene).toBe('first steps into an alien jungle');
    });

    test('returns null on malformed JSON (not valid JSON)', async () => {
      void mock.module('ai', () => ({
        generateText: () => Promise.resolve({ text: 'this is not json' }),
      }));

      const { extractThematicContext: extract } = await import('@bun/ai/thematic-context');

      const result = await extract({
        description: 'exploring an alien jungle with bioluminescent plants',
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

      void mock.module('ai', () => ({
        generateText: () => Promise.resolve({ text: invalidResponse }),
      }));

      const { extractThematicContext: extract } = await import('@bun/ai/thematic-context');

      const result = await extract({
        description: 'exploring an alien jungle with bioluminescent plants',
        getModel: createMockGetModel(),
        
      });

      expect(result).toBeNull();
    });

    test('returns null on valid JSON but wrong themes count', async () => {
      const invalidResponse = JSON.stringify({
        themes: ['alien', 'bioluminescent'], // Only 2, needs exactly 3
        moods: ['wondrous', 'curious'],
        scene: 'first steps into an alien jungle',
      });

      void mock.module('ai', () => ({
        generateText: () => Promise.resolve({ text: invalidResponse }),
      }));

      const { extractThematicContext: extract } = await import('@bun/ai/thematic-context');

      const result = await extract({
        description: 'exploring an alien jungle with bioluminescent plants',
        getModel: createMockGetModel(),
        
      });

      expect(result).toBeNull();
    });
  });

  describe('error handling', () => {
    test('returns null on timeout', async () => {
      void mock.module('ai', () => ({
        generateText: () => Promise.reject(new Error('Timeout: AbortError')),
      }));

      const { extractThematicContext: extract } = await import('@bun/ai/thematic-context');

      const result = await extract({
        description: 'exploring an alien jungle with bioluminescent plants',
        getModel: createMockGetModel(),
        
      });

      expect(result).toBeNull();
    });

    test('returns null on LLM unavailable error', async () => {
      void mock.module('ai', () => ({
        generateText: () => Promise.reject(new Error('API key not configured')),
      }));

      const { extractThematicContext: extract } = await import('@bun/ai/thematic-context');

      const result = await extract({
        description: 'exploring an alien jungle with bioluminescent plants',
        getModel: createMockGetModel(),
        
      });

      expect(result).toBeNull();
    });

    test('returns null on network error', async () => {
      void mock.module('ai', () => ({
        generateText: () => Promise.reject(new Error('Network error: ECONNREFUSED')),
      }));

      const { extractThematicContext: extract } = await import('@bun/ai/thematic-context');

      const result = await extract({
        description: 'exploring an alien jungle with bioluminescent plants',
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

      void mock.module('ai', () => ({
        generateText: () => Promise.resolve({ text: validResponse }),
      }));

      const { extractThematicContext: extract } = await import('@bun/ai/thematic-context');

      const result = await extract({
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

      void mock.module('ai', () => ({
        generateText: () => Promise.resolve({ text: validResponse }),
      }));

      const { extractThematicContext: extract } = await import('@bun/ai/thematic-context');

      const result = await extract({
        description: 'exploring an alien jungle with bioluminescent plants',
        getModel: createMockGetModel(),
        
      });

      expect(result).not.toBeNull();
      expect(result?.themes).toEqual(['alien', 'bioluminescent', 'discovery']);
    });

    test('handles JSON with markdown code fence (should fail)', async () => {
      const responseWithMarkdown = '```json\n{"themes":["a","b","c"],"moods":["x","y"],"scene":"short scene"}\n```';

      void mock.module('ai', () => ({
        generateText: () => Promise.resolve({ text: responseWithMarkdown }),
      }));

      const { extractThematicContext: extract } = await import('@bun/ai/thematic-context');

      const result = await extract({
        description: 'exploring an alien jungle with bioluminescent plants',
        getModel: createMockGetModel(),
        
      });

      // JSON.parse will fail on markdown-wrapped JSON
      expect(result).toBeNull();
    });
  });
});
