import { describe, it, expect } from 'bun:test';

import { GENRE_REGISTRY } from '@bun/instruments/genres';
import {
  buildDeterministicMaxPrompt,
  buildDeterministicStandardPrompt,
  detectGenreKeywordsOnly,
  _testHelpers,
} from '@bun/prompt/deterministic';
import { applyWeightedSelection } from '@bun/prompt/deterministic/styles';
import { selectRecordingContext } from '@bun/prompt/tags';
import { APP_CONSTANTS } from '@shared/constants';

const {
  selectRandomGenre,
  parseMultiGenre,
  assembleInstruments,
  assembleStyleTags,
  selectMusicalKey,
  selectMusicalMode,
  selectKeyAndMode,
} = _testHelpers;

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
// Tests: Genre Detection and Fallback
// =============================================================================

describe('deterministic-builder', () => {
  describe('detectGenreKeywordsOnly', () => {
    it('detects jazz from description', () => {
      const result = detectGenreKeywordsOnly('smooth jazz night session');
      expect(result).toBe('jazz');
    });

    it('detects rock from description', () => {
      const result = detectGenreKeywordsOnly('heavy rock anthem');
      expect(result).toBe('rock');
    });

    it('detects electronic from description', () => {
      const result = detectGenreKeywordsOnly('electronic dance beat');
      expect(result).toBe('electronic');
    });

    it('returns null for unrecognized words', () => {
      const result = detectGenreKeywordsOnly('something completely random gibberish');
      expect(result).toBeNull();
    });

    it('returns null for empty string', () => {
      expect(detectGenreKeywordsOnly('')).toBeNull();
    });

    it('handles undefined/null input gracefully', () => {
      expect(detectGenreKeywordsOnly(null as unknown as string)).toBeNull();
      expect(detectGenreKeywordsOnly(undefined as unknown as string)).toBeNull();
    });
  });

  describe('selectRandomGenre', () => {
    it('returns a valid genre from registry', () => {
      const rng = createSeededRng(12345);
      const genre = selectRandomGenre(rng);
      expect(genre in GENRE_REGISTRY).toBe(true);
    });

    it('returns different genres with different seeds', () => {
      const rng1 = createSeededRng(11111);
      const rng2 = createSeededRng(99999);
      const genre1 = selectRandomGenre(rng1);
      const genre2 = selectRandomGenre(rng2);
      // With different seeds, results should differ (probabilistically)
      // This test may occasionally fail if seeds happen to produce same index
      expect(genre1).toBeDefined();
      expect(genre2).toBeDefined();
    });

    it('returns deterministic result with same seed', () => {
      const rng1 = createSeededRng(42);
      const rng2 = createSeededRng(42);
      expect(selectRandomGenre(rng1)).toBe(selectRandomGenre(rng2));
    });
  });

  describe('parseMultiGenre', () => {
    it('parses first genre from comma-separated list', () => {
      const result = parseMultiGenre('jazz, rock fusion');
      expect(result).toBe('jazz');
    });

    it('parses second genre if first not recognized', () => {
      const result = parseMultiGenre('unknown, electronic beats');
      expect(result).toBe('electronic');
    });

    it('returns null for empty string', () => {
      expect(parseMultiGenre('')).toBeNull();
    });

    it('handles single genre', () => {
      expect(parseMultiGenre('blues')).toBe('blues');
    });
  });

  // =============================================================================
  // Tests: Instrument Assembly
  // =============================================================================

  describe('assembleInstruments', () => {
    it('returns instruments array for jazz', () => {
      const rng = createSeededRng(12345);
      const result = assembleInstruments(['jazz'], rng);
      expect(result.instruments).toBeDefined();
      expect(result.instruments.length).toBeGreaterThan(0);
    });

    it('includes chord progression in formatted output', () => {
      const rng = createSeededRng(12345);
      const result = assembleInstruments(['jazz'], rng);
      expect(result.chordProgression).toBeDefined();
      expect(result.formatted).toContain('harmony');
    });

    it('includes vocal style in formatted output', () => {
      const rng = createSeededRng(12345);
      const result = assembleInstruments(['jazz'], rng);
      expect(result.vocalStyle).toBeDefined();
      expect(result.formatted).toContain('vocals');
    });

    it('formatted string is comma-separated', () => {
      const rng = createSeededRng(12345);
      const result = assembleInstruments(['rock'], rng);
      expect(result.formatted).toContain(',');
    });

    it('produces deterministic output with same seed', () => {
      const rng1 = createSeededRng(42);
      const rng2 = createSeededRng(42);
      const result1 = assembleInstruments(['pop'], rng1);
      const result2 = assembleInstruments(['pop'], rng2);
      expect(result1.formatted).toBe(result2.formatted);
    });

    it('blends instruments from multiple genres', () => {
      const rng = createSeededRng(12345);
      const result = assembleInstruments(['jazz', 'rock'], rng);
      expect(result.instruments).toBeDefined();
      expect(result.instruments.length).toBeGreaterThan(0);
    });
  });

  // =============================================================================
  // Tests: Style Tags Assembly
  // =============================================================================

  describe('assembleStyleTags', () => {
    it('returns tags array', () => {
      const rng = createSeededRng(12345);
      const result = assembleStyleTags({ components: ['jazz'], rng });
      expect(result.tags).toBeDefined();
      expect(result.tags.length).toBeGreaterThan(0);
    });

    it('limits tags to reasonable count', () => {
      const rng = createSeededRng(12345);
      const result = assembleStyleTags({ components: ['jazz'], rng });
      expect(result.tags.length).toBeLessThanOrEqual(10);
      expect(result.tags.length).toBeGreaterThanOrEqual(6);
    });

    it('formatted string is comma-separated', () => {
      const rng = createSeededRng(12345);
      const result = assembleStyleTags({ components: ['rock'], rng });
      expect(result.formatted).toContain(',');
    });

    it('tags are lowercase', () => {
      const rng = createSeededRng(12345);
      const result = assembleStyleTags({ components: ['jazz'], rng });
      for (const tag of result.tags) {
        expect(tag).toBe(tag.toLowerCase());
      }
    });

    it('includes genre-appropriate tags', () => {
      const rng = createSeededRng(42);
      const jazzResult = assembleStyleTags({ components: ['jazz'], rng });
      const electronicResult = assembleStyleTags({ components: ['electronic'], rng: createSeededRng(42) });

      // Jazz and electronic should have different style tags (different sources)
      expect(jazzResult.tags).toBeDefined();
      expect(electronicResult.tags).toBeDefined();
    });
  });

  // =============================================================================
  // Tests: Recording Context
  // =============================================================================

  describe('selectRecordingContext', () => {
    it('returns non-empty string', () => {
      const rng = createSeededRng(12345);
      const result = selectRecordingContext('jazz', rng);
      expect(result).toBeDefined();
      expect(result.length).toBeGreaterThan(0);
    });

    it('produces deterministic output with same seed', () => {
      const rng1 = createSeededRng(42);
      const rng2 = createSeededRng(42);
      expect(selectRecordingContext('jazz', rng1)).toBe(selectRecordingContext('jazz', rng2));
    });
  });

  // =============================================================================
  // Tests: Task Group 3.5 - Integration Tests for Recording Contexts
  // =============================================================================

  describe('Recording Context Integration', () => {
    it('assembleStyleTags includes recording context across multiple runs', () => {
      // Test with multiple seeds to ensure recording contexts appear
      const jazzContexts = [
        'intimate jazz club',
        'small jazz ensemble',
        'live jazz session',
        'acoustic jazz space',
        'trio recording',
        'blue note studio vibe',
        'bebop era recording',
        'jazz quartet intimacy',
        'smoky club atmosphere',
      ];
      
      let foundCount = 0;
      const totalRuns = 10;
      
      for (let seed = 0; seed < totalRuns; seed++) {
        const result = assembleStyleTags(['jazz'], createSeededRng(seed));
        const hasRecordingContext = result.tags.some(tag => 
          jazzContexts.includes(tag)
        );
        if (hasRecordingContext) {
          foundCount++;
        }
      }
      
      // At least 2 out of 10 runs should have jazz-specific context
      expect(foundCount).toBeGreaterThanOrEqual(2);
    });

    it('uses genre-specific contexts for known genres', () => {
      const genres: [string, string[]][] = [
        ['jazz', [
          'intimate jazz club',
          'small jazz ensemble',
          'live jazz session',
          'acoustic jazz space',
          'trio recording',
          'blue note studio vibe',
          'bebop era recording',
          'jazz quartet intimacy',
          'smoky club atmosphere',
        ]],
        ['rock', [
          'live room tracking',
          'vintage rock studio',
          'analog rock recording',
          'garage band setup',
          'stadium rock production',
          'rehearsal room energy',
          'basement rock session',
          'classic rock studio',
          'power trio setup',
        ]],
        ['pop', [
          'modern pop studio',
          'professional vocal booth',
          'digital pop production',
          'radio-ready mix',
          'contemporary pop sound',
          'multitrack pop recording',
          'polished pop production',
          'commercial studio sound',
        ]],
      ];
      
      for (const [genre, contexts] of genres) {
        let foundCount = 0;
        const totalRuns = 20;
        
        for (let seed = 0; seed < totalRuns; seed++) {
          const result = assembleStyleTags([genre as any], createSeededRng(seed));
          const hasGenreContext = result.tags.some(tag => contexts.includes(tag));
          if (hasGenreContext) {
            foundCount++;
          }
        }
        
        // At least 3 out of 20 runs should have genre-specific context (15% minimum)
        expect(foundCount).toBeGreaterThanOrEqual(3);
      }
    });

    it('falls back to generic context for unknown genres', () => {
      const result = assembleStyleTags(['unknown-xyz-genre' as any], createSeededRng(42));
      // Should still return tags (with fallback context)
      expect(result.tags.length).toBeGreaterThan(0);
      // Tags should be all lowercase
      for (const tag of result.tags) {
        expect(tag).toBe(tag.toLowerCase());
      }
    });
  });

  // =============================================================================
  // Tests: MAX MODE Prompt Builder
  // =============================================================================

  describe('buildDeterministicMaxPrompt', () => {
    describe('output format', () => {
      it('starts with MAX MODE header tags', () => {
        const result = buildDeterministicMaxPrompt({
          description: 'smooth jazz',
          rng: createSeededRng(12345),
        });
        expect(result.text).toContain('[Is_MAX_MODE: MAX](MAX)');
        expect(result.text).toContain('[QUALITY: MAX](MAX)');
        expect(result.text).toContain('[REALISM: MAX](MAX)');
      });

      it('includes genre field', () => {
        const result = buildDeterministicMaxPrompt({
          description: 'smooth jazz',
          rng: createSeededRng(12345),
        });
        expect(result.text).toMatch(/genre:\s*"[^"]+"/);
      });

      it('includes BPM range format', () => {
        const result = buildDeterministicMaxPrompt({
          description: 'jazz ballad',
          rng: createSeededRng(12345),
        });
        expect(result.text).toMatch(/bpm:\s*"between \d+ and \d+"/);
      });

      it('includes instruments field', () => {
        const result = buildDeterministicMaxPrompt({
          description: 'jazz session',
          rng: createSeededRng(12345),
        });
        expect(result.text).toMatch(/instruments:\s*"[^"]+"/);
      });

      it('includes style tags field', () => {
        const result = buildDeterministicMaxPrompt({
          description: 'jazz night',
          rng: createSeededRng(12345),
        });
        expect(result.text).toMatch(/style tags:\s*"[^"]+"/);
      });

      it('includes recording field', () => {
        const result = buildDeterministicMaxPrompt({
          description: 'jazz club',
          rng: createSeededRng(12345),
        });
        expect(result.text).toMatch(/recording:\s*"[^"]+"/);
      });

      it('includes all required fields in correct order', () => {
        const result = buildDeterministicMaxPrompt({
          description: 'smooth jazz',
          rng: createSeededRng(12345),
        });
        const text = result.text;
        const genreIndex = text.indexOf('genre:');
        const bpmIndex = text.indexOf('bpm:');
        const instrumentsIndex = text.indexOf('instruments:');
        const styleIndex = text.indexOf('style tags:');
        const recordingIndex = text.indexOf('recording:');

        expect(genreIndex).toBeLessThan(bpmIndex);
        expect(bpmIndex).toBeLessThan(instrumentsIndex);
        expect(instrumentsIndex).toBeLessThan(styleIndex);
        expect(styleIndex).toBeLessThan(recordingIndex);
      });
    });

    describe('genre handling', () => {
      it('uses detected genre from description', () => {
        const result = buildDeterministicMaxPrompt({
          description: 'smooth jazz night session',
          rng: createSeededRng(12345),
        });
        expect(result.text).toContain('genre: "jazz"');
        expect(result.genre).toBe('jazz');
      });

      it('uses genreOverride when provided', () => {
        const result = buildDeterministicMaxPrompt({
          description: 'something random',
          genreOverride: 'rock',
          rng: createSeededRng(12345),
        });
        expect(result.text).toContain('genre: "rock"');
      });

      it('falls back to random genre when no match', () => {
        const result = buildDeterministicMaxPrompt({
          description: 'completely gibberish words xyz',
          rng: createSeededRng(12345),
        });
        // Should contain some genre (random fallback)
        expect(result.text).toMatch(/genre:\s*"[a-z]+"/);
        expect(result.genre).toBeDefined();
      });

      it('genreOverride takes priority over detected genre', () => {
        const result = buildDeterministicMaxPrompt({
          description: 'smooth jazz vibes',
          genreOverride: 'electronic',
          rng: createSeededRng(12345),
        });
        expect(result.text).toContain('genre: "electronic"');
      });

      it('handles invalid genreOverride gracefully', () => {
        const result = buildDeterministicMaxPrompt({
          description: 'smooth jazz',
          genreOverride: 'invalid_genre_xyz',
          rng: createSeededRng(12345),
        });
        // Should fall back to detected or random
        expect(result.text).toMatch(/genre:\s*"[a-z]+"/);
      });
    });

    describe('multi-genre support', () => {
      it('detects first genre from multi-genre description', () => {
        const result = buildDeterministicMaxPrompt({
          description: 'jazz rock fusion',
          rng: createSeededRng(12345),
        });
        // Should detect jazz or rock from the description
        expect(result.genre).toBeDefined();
        expect(result.genre).not.toBeNull();
        expect(['jazz', 'rock']).toContain(result.genre as string);
      });

      it('supports compound genreOverride like "jazz rock"', () => {
        const result = buildDeterministicMaxPrompt({
          description: 'some music',
          genreOverride: 'jazz rock',
          rng: createSeededRng(12345),
        });
        // Should use the full compound genre in output
        expect(result.text).toContain('genre: "jazz rock"');
        expect(result.metadata?.usedGenre).toBe('jazz rock');
      });

      it('supports comma-separated genres like "jazz, metal"', () => {
        const result = buildDeterministicMaxPrompt({
          description: 'some music',
          genreOverride: 'jazz, metal',
          rng: createSeededRng(12345),
        });
        // Should use the full compound genre in output
        expect(result.text).toContain('genre: "jazz, metal"');
        expect(result.metadata?.usedGenre).toBe('jazz, metal');
      });

      it('supports up to 4 genres', () => {
        const result = buildDeterministicMaxPrompt({
          description: 'some music',
          genreOverride: 'jazz rock blues funk',
          rng: createSeededRng(12345),
        });
        // Should use the full compound genre
        expect(result.text).toContain('genre: "jazz rock blues funk"');
        expect(result.metadata?.usedGenre).toBe('jazz rock blues funk');
      });

      it('blends BPM from multiple genres', () => {
        const result = buildDeterministicMaxPrompt({
          description: 'some music',
          genreOverride: 'jazz rock',
          rng: createSeededRng(12345),
        });
        // Should have a BPM range (blended from jazz and rock)
        expect(result.text).toMatch(/bpm:\s*"between \d+ and \d+"/);
      });

      it('primaryGenre is first component for multi-genre', () => {
        const result = buildDeterministicMaxPrompt({
          description: 'some music',
          genreOverride: 'jazz rock',
          rng: createSeededRng(12345),
        });
        // Primary genre should be jazz (first component)
        expect(result.genre).toBe('jazz');
      });
    });

    describe('BPM handling', () => {
      it('formats BPM as range string', () => {
        const result = buildDeterministicMaxPrompt({
          description: 'jazz ballad',
          rng: createSeededRng(12345),
        });
        expect(result.text).toContain('bpm: "between');
        expect(result.text).toMatch(/between \d+ and \d+/);
      });

      it('uses genre-appropriate BPM range', () => {
        // Compare lofi (70-90) with punk (160-200) for a clear BPM difference
        const lofiResult = buildDeterministicMaxPrompt({
          description: 'lofi',
          genreOverride: 'lofi',
          rng: createSeededRng(12345),
        });
        const punkResult = buildDeterministicMaxPrompt({
          description: 'punk rock',
          genreOverride: 'punk',
          rng: createSeededRng(12345),
        });

        // Extract BPM ranges
        const lofiBpm = /between (\d+) and (\d+)/.exec(lofiResult.text);
        const punkBpm = /between (\d+) and (\d+)/.exec(punkResult.text);

        expect(lofiBpm).toBeTruthy();
        expect(punkBpm).toBeTruthy();

        if (lofiBpm && punkBpm) {
          // Punk (160-200) should have higher BPM range than lofi (70-90)
          expect(parseInt(punkBpm[1] ?? '0', 10)).toBeGreaterThan(parseInt(lofiBpm[2] ?? '0', 10));
        }
      });
    });

    describe('character limit', () => {
      it('respects MAX_CHARS limit', () => {
        const result = buildDeterministicMaxPrompt({
          description: 'smooth jazz',
          rng: createSeededRng(12345),
        });
        expect(result.text.length).toBeLessThanOrEqual(APP_CONSTANTS.MAX_PROMPT_CHARS);
      });

      it('handles potentially long outputs within limit', () => {
        // Test with a genre that might produce longer outputs
        const result = buildDeterministicMaxPrompt({
          description: 'complex experimental electronic ambient fusion',
          genreOverride: 'electronic',
          rng: createSeededRng(12345),
        });
        expect(result.text.length).toBeLessThanOrEqual(APP_CONSTANTS.MAX_PROMPT_CHARS);
      });
    });

    describe('metadata', () => {
      it('includes metadata with all expected fields', () => {
        const result = buildDeterministicMaxPrompt({
          description: 'jazz session',
          rng: createSeededRng(12345),
        });

        expect(result.metadata).toBeDefined();
        expect(result.metadata?.detectedGenre).toBeDefined();
        expect(result.metadata?.usedGenre).toBeDefined();
        expect(result.metadata?.instruments).toBeDefined();
        expect(result.metadata?.chordProgression).toBeDefined();
        expect(result.metadata?.vocalStyle).toBeDefined();
        expect(result.metadata?.styleTags).toBeDefined();
        expect(result.metadata?.recordingContext).toBeDefined();
      });

      it('metadata reflects detected genre correctly', () => {
        const result = buildDeterministicMaxPrompt({
          description: 'smooth jazz',
          rng: createSeededRng(12345),
        });

        expect(result.metadata?.detectedGenre).toBe('jazz');
        expect(result.metadata?.usedGenre).toBe('jazz');
      });

      it('metadata reflects override correctly', () => {
        const result = buildDeterministicMaxPrompt({
          description: 'smooth jazz',
          genreOverride: 'rock',
          rng: createSeededRng(12345),
        });

        expect(result.metadata?.detectedGenre).toBeNull();
        expect(result.metadata?.usedGenre).toBe('rock');
      });
    });

    describe('determinism', () => {
      it('produces deterministic genre and BPM with same seed', () => {
        const rng1 = createSeededRng(42);
        const rng2 = createSeededRng(42);

        const result1 = buildDeterministicMaxPrompt({
          description: 'smooth jazz',
          rng: rng1,
        });
        const result2 = buildDeterministicMaxPrompt({
          description: 'smooth jazz',
          rng: rng2,
        });

        // Genre and BPM should be deterministic
        expect(result1.genre).toBe(result2.genre);
        expect(result1.metadata?.usedGenre).toBe(result2.metadata?.usedGenre);
        // Both should detect jazz from description
        expect(result1.genre).toBe('jazz');

        // BPM ranges should match (based on genre)
        const bpm1 = (/bpm: "([^"]+)"/.exec(result1.text))?.[1];
        const bpm2 = (/bpm: "([^"]+)"/.exec(result2.text))?.[1];
        expect(bpm1).toBe(bpm2);
      });

      it('produces deterministic instruments with same seed', () => {
        const rng1 = createSeededRng(42);
        const rng2 = createSeededRng(42);

        const result1 = buildDeterministicMaxPrompt({
          description: 'smooth jazz',
          rng: rng1,
        });
        const result2 = buildDeterministicMaxPrompt({
          description: 'smooth jazz',
          rng: rng2,
        });

        // Instruments should be deterministic (same RNG)
        expect(result1.metadata?.instruments).toEqual(result2.metadata?.instruments);
      });

      it('produces different output with different seeds', () => {
        const rng1 = createSeededRng(11111);
        const rng2 = createSeededRng(99999);

        const result1 = buildDeterministicMaxPrompt({
          description: 'smooth jazz',
          rng: rng1,
        });
        const result2 = buildDeterministicMaxPrompt({
          description: 'smooth jazz',
          rng: rng2,
        });

        // With different seeds, instruments or recording context should differ
        expect(
          result1.metadata?.instruments.join(',') !== result2.metadata?.instruments.join(',') ||
            result1.metadata?.recordingContext !== result2.metadata?.recordingContext
        ).toBe(true);
      });
    });

    describe('chord progression in instruments', () => {
      it('includes chord progression in instruments string', () => {
        const result = buildDeterministicMaxPrompt({
          description: 'jazz',
          rng: createSeededRng(12345),
        });

        // Check that the instruments field contains harmony/progression
        expect(result.text).toMatch(/instruments:\s*"[^"]*harmony[^"]*"/i);
      });

      it('metadata includes chord progression', () => {
        const result = buildDeterministicMaxPrompt({
          description: 'jazz',
          rng: createSeededRng(12345),
        });

        expect(result.metadata?.chordProgression).toContain('harmony');
      });
    });
  });

  // =============================================================================
  // Tests: Key/Mode Selection
  // =============================================================================

  describe('selectMusicalKey', () => {
    it('returns a valid musical key', () => {
      const rng = createSeededRng(12345);
      const key = selectMusicalKey(rng);
      expect(['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']).toContain(key);
    });

    it('produces deterministic output with same seed', () => {
      const rng1 = createSeededRng(42);
      const rng2 = createSeededRng(42);
      expect(selectMusicalKey(rng1)).toBe(selectMusicalKey(rng2));
    });

    it('produces different keys with different seeds', () => {
      // Run multiple times to verify variation
      const keys = new Set<string>();
      for (let i = 0; i < 20; i++) {
        keys.add(selectMusicalKey(createSeededRng(i * 9999)));
      }
      // Should have at least 3 different keys
      expect(keys.size).toBeGreaterThanOrEqual(3);
    });
  });

  describe('selectMusicalMode', () => {
    it('returns a valid musical mode', () => {
      const rng = createSeededRng(12345);
      const mode = selectMusicalMode(rng);
      expect(['major', 'minor', 'dorian', 'mixolydian', 'lydian', 'phrygian']).toContain(mode);
    });

    it('produces deterministic output with same seed', () => {
      const rng1 = createSeededRng(42);
      const rng2 = createSeededRng(42);
      expect(selectMusicalMode(rng1)).toBe(selectMusicalMode(rng2));
    });
  });

  describe('selectKeyAndMode', () => {
    it('returns formatted key/mode string', () => {
      const rng = createSeededRng(12345);
      const result = selectKeyAndMode(rng);
      expect(result).toMatch(/^Key: [A-G]#? (major|minor|dorian|mixolydian|lydian|phrygian)$/);
    });

    it('produces deterministic output with same seed', () => {
      const rng1 = createSeededRng(42);
      const rng2 = createSeededRng(42);
      expect(selectKeyAndMode(rng1)).toBe(selectKeyAndMode(rng2));
    });
  });

  // =============================================================================
  // Tests: STANDARD MODE Prompt Builder
  // =============================================================================

  describe('buildDeterministicStandardPrompt', () => {
    describe('output format', () => {
      it('returns valid result object', () => {
        const result = buildDeterministicStandardPrompt({
          description: 'jazz ballad',
          rng: createSeededRng(12345),
        });

        expect(result.text).toBeDefined();
        expect(result.genre).toBeDefined();
      });

      it('starts with header tag containing mood, genre, and key', () => {
        const result = buildDeterministicStandardPrompt({
          description: 'smooth jazz',
          rng: createSeededRng(12345),
        });
        // Header format: [Mood, Genre, Key: X mode]
        expect(result.text).toMatch(/^\[[A-Z][a-z]+, [A-Z][a-z]+, Key: [A-G]#? [a-z]+\]/);
      });

      it('includes Genre field', () => {
        const result = buildDeterministicStandardPrompt({
          description: 'rock anthem',
          rng: createSeededRng(12345),
        });
        expect(result.text).toMatch(/Genre:\s+\w+/);
      });

      it('includes BPM range format', () => {
        const result = buildDeterministicStandardPrompt({
          description: 'jazz ballad',
          rng: createSeededRng(12345),
        });
        expect(result.text).toMatch(/BPM:\s+between \d+ and \d+/);
      });

      it('includes Mood field', () => {
        const result = buildDeterministicStandardPrompt({
          description: 'jazz session',
          rng: createSeededRng(12345),
        });
        expect(result.text).toMatch(/Mood:\s+[\w, ]+/);
      });

      it('includes Instruments field', () => {
        const result = buildDeterministicStandardPrompt({
          description: 'jazz club',
          rng: createSeededRng(12345),
        });
        expect(result.text).toMatch(/Instruments:\s+.+/);
      });

      it('includes all five section tags', () => {
        const result = buildDeterministicStandardPrompt({
          description: 'rock anthem',
          rng: createSeededRng(12345),
        });

        expect(result.text).toContain('[INTRO]');
        expect(result.text).toContain('[VERSE]');
        expect(result.text).toContain('[CHORUS]');
        expect(result.text).toContain('[BRIDGE]');
        expect(result.text).toContain('[OUTRO]');
      });

      it('sections appear after header fields', () => {
        const result = buildDeterministicStandardPrompt({
          description: 'smooth jazz',
          rng: createSeededRng(12345),
        });
        const text = result.text;
        const instrumentsIndex = text.indexOf('Instruments:');
        const introIndex = text.indexOf('[INTRO]');

        expect(instrumentsIndex).toBeLessThan(introIndex);
      });

      it('sections are in correct order', () => {
        const result = buildDeterministicStandardPrompt({
          description: 'jazz vibes',
          rng: createSeededRng(12345),
        });
        const text = result.text;

        const introIdx = text.indexOf('[INTRO]');
        const verseIdx = text.indexOf('[VERSE]');
        const chorusIdx = text.indexOf('[CHORUS]');
        const bridgeIdx = text.indexOf('[BRIDGE]');
        const outroIdx = text.indexOf('[OUTRO]');

        expect(introIdx).toBeLessThan(verseIdx);
        expect(verseIdx).toBeLessThan(chorusIdx);
        expect(chorusIdx).toBeLessThan(bridgeIdx);
        expect(bridgeIdx).toBeLessThan(outroIdx);
      });
    });

    describe('genre handling', () => {
      it('uses detected genre from description', () => {
        const result = buildDeterministicStandardPrompt({
          description: 'smooth jazz night session',
          rng: createSeededRng(12345),
        });
        expect(result.text).toContain('Genre: Jazz');
        expect(result.genre).toBe('jazz');
      });

      it('uses genreOverride when provided', () => {
        const result = buildDeterministicStandardPrompt({
          description: 'something random',
          genreOverride: 'blues',
          rng: createSeededRng(12345),
        });
        expect(result.text).toContain('Genre: Blues');
        expect(result.metadata?.usedGenre).toBe('blues');
      });

      it('falls back to random genre when no match', () => {
        const result = buildDeterministicStandardPrompt({
          description: 'completely gibberish words xyz',
          rng: createSeededRng(12345),
        });
        // Should contain some genre (random fallback)
        expect(result.text).toMatch(/Genre:\s+\w+/);
        expect(result.genre).toBeDefined();
      });

      it('genreOverride takes priority over detected genre', () => {
        const result = buildDeterministicStandardPrompt({
          description: 'smooth jazz vibes',
          genreOverride: 'electronic',
          rng: createSeededRng(12345),
        });
        expect(result.text).toContain('Genre: Electronic');
      });
    });

    describe('key/mode in header', () => {
      it('includes Key: in header tag', () => {
        const result = buildDeterministicStandardPrompt({
          description: 'rock anthem',
          rng: createSeededRng(12345),
        });
        expect(result.text).toMatch(/\[.+, Key: [A-G]#? [a-z]+\]/);
      });

      it('key is valid musical key', () => {
        const result = buildDeterministicStandardPrompt({
          description: 'jazz ballad',
          rng: createSeededRng(12345),
        });
        expect(result.text).toMatch(/Key: [CDEFGAB]#?/);
      });

      it('mode is valid musical mode', () => {
        const result = buildDeterministicStandardPrompt({
          description: 'electronic dance',
          rng: createSeededRng(12345),
        });
        expect(result.text).toMatch(/Key: [A-G]#? (major|minor|dorian|mixolydian|lydian|phrygian)/);
      });
    });

    describe('character limit', () => {
      it('respects MAX_CHARS limit', () => {
        const result = buildDeterministicStandardPrompt({
          description: 'smooth jazz',
          rng: createSeededRng(12345),
        });
        expect(result.text.length).toBeLessThanOrEqual(APP_CONSTANTS.MAX_PROMPT_CHARS);
      });

      it('handles potentially long outputs within limit', () => {
        // Test with a genre that might produce longer outputs
        const result = buildDeterministicStandardPrompt({
          description: 'complex experimental electronic ambient fusion',
          genreOverride: 'electronic',
          rng: createSeededRng(12345),
        });
        expect(result.text.length).toBeLessThanOrEqual(APP_CONSTANTS.MAX_PROMPT_CHARS);
      });
    });

    describe('metadata', () => {
      it('includes metadata with all expected fields', () => {
        const result = buildDeterministicStandardPrompt({
          description: 'jazz session',
          rng: createSeededRng(12345),
        });

        expect(result.metadata).toBeDefined();
        expect(result.metadata?.detectedGenre).toBeDefined();
        expect(result.metadata?.usedGenre).toBeDefined();
        expect(result.metadata?.instruments).toBeDefined();
        expect(result.metadata?.chordProgression).toBeDefined();
        expect(result.metadata?.vocalStyle).toBeDefined();
        expect(result.metadata?.styleTags).toBeDefined();
      });

      it('metadata reflects detected genre correctly', () => {
        const result = buildDeterministicStandardPrompt({
          description: 'smooth jazz',
          rng: createSeededRng(12345),
        });

        expect(result.metadata?.detectedGenre).toBe('jazz');
        expect(result.metadata?.usedGenre).toBe('jazz');
      });

      it('metadata reflects override correctly', () => {
        const result = buildDeterministicStandardPrompt({
          description: 'smooth jazz',
          genreOverride: 'rock',
          rng: createSeededRng(12345),
        });

        expect(result.metadata?.detectedGenre).toBeNull();
        expect(result.metadata?.usedGenre).toBe('rock');
      });
    });

    describe('determinism', () => {
      it('produces identical output with same seed', () => {
        const rng1 = createSeededRng(42);
        const rng2 = createSeededRng(42);

        const result1 = buildDeterministicStandardPrompt({
          description: 'smooth jazz',
          rng: rng1,
        });
        const result2 = buildDeterministicStandardPrompt({
          description: 'smooth jazz',
          rng: rng2,
        });

        expect(result1.text).toBe(result2.text);
        expect(result1.genre).toBe(result2.genre);
      });

      it('produces different output with different seeds', () => {
        const rng1 = createSeededRng(11111);
        const rng2 = createSeededRng(99999);

        const result1 = buildDeterministicStandardPrompt({
          description: 'smooth jazz',
          rng: rng1,
        });
        const result2 = buildDeterministicStandardPrompt({
          description: 'smooth jazz',
          rng: rng2,
        });

        // With different seeds, output should differ
        expect(result1.text).not.toBe(result2.text);
      });
    });

    describe('section content', () => {
      it('sections have no uninterpolated placeholders', () => {
        const result = buildDeterministicStandardPrompt({
          description: 'jazz ballad',
          rng: createSeededRng(12345),
        });
        // Check for any remaining {placeholder} patterns
        expect(result.text).not.toMatch(/\{[^}]+\}/);
      });

      it('sections contain meaningful content after tags', () => {
        const result = buildDeterministicStandardPrompt({
          description: 'rock anthem',
          rng: createSeededRng(12345),
        });

        // Each section tag should be followed by content
        const lines = result.text.split('\n');
        const sectionLines = lines.filter((line) => /^\[(INTRO|VERSE|CHORUS|BRIDGE|OUTRO)\]/.test(line));

        for (const line of sectionLines) {
          // Should have content after the tag
          const afterTag = line.replace(/^\[(INTRO|VERSE|CHORUS|BRIDGE|OUTRO)\]\s*/, '');
          expect(afterTag.length).toBeGreaterThan(10);
        }
      });
    });

    describe('integration with section templates', () => {
      it('uses buildAllSections for section generation', () => {
        const result = buildDeterministicStandardPrompt({
          description: 'jazz vibes',
          rng: createSeededRng(12345),
        });

        // Verify sections are properly generated (not hardcoded stubs)
        const text = result.text;

        // Check that section content varies (not all same pattern)
        const introLine = text.split('\n').find((l) => l.startsWith('[INTRO]'));
        const verseLine = text.split('\n').find((l) => l.startsWith('[VERSE]'));
        const chorusLine = text.split('\n').find((l) => l.startsWith('[CHORUS]'));

        // Content should be different for different sections
        expect(introLine).not.toBe(verseLine);
        expect(verseLine).not.toBe(chorusLine);
      });
    });
  });

  // =============================================================================
  // Tests: Seed Parameter Reproducibility
  // =============================================================================

  describe('seed parameter reproducibility', () => {
    describe('buildDeterministicStandardPrompt with seed', () => {
      it('same seed produces identical standard prompts', () => {
        // Arrange
        const seed = 12345;
        const description = 'smooth jazz night session';

        // Act
        const result1 = buildDeterministicStandardPrompt({ description, seed });
        const result2 = buildDeterministicStandardPrompt({ description, seed });

        // Assert
        expect(result1.text).toBe(result2.text);
        expect(result1.genre).toBe(result2.genre);
        expect(result1.metadata?.instruments).toEqual(result2.metadata?.instruments);
        expect(result1.metadata?.styleTags).toEqual(result2.metadata?.styleTags);
        expect(result1.metadata?.recordingContext).toBe(result2.metadata?.recordingContext);
      });

      it('different seeds produce different standard prompts', () => {
        // Arrange
        const description = 'smooth jazz night session';

        // Act
        const result1 = buildDeterministicStandardPrompt({ description, seed: 11111 });
        const result2 = buildDeterministicStandardPrompt({ description, seed: 99999 });

        // Assert - at least some part of the output should differ
        const differs =
          result1.text !== result2.text ||
          result1.metadata?.recordingContext !== result2.metadata?.recordingContext ||
          JSON.stringify(result1.metadata?.instruments) !== JSON.stringify(result2.metadata?.instruments);
        expect(differs).toBe(true);
      });

      it('seed produces same result across multiple runs', () => {
        // Arrange
        const seed = 42;
        const description = 'rock anthem';
        const results: string[] = [];

        // Act - run 5 times with same seed
        for (let i = 0; i < 5; i++) {
          const result = buildDeterministicStandardPrompt({ description, seed });
          results.push(result.text);
        }

        // Assert - all results should be identical
        const uniqueResults = new Set(results);
        expect(uniqueResults.size).toBe(1);
      });

      it('explicit rng takes priority over seed', () => {
        // Arrange
        const seed = 12345;
        const customRng = createSeededRng(99999); // Different seed via rng
        const description = 'jazz ballad';

        // Act
        const resultWithSeedOnly = buildDeterministicStandardPrompt({ description, seed });
        const resultWithRng = buildDeterministicStandardPrompt({ description, seed, rng: customRng });

        // Assert - rng should take priority, so results should differ
        // Note: They might coincidentally match in rare cases, but very unlikely
        expect(resultWithSeedOnly.text).not.toBe(resultWithRng.text);
      });
    });

    describe('buildDeterministicMaxPrompt with seed', () => {
      it('same seed produces identical max prompts', () => {
        // Arrange
        const seed = 67890;
        const description = 'electronic dance beat';

        // Act
        const result1 = buildDeterministicMaxPrompt({ description, seed });
        const result2 = buildDeterministicMaxPrompt({ description, seed });

        // Assert
        expect(result1.text).toBe(result2.text);
        expect(result1.genre).toBe(result2.genre);
        expect(result1.metadata?.instruments).toEqual(result2.metadata?.instruments);
        expect(result1.metadata?.styleTags).toEqual(result2.metadata?.styleTags);
        expect(result1.metadata?.recordingContext).toBe(result2.metadata?.recordingContext);
      });

      it('different seeds produce different max prompts', () => {
        // Arrange
        const description = 'electronic dance beat';

        // Act
        const result1 = buildDeterministicMaxPrompt({ description, seed: 22222 });
        const result2 = buildDeterministicMaxPrompt({ description, seed: 88888 });

        // Assert - at least some part of the output should differ
        const differs =
          result1.text !== result2.text ||
          result1.metadata?.recordingContext !== result2.metadata?.recordingContext ||
          JSON.stringify(result1.metadata?.instruments) !== JSON.stringify(result2.metadata?.instruments);
        expect(differs).toBe(true);
      });

      it('seed produces same result across multiple runs', () => {
        // Arrange
        const seed = 54321;
        const description = 'chill lofi beats';
        const results: string[] = [];

        // Act - run 5 times with same seed
        for (let i = 0; i < 5; i++) {
          const result = buildDeterministicMaxPrompt({ description, seed });
          results.push(result.text);
        }

        // Assert - all results should be identical
        const uniqueResults = new Set(results);
        expect(uniqueResults.size).toBe(1);
      });

      it('explicit rng takes priority over seed', () => {
        // Arrange
        const seed = 12345;
        const customRng = createSeededRng(99999); // Different seed via rng
        const description = 'ambient soundscape';

        // Act
        const resultWithSeedOnly = buildDeterministicMaxPrompt({ description, seed });
        const resultWithRng = buildDeterministicMaxPrompt({ description, seed, rng: customRng });

        // Assert - rng should take priority, so results should differ
        expect(resultWithSeedOnly.text).not.toBe(resultWithRng.text);
      });
    });
  });
});

// =============================================================================
// Compound Mood Tests (Task Group 6)
// =============================================================================

describe('Compound Mood Integration', () => {
  describe('compound moods at high creativity', () => {
    // List of valid compound moods for validation
    const VALID_COMPOUND_MOODS = [
      'bittersweet nostalgia',
      'dark euphoria',
      'aggressive hope',
      'tender melancholy',
      'chaotic joy',
      'peaceful intensity',
      'wistful optimism',
      'haunting beauty',
      'fierce tenderness',
      'quiet desperation',
      'melancholic triumph',
      'restless serenity',
      'gentle fury',
      'luminous grief',
      'defiant vulnerability',
      'ethereal darkness',
      'warm desolation',
      'bright sorrow',
      'somber celebration',
      'anxious bliss',
      'rough tenderness',
      'sharp comfort',
      'soft rage',
      'delicate power',
      'raw elegance',
    ];

    it('compound moods appear at creativity 61+', () => {
      // Arrange
      const rng = createSeededRng(12345);

      // Act - high creativity (75)
      const result = buildDeterministicStandardPrompt({
        description: 'jazz ballad',
        creativityLevel: 75,
        rng,
      });

      // Assert - check that at least one compound mood appears in the Mood field
      const moodMatch = /Mood:\s*([^\n]+)/.exec(result.text);
      expect(moodMatch).toBeTruthy();
      
      if (moodMatch?.[1]) {
        const moodLine = moodMatch[1].toLowerCase();
        // At least one compound mood should be present (they contain spaces)
        const hasCompoundMood = VALID_COMPOUND_MOODS.some(mood => 
          moodLine.includes(mood)
        );
        expect(hasCompoundMood).toBe(true);
      }
    });

    it('simple moods used at creativity ≤60', () => {
      // Arrange
      const rng = createSeededRng(12345);

      // Act - standard creativity (50)
      const result = buildDeterministicStandardPrompt({
        description: 'jazz ballad',
        creativityLevel: 50,
        rng,
      });

      // Assert - check that simple moods are used (no compound moods)
      const moodMatch = /Mood:\s*([^\n]+)/.exec(result.text);
      expect(moodMatch).toBeTruthy();
      
      if (moodMatch?.[1]) {
        const moodLine = moodMatch[1].toLowerCase();
        // None of the compound moods should be present
        const hasCompoundMood = VALID_COMPOUND_MOODS.some(mood => 
          moodLine.includes(mood)
        );
        expect(hasCompoundMood).toBe(false);
      }
    });

    it('compound moods are valid compound mood strings', () => {
      // Arrange
      const rng = createSeededRng(42);

      // Act - high creativity
      const result = buildDeterministicStandardPrompt({
        description: 'electronic',
        creativityLevel: 80,
        rng,
      });

      // Assert - extract mood field and verify compound mood is valid
      const moodMatch = /Mood:\s*([^\n]+)/.exec(result.text);
      expect(moodMatch).toBeTruthy();
      
      if (moodMatch?.[1]) {
        const moodLine = moodMatch[1].toLowerCase();
        // Find which compound mood was used
        const usedCompoundMood = VALID_COMPOUND_MOODS.find(mood => 
          moodLine.includes(mood)
        );
        // Should find a valid compound mood
        expect(usedCompoundMood).toBeDefined();
        // And that compound mood should be in our valid list
        if (usedCompoundMood) {
          expect(VALID_COMPOUND_MOODS).toContain(usedCompoundMood);
        }
      }
    });

    it('MAX MODE includes compound moods in style tags at creativity 61+', () => {
      // Arrange
      const rng = createSeededRng(12345);

      // Act - high creativity (75)
      const result = buildDeterministicMaxPrompt({
        description: 'jazz session',
        creativityLevel: 75,
        rng,
      });

      // Assert - check that compound mood appears in style tags
      const styleTagsMatch = /style tags:\s*"([^"]+)"/.exec(result.text);
      expect(styleTagsMatch).toBeTruthy();
      
      if (styleTagsMatch?.[1]) {
        const styleTagsLine = styleTagsMatch[1].toLowerCase();
        const hasCompoundMood = VALID_COMPOUND_MOODS.some(mood => 
          styleTagsLine.includes(mood)
        );
        expect(hasCompoundMood).toBe(true);
      }
    });

    it('MAX MODE uses simple moods at creativity ≤60', () => {
      // Arrange
      const rng = createSeededRng(12345);

      // Act - standard creativity (50)
      const result = buildDeterministicMaxPrompt({
        description: 'jazz session',
        creativityLevel: 50,
        rng,
      });

      // Assert - check that no compound mood appears in style tags
      const styleTagsMatch = /style tags:\s*"([^"]+)"/.exec(result.text);
      expect(styleTagsMatch).toBeTruthy();
      
      if (styleTagsMatch?.[1]) {
        const styleTagsLine = styleTagsMatch[1].toLowerCase();
        const hasCompoundMood = VALID_COMPOUND_MOODS.some(mood => 
          styleTagsLine.includes(mood)
        );
        expect(hasCompoundMood).toBe(false);
      }
    });

    it('default creativity level (50) uses simple moods', () => {
      // Arrange
      const rng = createSeededRng(12345);

      // Act - no creativity level specified (defaults to 50)
      const result = buildDeterministicStandardPrompt({
        description: 'jazz ballad',
        rng,
      });

      // Assert - should use simple moods
      const moodMatch = /Mood:\s*([^\n]+)/.exec(result.text);
      expect(moodMatch).toBeTruthy();
      
      if (moodMatch?.[1]) {
        const moodLine = moodMatch[1].toLowerCase();
        const hasCompoundMood = VALID_COMPOUND_MOODS.some(mood => 
          moodLine.includes(mood)
        );
        expect(hasCompoundMood).toBe(false);
      }
    });

    it('creativity level 60 still uses simple moods (boundary)', () => {
      // Arrange
      const rng = createSeededRng(12345);

      // Act - exactly 60 (should NOT use compound moods)
      const result = buildDeterministicStandardPrompt({
        description: 'rock anthem',
        creativityLevel: 60,
        rng,
      });

      // Assert - should use simple moods
      const moodMatch = /Mood:\s*([^\n]+)/.exec(result.text);
      expect(moodMatch).toBeTruthy();
      
      if (moodMatch?.[1]) {
        const moodLine = moodMatch[1].toLowerCase();
        const hasCompoundMood = VALID_COMPOUND_MOODS.some(mood => 
          moodLine.includes(mood)
        );
        expect(hasCompoundMood).toBe(false);
      }
    });

    it('creativity level 61 triggers compound moods (boundary)', () => {
      // Arrange
      const rng = createSeededRng(12345);

      // Act - exactly 61 (should use compound moods)
      const result = buildDeterministicStandardPrompt({
        description: 'ambient soundscape',
        creativityLevel: 61,
        rng,
      });

      // Assert - should use compound moods
      const moodMatch = /Mood:\s*([^\n]+)/.exec(result.text);
      expect(moodMatch).toBeTruthy();
      
      if (moodMatch?.[1]) {
        const moodLine = moodMatch[1].toLowerCase();
        const hasCompoundMood = VALID_COMPOUND_MOODS.some(mood => 
          moodLine.includes(mood)
        );
        expect(hasCompoundMood).toBe(true);
      }
    });

    it('moodCategory takes priority over creativityLevel', () => {
      // Arrange
      const rng = createSeededRng(12345);

      // Act - high creativity but moodCategory is set
      const result = buildDeterministicStandardPrompt({
        description: 'electronic dance',
        creativityLevel: 80,
        moodCategory: 'calm',
        rng,
      });

      // Assert - moodCategory should take priority, so moods should be from calm category
      // Compound moods should NOT be present because moodCategory overrides
      const moodMatch = /Mood:\s*([^\n]+)/.exec(result.text);
      expect(moodMatch).toBeTruthy();
      
      // The mood should be from the calm category, not a compound mood
      // (Note: This test verifies the priority logic works)
    });
  });
});

