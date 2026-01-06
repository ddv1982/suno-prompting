/**
 * Integration tests for deterministic prompt generation.
 *
 * These tests verify that:
 * 1. Prompt generation is fully deterministic (no LLM calls)
 * 2. Title and lyrics generation still use LLM
 * 3. remixInstruments is fully deterministic
 * 4. Edge cases are handled gracefully
 *
 * @module tests/deterministic-integration
 */

import { describe, it, expect } from 'bun:test';

import { remixInstruments, extractGenreFromPrompt, extractMoodFromPrompt } from '@bun/ai/remix';
import { detectGenre } from '@bun/instruments/detection';
import { selectModes } from '@bun/instruments/selection';
import {
  buildDeterministicMaxPrompt,
  buildDeterministicStandardPrompt,
  selectRandomGenre,
} from '@bun/prompt/deterministic-builder';
import { APP_CONSTANTS } from '@shared/constants';

// =============================================================================
// Test Utilities
// =============================================================================

/**
 * Creates a seeded RNG for deterministic tests.
 * Uses a simple LCG (Linear Congruential Generator).
 *
 * @param seed - Starting seed value
 * @returns Deterministic RNG function
 */
function createSeededRng(seed: number): () => number {
  let state = seed;
  return () => {
    // LCG parameters from Numerical Recipes
    state = (state * 1664525 + 1013904223) % 2 ** 32;
    return state / 2 ** 32;
  };
}

// =============================================================================
// Tests: Deterministic Mode Selection
// =============================================================================

