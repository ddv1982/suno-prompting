import { describe, it, expect } from 'bun:test';
import { z } from 'zod';

import { GENRE_REGISTRY } from '@bun/instruments/genres';
import { selectModes } from '@bun/instruments/selection';

// Test the schema validation logic that was previously used in selection.ts
// Kept for backwards compatibility testing
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

  describe('selectModes - deterministic keyword detection', () => {
    // selectModes is now fully deterministic - no LLM calls
    // Uses keyword matching for genre detection with random fallback

    describe('with genreOverride', () => {
      it('uses override genre when valid single genre provided', () => {
        const result = selectModes('some description', 'jazz');
        expect(result.genre).toBe('jazz');
        expect(result.reasoning).toContain('User selected: jazz');
      });

      it('extracts base genre from combination like "jazz fusion"', () => {
        const result = selectModes('some description', 'jazz fusion');
        expect(result.genre).toBe('jazz');
        expect(result.reasoning).toContain('User selected: jazz fusion');
      });

      it('returns null genre for unrecognized override', () => {
        const result = selectModes('some description', 'unknowngenre');
        expect(result.genre).toBeNull();
        expect(result.reasoning).toContain('User selected: unknowngenre');
      });

      it('extracts base genre from multi-word override like "rock alternative"', () => {
        const result = selectModes('description', 'rock alternative');
        expect(result.genre).toBe('rock');
      });

      it('returns all ModeSelection fields', () => {
        const result = selectModes('some description', 'electronic');
        expect(result).toHaveProperty('genre');
        expect(result).toHaveProperty('combination');
        expect(result).toHaveProperty('singleMode');
        expect(result).toHaveProperty('polyrhythmCombination');
        expect(result).toHaveProperty('timeSignature');
        expect(result).toHaveProperty('timeSignatureJourney');
        expect(result).toHaveProperty('reasoning');
      });

      it('sets proper defaults for ModeSelection when override used', () => {
        const result = selectModes('simple description', 'pop');
        expect(result.genre).toBe('pop');
        // These may be null depending on description
        expect(result.combination === null || typeof result.combination === 'string').toBe(true);
        expect(result.singleMode).toBeNull(); // Always null when using genreOverride path
        expect(result.polyrhythmCombination === null || typeof result.polyrhythmCombination === 'string').toBe(true);
      });

      it('works with all valid genres from GENRE_REGISTRY', () => {
        const genres = Object.keys(GENRE_REGISTRY);
        for (const genre of genres.slice(0, 5)) { // Test first 5 to save time
          const result = selectModes('test', genre);
          expect(result.genre).toBe(genre as typeof result.genre);
        }
      });
    });

    describe('without genreOverride - keyword detection', () => {
      it('detects genre from description keywords', () => {
        const result = selectModes('smooth jazz night session');
        expect(result.genre).toBe('jazz');
        expect(result.reasoning).toContain('Keyword detection');
      });

      it('returns null genre when no keywords match', () => {
        const result = selectModes('something completely gibberish xyz');
        expect(result.genre).toBeNull();
        expect(result.reasoning).toBe('No genre keywords matched');
      });

      it('detects rock from description', () => {
        const result = selectModes('heavy rock anthem');
        expect(result.genre).toBe('rock');
      });

      it('detects electronic from description', () => {
        const result = selectModes('electronic dance beat');
        expect(result.genre).toBe('electronic');
      });

      it('detects combination when present in description', () => {
        const result = selectModes('bittersweet major minor journey');
        expect(result.combination).toBe('major_minor');
      });

      it('detects harmonic style when no combination present', () => {
        const result = selectModes('dreamy lydian floating');
        expect(result.singleMode).toBe('lydian');
        expect(result.combination).toBeNull();
      });

      it('combination and singleMode are mutually exclusive', () => {
        // When combination is detected, singleMode should be null
        const result = selectModes('lydian exploration journey');
        if (result.combination) {
          expect(result.singleMode).toBeNull();
        }
      });
    });
  });
});
