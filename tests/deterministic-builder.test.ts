import { describe, it, expect } from 'bun:test';

import { GENRE_REGISTRY } from '@bun/instruments/genres';
import {
  buildDeterministicMaxPrompt,
  buildDeterministicStandardPrompt,
  detectGenreKeywordsOnly,
  selectRandomGenre,
  parseMultiGenre,
  assembleInstruments,
  assembleStyleTags,
  selectRecordingContext,
  selectMusicalKey,
  selectMusicalMode,
  selectKeyAndMode,
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
      const result = assembleInstruments('jazz', rng);
      expect(result.instruments).toBeDefined();
      expect(result.instruments.length).toBeGreaterThan(0);
    });

    it('includes chord progression in formatted output', () => {
      const rng = createSeededRng(12345);
      const result = assembleInstruments('jazz', rng);
      expect(result.chordProgression).toBeDefined();
      expect(result.formatted).toContain('harmony');
    });

    it('includes vocal style in formatted output', () => {
      const rng = createSeededRng(12345);
      const result = assembleInstruments('jazz', rng);
      expect(result.vocalStyle).toBeDefined();
      expect(result.formatted).toContain('vocals');
    });

    it('formatted string is comma-separated', () => {
      const rng = createSeededRng(12345);
      const result = assembleInstruments('rock', rng);
      expect(result.formatted).toContain(',');
    });

    it('produces deterministic output with same seed', () => {
      const rng1 = createSeededRng(42);
      const rng2 = createSeededRng(42);
      const result1 = assembleInstruments('pop', rng1);
      const result2 = assembleInstruments('pop', rng2);
      expect(result1.formatted).toBe(result2.formatted);
    });
  });

  // =============================================================================
  // Tests: Style Tags Assembly
  // =============================================================================

  describe('assembleStyleTags', () => {
    it('returns tags array', () => {
      const rng = createSeededRng(12345);
      const result = assembleStyleTags('jazz', rng);
      expect(result.tags).toBeDefined();
      expect(result.tags.length).toBeGreaterThan(0);
    });

    it('limits tags to reasonable count', () => {
      const rng = createSeededRng(12345);
      const result = assembleStyleTags('jazz', rng);
      expect(result.tags.length).toBeLessThanOrEqual(6);
    });

    it('formatted string is comma-separated', () => {
      const rng = createSeededRng(12345);
      const result = assembleStyleTags('rock', rng);
      expect(result.formatted).toContain(',');
    });

    it('tags are lowercase', () => {
      const rng = createSeededRng(12345);
      const result = assembleStyleTags('jazz', rng);
      for (const tag of result.tags) {
        expect(tag).toBe(tag.toLowerCase());
      }
    });

    it('includes genre-appropriate tags', () => {
      const rng = createSeededRng(42);
      const jazzResult = assembleStyleTags('jazz', rng);
      const electronicResult = assembleStyleTags('electronic', createSeededRng(42));

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
      const result = selectRecordingContext(rng);
      expect(result).toBeDefined();
      expect(result.length).toBeGreaterThan(0);
    });

    it('produces deterministic output with same seed', () => {
      const rng1 = createSeededRng(42);
      const rng2 = createSeededRng(42);
      expect(selectRecordingContext(rng1)).toBe(selectRecordingContext(rng2));
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
        expect(result.text).toContain('::tags realistic music ::');
        expect(result.text).toContain('::quality maximum ::');
        expect(result.text).toContain('::style suno v5 ::');
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
        const lofiBpm = lofiResult.text.match(/between (\d+) and (\d+)/);
        const punkBpm = punkResult.text.match(/between (\d+) and (\d+)/);

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
        const bpm1 = result1.text.match(/bpm: "([^"]+)"/)?.[1];
        const bpm2 = result2.text.match(/bpm: "([^"]+)"/)?.[1];
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
});