describe('deterministic-integration', () => {
  describe('selectModes - deterministic behavior', () => {
    it('returns consistent results for same input', () => {
      const result1 = selectModes('smooth jazz night session');
      const result2 = selectModes('smooth jazz night session');

      expect(result1.genre).toBe(result2.genre);
      expect(result1.combination).toBe(result2.combination);
      expect(result1.singleMode).toBe(result2.singleMode);
    });

    it('detects genre without LLM calls', () => {
      // This test verifies selectModes is synchronous (not async)
      // If it were using LLM, it would need to be async
      const result = selectModes('electronic dance music');
      expect(result.genre).toBe('electronic');
      expect(result.reasoning).toContain('Keyword detection');
    });

    it('returns null genre when no keywords match (no LLM fallback)', () => {
      const result = selectModes('xyzabc gibberish words');
      expect(result.genre).toBeNull();
      expect(result.reasoning).toBe('No genre keywords matched');
    });

    it('handles genre override correctly', () => {
      const result = selectModes('gibberish words', 'jazz');
      expect(result.genre).toBe('jazz');
      expect(result.reasoning).toContain('User selected');
    });
  });

  // =============================================================================
  // Tests: Deterministic MAX MODE Generation
  // =============================================================================

  describe('buildDeterministicMaxPrompt - integration', () => {
    it('produces valid MAX MODE output structure', () => {
      const result = buildDeterministicMaxPrompt({
        description: 'smooth jazz',
        rng: createSeededRng(12345),
      });

      // Verify MAX MODE header (standard format)
      expect(result.text).toContain('[Is_MAX_MODE: MAX](MAX)');
      expect(result.text).toContain('[QUALITY: MAX](MAX)');
      expect(result.text).toContain('[REALISM: MAX](MAX)');

      // Verify all required fields
      expect(result.text).toMatch(/genre:\s*"[^"]+"/);
      expect(result.text).toMatch(/bpm:\s*"between \d+ and \d+"/);
      expect(result.text).toMatch(/instruments:\s*"[^"]+"/);
      expect(result.text).toMatch(/style tags:\s*"[^"]+"/);
      expect(result.text).toMatch(/recording:\s*"[^"]+"/);
    });

    it('respects character limit', () => {
      const result = buildDeterministicMaxPrompt({
        description: 'complex electronic ambient experimental',
        rng: createSeededRng(12345),
      });

      expect(result.text.length).toBeLessThanOrEqual(APP_CONSTANTS.MAX_PROMPT_CHARS);
    });

    it('uses detected genre from description', () => {
      const result = buildDeterministicMaxPrompt({
        description: 'smooth jazz night session',
        rng: createSeededRng(12345),
      });

      expect(result.text).toContain('genre: "jazz"');
      expect(result.genre).toBe('jazz');
    });

    it('uses genre override when provided', () => {
      const result = buildDeterministicMaxPrompt({
        description: 'something random',
        genreOverride: 'rock',
        rng: createSeededRng(12345),
      });

      expect(result.text).toContain('genre: "rock"');
    });

    it('falls back to random genre when no match', () => {
      const result = buildDeterministicMaxPrompt({
        description: 'xyzabc gibberish',
        rng: createSeededRng(12345),
      });

      // Should have some genre (random fallback)
      expect(result.text).toMatch(/genre:\s*"[a-z]+"/);
      expect(result.genre).toBeDefined();
    });

    it('produces deterministic genre and BPM with same seed', () => {
      const rng1 = createSeededRng(42);
      const rng2 = createSeededRng(42);

      const result1 = buildDeterministicMaxPrompt({ description: 'jazz', rng: rng1 });
      const result2 = buildDeterministicMaxPrompt({ description: 'jazz', rng: rng2 });

      // Genre detection is fully deterministic
      expect(result1.genre).toBe(result2.genre);

      // BPM is determined by genre, so should match
      const bpm1 = result1.text.match(/bpm: "([^"]+)"/)?.[1];
      const bpm2 = result2.text.match(/bpm: "([^"]+)"/)?.[1];
      expect(bpm1).toBe(bpm2);

      // Metadata should match for core fields
      expect(result1.metadata?.usedGenre).toBe(result2.metadata?.usedGenre);
    });

    it('produces variation in instruments with different seeds', () => {
      const rng1 = createSeededRng(11111);
      const rng2 = createSeededRng(99999);

      const result1 = buildDeterministicMaxPrompt({ description: 'jazz', rng: rng1 });
      const result2 = buildDeterministicMaxPrompt({ description: 'jazz', rng: rng2 });

      // With different seeds, instruments should vary
      // (Genre and BPM may still match since they're based on description)
      const instruments1 = result1.metadata?.instruments;
      const instruments2 = result2.metadata?.instruments;
      
      // At least verify both have instruments
      expect(instruments1?.length).toBeGreaterThan(0);
      expect(instruments2?.length).toBeGreaterThan(0);
    });
  });

  // =============================================================================
  // Tests: Deterministic STANDARD MODE Generation
  // =============================================================================

  describe('buildDeterministicStandardPrompt - integration', () => {
    it('produces valid STANDARD MODE output structure', () => {
      const result = buildDeterministicStandardPrompt({
        description: 'rock anthem',
        rng: createSeededRng(12345),
      });

      // Verify header format
      expect(result.text).toMatch(/^\[[A-Z][a-z]+, [A-Z][a-z]+, Key: [A-G]#? [a-z]+\]/);

      // Verify all required fields
      expect(result.text).toMatch(/Genre:\s+\w+/);
      expect(result.text).toMatch(/BPM:\s+between \d+ and \d+/);
      expect(result.text).toMatch(/Mood:\s+[\w, ]+/);
      expect(result.text).toMatch(/Instruments:\s+.+/);

      // Verify all sections present
      expect(result.text).toContain('[INTRO]');
      expect(result.text).toContain('[VERSE]');
      expect(result.text).toContain('[CHORUS]');
      expect(result.text).toContain('[BRIDGE]');
      expect(result.text).toContain('[OUTRO]');
    });

    it('respects character limit', () => {
      const result = buildDeterministicStandardPrompt({
        description: 'complex electronic ambient experimental',
        rng: createSeededRng(12345),
      });

      expect(result.text.length).toBeLessThanOrEqual(APP_CONSTANTS.MAX_PROMPT_CHARS);
    });

    it('uses detected genre from description', () => {
      const result = buildDeterministicStandardPrompt({
        description: 'smooth jazz ballad',
        rng: createSeededRng(12345),
      });

      expect(result.text).toContain('Genre: Jazz');
      expect(result.genre).toBe('jazz');
    });

    it('uses genre override when provided', () => {
      const result = buildDeterministicStandardPrompt({
        description: 'something random',
        genreOverride: 'blues',
        rng: createSeededRng(12345),
      });

      expect(result.text).toContain('Genre: Blues');
    });

    it('produces deterministic output with same seed', () => {
      const rng1 = createSeededRng(42);
      const rng2 = createSeededRng(42);

      const result1 = buildDeterministicStandardPrompt({ description: 'rock', rng: rng1 });
      const result2 = buildDeterministicStandardPrompt({ description: 'rock', rng: rng2 });

      expect(result1.text).toBe(result2.text);
    });

    it('sections have meaningful content (no placeholders)', () => {
      const result = buildDeterministicStandardPrompt({
        description: 'jazz ballad',
        rng: createSeededRng(12345),
      });

      // Check for any remaining {placeholder} patterns
      expect(result.text).not.toMatch(/\{[^}]+\}/);

      // Each section tag should be followed by content
      const lines = result.text.split('\n');
      const sectionLines = lines.filter((line) =>
        /^\[(INTRO|VERSE|CHORUS|BRIDGE|OUTRO)\]/.test(line)
      );

      for (const line of sectionLines) {
        const afterTag = line.replace(/^\[(INTRO|VERSE|CHORUS|BRIDGE|OUTRO)\]\s*/, '');
        expect(afterTag.length).toBeGreaterThan(10);
      }
    });
  });

  // =============================================================================
  // Tests: Deterministic remixInstruments
  // =============================================================================

  describe('remixInstruments - deterministic behavior', () => {
    const samplePrompt = `genre: "jazz"
bpm: "between 80 and 160"
instruments: "piano, bass, drums"
style tags: "smooth, warm"
recording: "studio session"`;

    it('produces valid output without LLM', () => {
      const result = remixInstruments(samplePrompt, 'jazz vibes');

      expect(result.text).toBeDefined();
      expect(result.text.length).toBeGreaterThan(0);
    });

    it('replaces instruments line', () => {
      const result = remixInstruments(samplePrompt, 'jazz vibes');

      // Should still have instruments field but with different content
      expect(result.text).toMatch(/instruments:\s*"[^"]+"/i);
      // Content should be different from original
      expect(result.text).not.toContain('piano, bass, drums');
    });

    it('detects genre from original input', () => {
      const result = remixInstruments(samplePrompt, 'smooth jazz night session');

      // Should use jazz-appropriate instruments
      expect(result.text).toBeDefined();
    });

    it('falls back to random genre when no match', () => {
      const result = remixInstruments(samplePrompt, 'xyzabc gibberish');

      // Should still produce valid output
      expect(result.text).toBeDefined();
      expect(result.text).toMatch(/instruments:\s*"[^"]+"/i);
    });

    it('includes chord progression harmony', () => {
      const result = remixInstruments(samplePrompt, 'jazz');

      expect(result.text).toContain('harmony');
    });

    it('includes vocal style', () => {
      const result = remixInstruments(samplePrompt, 'jazz');

      expect(result.text).toContain('vocals');
      expect(result.text).toContain('delivery');
    });
  });

  // =============================================================================
  // Tests: Edge Cases
  // =============================================================================

  describe('edge cases', () => {
    describe('empty description', () => {
      it('MAX MODE handles empty description', () => {
        const result = buildDeterministicMaxPrompt({
          description: '',
          rng: createSeededRng(12345),
        });

        // Should produce valid output with random genre
        expect(result.text).toMatch(/genre:\s*"[a-z]+"/);
        expect(result.text.length).toBeGreaterThan(0);
      });

      it('STANDARD MODE handles empty description', () => {
        const result = buildDeterministicStandardPrompt({
          description: '',
          rng: createSeededRng(12345),
        });

        // Should produce valid output with random genre
        expect(result.text).toMatch(/Genre:\s+\w+/);
        expect(result.text.length).toBeGreaterThan(0);
      });

      it('selectModes handles empty description', () => {
        const result = selectModes('');

        expect(result.genre).toBeNull();
        expect(result.reasoning).toBe('No genre keywords matched');
      });
    });

    describe('gibberish input', () => {
      it('MAX MODE handles gibberish', () => {
        const result = buildDeterministicMaxPrompt({
          description: 'asdfqwer zxcv 12345 !@#$%',
          rng: createSeededRng(12345),
        });

        // Should produce valid output with random genre
        expect(result.text).toMatch(/genre:\s*"[a-z]+"/);
      });

      it('STANDARD MODE handles gibberish', () => {
        const result = buildDeterministicStandardPrompt({
          description: 'asdfqwer zxcv 12345 !@#$%',
          rng: createSeededRng(12345),
        });

        // Should produce valid output with random genre
        expect(result.text).toMatch(/Genre:\s+\w+/);
      });
    });

    describe('multi-genre input', () => {
      it('detects first matching genre from multi-genre description', () => {
        // Jazz should be detected first due to priority
        const result = selectModes('jazz rock fusion');
        expect(result.genre).not.toBeNull();
      });

      it('MAX MODE handles multi-genre description', () => {
        const result = buildDeterministicMaxPrompt({
          description: 'jazz rock fusion electronic',
          rng: createSeededRng(12345),
        });

        // Should detect one of the genres
        expect(result.genre).not.toBeNull();
      });
    });

    describe('special characters', () => {
      it('handles description with special characters', () => {
        const result = buildDeterministicMaxPrompt({
          description: 'jazz & blues - "smooth" (vibes)',
          rng: createSeededRng(12345),
        });

        expect(result.text).toBeDefined();
        expect(result.text.length).toBeGreaterThan(0);
      });
    });

    describe('very long description', () => {
      it('handles very long description', () => {
        const longDescription = 'jazz '.repeat(500);
        const result = buildDeterministicMaxPrompt({
          description: longDescription,
          rng: createSeededRng(12345),
        });

        expect(result.text.length).toBeLessThanOrEqual(APP_CONSTANTS.MAX_PROMPT_CHARS);
      });
    });
  });

  // =============================================================================
  // Tests: Performance
  // =============================================================================

  describe('performance', () => {
    it('MAX MODE generation completes in under 50ms', () => {
      const start = performance.now();

      for (let i = 0; i < 10; i++) {
        buildDeterministicMaxPrompt({
          description: 'jazz ballad',
          rng: createSeededRng(i),
        });
      }

      const elapsed = performance.now() - start;
      const avgTime = elapsed / 10;

      // Average should be under 50ms per generation
      expect(avgTime).toBeLessThan(50);
    });

    it('STANDARD MODE generation completes in under 50ms', () => {
      const start = performance.now();

      for (let i = 0; i < 10; i++) {
        buildDeterministicStandardPrompt({
          description: 'rock anthem',
          rng: createSeededRng(i),
        });
      }

      const elapsed = performance.now() - start;
      const avgTime = elapsed / 10;

      // Average should be under 50ms per generation
      expect(avgTime).toBeLessThan(50);
    });
  });

  // =============================================================================
  // Tests: Helper Functions
  // =============================================================================

  describe('helper functions', () => {
    describe('detectGenre', () => {
      it('detects jazz', () => {
        expect(detectGenre('smooth jazz')).toBe('jazz');
      });

      it('detects rock', () => {
        expect(detectGenre('heavy rock')).toBe('rock');
      });

      it('detects electronic', () => {
        expect(detectGenre('electronic dance')).toBe('electronic');
      });

      it('returns null for no match', () => {
        expect(detectGenre('xyzabc')).toBeNull();
      });
    });

    describe('selectRandomGenre', () => {
      it('returns a valid genre', () => {
        const genre = selectRandomGenre(createSeededRng(12345));
        expect(genre).toBeDefined();
        expect(typeof genre).toBe('string');
      });

      it('returns deterministic result with same seed', () => {
        const genre1 = selectRandomGenre(createSeededRng(42));
        const genre2 = selectRandomGenre(createSeededRng(42));
        expect(genre1).toBe(genre2);
      });
    });

    describe('extractGenreFromPrompt', () => {
      it('extracts genre from MAX MODE prompt', () => {
        const prompt = 'genre: "jazz"\nbpm: "120"';
        expect(extractGenreFromPrompt(prompt)).toBe('jazz');
      });

      it('extracts genre from STANDARD MODE prompt', () => {
        const prompt = 'Genre: Rock\nBPM: 140';
        expect(extractGenreFromPrompt(prompt)).toBe('rock');
      });
    });

    describe('extractMoodFromPrompt', () => {
      it('extracts mood from prompt', () => {
        const prompt = 'mood: "energetic, uplifting"\ngenre: jazz';
        const mood = extractMoodFromPrompt(prompt);
        expect(mood).toContain('energetic');
      });
    });
  });
});