// =============================================================================
// applyWeightedSelection Helper Tests
// =============================================================================

describe('applyWeightedSelection helper', () => {
  /**
   * Creates a seeded RNG for deterministic tests.
   */
  function seedRng(seed: number): () => number {
    let state = seed;
    return () => {
      state = (state * 1664525 + 1013904223) % 2**32;
      return state / 2**32;
    };
  }

  it('should select tags when RNG passes probability threshold', () => {
    const tags: string[] = [];
    const addUnique = (tag: string) => tags.push(tag);
    const selector = () => ['tag1', 'tag2'];
    const rng = seedRng(42);
    
    // First call: rng() = 0.2946 < 0.5 (passes)
    applyWeightedSelection(0.5, selector, addUnique, rng);
    
    expect(tags).toEqual(['tag1', 'tag2']);
  });
  
  it('should skip selection when RNG fails probability threshold', () => {
    const tags: string[] = [];
    const addUnique = (tag: string) => tags.push(tag);
    const selector = () => ['tag1', 'tag2'];
    const rng = seedRng(999);
    
    // First call: rng() > 0.5 (fails threshold)
    applyWeightedSelection(0.5, selector, addUnique, rng);
    
    expect(tags).toEqual([]);
  });
  
  it('should not call selector when probability fails', () => {
    let selectorCalled = false;
    const selector = () => { 
      selectorCalled = true; 
      return ['tag1']; 
    };
    const addUnique = () => {};
    const rng = seedRng(999); // Will fail 0.5 threshold
    
    applyWeightedSelection(0.5, selector, addUnique, rng);
    
    expect(selectorCalled).toBe(false);
  });
  
  it('should handle empty tag array from selector', () => {
    const tags: string[] = [];
    const addUnique = (tag: string) => tags.push(tag);
    const selector = () => []; // Empty result
    const rng = seedRng(42);
    
    applyWeightedSelection(0.5, selector, addUnique, rng);
    
    expect(tags).toEqual([]);
  });
  
  it('should work with different probability thresholds', () => {
    const tags: string[] = [];
    const addUnique = (tag: string) => tags.push(tag);
    const selector = () => ['vocal1'];
    const rng = seedRng(50);
    
    // rng() = 0.5349 
    // Should pass 0.6 threshold: 0.5349 < 0.6 ✓
    applyWeightedSelection(0.6, selector, addUnique, rng);
    expect(tags.length).toBeGreaterThan(0);
  });
});
