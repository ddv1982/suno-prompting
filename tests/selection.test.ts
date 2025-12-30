import { describe, it, expect } from 'bun:test';
import { z } from 'zod';
import { GENRE_REGISTRY } from '@bun/instruments/genres';

// Test the schema validation logic used in selection.ts
const ALL_GENRES = Object.keys(GENRE_REGISTRY) as [string, ...string[]];

const LLMResponseSchema = z.object({
  genre: z.enum(ALL_GENRES).nullable().optional(),
  combination: z.string().nullable().optional(),
  singleMode: z.string().nullable().optional(),
  polyrhythmCombination: z.string().nullable().optional(),
  reasoning: z.string().optional(),
});

describe('selection', () => {
  describe('LLMResponseSchema', () => {
    it('accepts valid genre', () => {
      const result = LLMResponseSchema.parse({
        genre: 'jazz',
        reasoning: 'test',
      });
      expect(result.genre).toBe('jazz');
    });

    it('accepts null genre', () => {
      const result = LLMResponseSchema.parse({
        genre: null,
        reasoning: 'test',
      });
      expect(result.genre).toBeNull();
    });

    it('accepts undefined genre', () => {
      const result = LLMResponseSchema.parse({
        reasoning: 'test',
      });
      expect(result.genre).toBeUndefined();
    });

    it('rejects invalid genre', () => {
      expect(() => LLMResponseSchema.parse({
        genre: 'invalid_genre',
      })).toThrow();
    });

    it('accepts valid combination', () => {
      const result = LLMResponseSchema.parse({
        combination: 'major_minor',
        reasoning: 'test',
      });
      expect(result.combination).toBe('major_minor');
    });

    it('accepts valid singleMode', () => {
      const result = LLMResponseSchema.parse({
        singleMode: 'lydian',
        reasoning: 'test',
      });
      expect(result.singleMode).toBe('lydian');
    });

    it('accepts valid polyrhythmCombination', () => {
      const result = LLMResponseSchema.parse({
        polyrhythmCombination: 'complexity_build',
        reasoning: 'test',
      });
      expect(result.polyrhythmCombination).toBe('complexity_build');
    });

    it('accepts full response with all fields', () => {
      const result = LLMResponseSchema.parse({
        genre: 'rock',
        combination: 'major_minor',
        singleMode: null,
        polyrhythmCombination: 'tension_arc',
        reasoning: 'Full test response',
      });
      expect(result.genre).toBe('rock');
      expect(result.combination).toBe('major_minor');
      expect(result.singleMode).toBeNull();
      expect(result.polyrhythmCombination).toBe('tension_arc');
    });
  });

  describe('ModeSelection type structure', () => {
    it('all genres in registry are valid for schema', () => {
      for (const genre of Object.keys(GENRE_REGISTRY)) {
        const result = LLMResponseSchema.parse({ genre });
        expect(result.genre).toBe(genre);
      }
    });

    it('has expected genre count', () => {
      expect(Object.keys(GENRE_REGISTRY).length).toBeGreaterThanOrEqual(20);
    });
  });

  describe('GENRE_REGISTRY integration', () => {
    it('jazz is a valid genre', () => {
      expect(GENRE_REGISTRY.jazz).toBeDefined();
      expect(GENRE_REGISTRY.jazz.name).toBe('Jazz');
    });

    it('rock is a valid genre', () => {
      expect(GENRE_REGISTRY.rock).toBeDefined();
      expect(GENRE_REGISTRY.rock.name).toBe('Rock');
    });

    it('electronic is a valid genre', () => {
      expect(GENRE_REGISTRY.electronic).toBeDefined();
      expect(GENRE_REGISTRY.electronic.name).toBe('Electronic');
    });

    it('all genres have required fields', () => {
      for (const [, genre] of Object.entries(GENRE_REGISTRY)) {
        expect(genre.name).toBeDefined();
        expect(genre.keywords).toBeDefined();
        expect(Array.isArray(genre.keywords)).toBe(true);
        // pools is optional, but if present should be an object
        if (genre.pools) {
          expect(typeof genre.pools).toBe('object');
        }
      }
    });

    it('all genres have BPM info', () => {
      for (const [, genre] of Object.entries(GENRE_REGISTRY)) {
        if (genre.bpm) {
          expect(genre.bpm.min).toBeDefined();
          expect(genre.bpm.max).toBeDefined();
          expect(genre.bpm.typical).toBeDefined();
          expect(genre.bpm.min).toBeLessThanOrEqual(genre.bpm.typical);
          expect(genre.bpm.typical).toBeLessThanOrEqual(genre.bpm.max);
        }
      }
    });
  });
});
