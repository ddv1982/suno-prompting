/**
 * Inference Logic Tests
 *
 * Tests for:
 * - selectRecordingContextWithScene() - scene-based recording context override
 * - articulateInstrumentWithThemes() - theme-based articulation bias
 * - extractHarmonicComplexity() - harmonic complexity inference (now in @bun/keywords)
 *
 * @module tests/unit/inference-logic
 */

import { describe, expect, it, test } from 'bun:test';

import { extractHarmonicComplexity } from '@bun/keywords';
import { articulateInstrumentWithThemes } from '@bun/prompt/articulations';
import { selectRecordingContextWithScene } from '@bun/prompt/tags/recording-context';

// =============================================================================
// Test Utilities
// =============================================================================

/**
 * Creates a seeded RNG for deterministic tests.
 * Uses a simple LCG (Linear Congruential Generator).
 */
function createSeededRng(seed: number): () => number {
  let state = seed;
  return () => {
    state = (state * 1664525 + 1013904223) % 2 ** 32;
    return state / 2 ** 32;
  };
}

/**
 * Creates an RNG that returns a fixed value.
 */
function createFixedRng(value: number): () => number {
  return () => value;
}

// =============================================================================
// Task 3.1: selectRecordingContextWithScene Tests
// =============================================================================

describe('selectRecordingContextWithScene', () => {
  describe('scene keyword "studio" returns studio-related context', () => {
    it('matches "studio" in scene description', () => {
      const rng = createFixedRng(0); // Will select first item
      const result = selectRecordingContextWithScene('jazz', rng, 'recording in a studio session');
      expect(result).toBe('professional studio');
    });

    it('matches "studio" case-insensitively', () => {
      const rng = createFixedRng(0);
      const result = selectRecordingContextWithScene('rock', rng, 'Recording at STUDIO XYZ');
      expect(result).toBe('professional studio');
    });

    it('selects different studio contexts based on rng', () => {
      // Second item (index 1 of 3)
      const rng = createFixedRng(0.4);
      const result = selectRecordingContextWithScene('pop', rng, 'studio work');
      expect(result).toBe('tracked in a studio');
    });

    it('selects third studio context', () => {
      // Third item (index 2 of 3)
      const rng = createFixedRng(0.7);
      const result = selectRecordingContextWithScene('jazz', rng, 'studio session');
      expect(result).toBe('studio recording');
    });
  });

  describe('scene keyword "live" returns live performance context', () => {
    it('matches "live" in scene description', () => {
      const rng = createFixedRng(0);
      const result = selectRecordingContextWithScene('rock', rng, 'live concert at the arena');
      expect(result).toBe('live room sound');
    });

    it('matches "live" in various positions', () => {
      const rng = createFixedRng(0.4);
      const result = selectRecordingContextWithScene('jazz', rng, 'a live performance tonight');
      expect(result).toBe('live concert');
    });

    it('selects third live context', () => {
      const rng = createFixedRng(0.7);
      const result = selectRecordingContextWithScene('blues', rng, 'playing live on stage');
      expect(result).toBe('live performance');
    });
  });

  describe('scene keyword "bedroom" returns bedroom production context', () => {
    it('matches "bedroom" in scene description', () => {
      const rng = createFixedRng(0);
      const result = selectRecordingContextWithScene(
        'electronic',
        rng,
        'making beats in my bedroom'
      );
      expect(result).toBe('bedroom production');
    });

    it('selects different bedroom contexts', () => {
      const rng = createFixedRng(0.4);
      const result = selectRecordingContextWithScene('lo-fi', rng, 'bedroom producer vibes');
      expect(result).toBe('home recording');
    });
  });

  describe('scene keyword "outdoor" returns outdoor context', () => {
    it('matches "outdoor" in scene description', () => {
      const rng = createFixedRng(0);
      const result = selectRecordingContextWithScene('folk', rng, 'outdoor festival performance');
      expect(result).toBe('outdoor ambience');
    });

    it('selects different outdoor contexts', () => {
      const rng = createFixedRng(0.4);
      const result = selectRecordingContextWithScene('ambient', rng, 'outdoor nature sounds');
      expect(result).toBe('field recording');
    });
  });

  describe('scene keyword "club" returns club context', () => {
    it('matches "club" in scene description', () => {
      const rng = createFixedRng(0);
      const result = selectRecordingContextWithScene('house', rng, 'night at the club');
      expect(result).toBe('club sound system');
    });

    it('selects different club contexts', () => {
      const rng = createFixedRng(0.4);
      const result = selectRecordingContextWithScene('techno', rng, 'club vibes');
      expect(result).toBe('dancefloor ready');
    });
  });

  describe('falls back to genre-based selection when no keyword match', () => {
    it('falls back for unrelated scene', () => {
      const rng = createSeededRng(42);
      const result = selectRecordingContextWithScene('jazz', rng, 'walking in the park');
      // Should return something from jazz genre contexts or generic pool
      expect(result).toBeTruthy();
      expect(typeof result).toBe('string');
    });

    it('falls back when scene is undefined', () => {
      const rng = createSeededRng(42);
      const result = selectRecordingContextWithScene('jazz', rng);
      // Should return jazz-specific or generic context
      expect(result).toBeTruthy();
      expect(typeof result).toBe('string');
    });

    it('falls back when scene is empty string', () => {
      const rng = createSeededRng(42);
      const result = selectRecordingContextWithScene('rock', rng, '');
      expect(result).toBeTruthy();
      expect(typeof result).toBe('string');
    });
  });

  describe('keyword matching priority', () => {
    it('matches first keyword found in order', () => {
      // "studio" appears before "live" in SCENE_RECORDING_KEYWORDS
      // But Object.entries order should match insertion order
      const rng = createFixedRng(0);
      const result = selectRecordingContextWithScene('rock', rng, 'live studio session');
      // Since "studio" is checked first, it should match studio context
      expect(result).toBe('professional studio');
    });
  });

  describe('determinism', () => {
    it('produces same result with same seed', () => {
      const rng1 = createSeededRng(123);
      const rng2 = createSeededRng(123);

      const result1 = selectRecordingContextWithScene('jazz', rng1, 'in the studio');
      const result2 = selectRecordingContextWithScene('jazz', rng2, 'in the studio');

      expect(result1).toBe(result2);
    });
  });
});

// =============================================================================
// Task 3.2: articulateInstrumentWithThemes Tests
// =============================================================================

describe('articulateInstrumentWithThemes', () => {
  describe('theme "gentle" biases guitar toward fingerpicked/clean', () => {
    it('returns biased articulation for gentle theme + guitar', () => {
      // RNG returns 0.1 (< ARTICULATION_CHANCE), then 0.3 (< 0.6 for bias), then 0 for selection
      let callCount = 0;
      const rng = () => {
        callCount++;
        if (callCount === 1) return 0.1; // Pass articulation chance
        if (callCount === 2) return 0.3; // Use biased articulation (< 0.6)
        return 0; // Select first item
      };

      const result = articulateInstrumentWithThemes('guitar', rng, ['gentle']);
      expect(['Fingerpicked guitar', 'Clean guitar']).toContain(result);
    });

    it('returns biased articulation for gentle theme + acoustic guitar', () => {
      let callCount = 0;
      const rng = () => {
        callCount++;
        if (callCount === 1) return 0.1;
        if (callCount === 2) return 0.3;
        return 0;
      };

      const result = articulateInstrumentWithThemes('acoustic guitar', rng, ['gentle']);
      expect(['Fingerpicked acoustic guitar', 'Clean acoustic guitar']).toContain(result);
    });

    it('biases piano toward gentle/sparse for gentle theme', () => {
      let callCount = 0;
      const rng = () => {
        callCount++;
        if (callCount === 1) return 0.1;
        if (callCount === 2) return 0.3;
        return 0;
      };

      const result = articulateInstrumentWithThemes('piano', rng, ['gentle']);
      expect(['Gentle piano', 'Sparse piano']).toContain(result);
    });
  });

  describe('theme "aggressive" biases toward crunchy/overdriven', () => {
    it('returns biased articulation for aggressive theme + guitar', () => {
      let callCount = 0;
      const rng = () => {
        callCount++;
        if (callCount === 1) return 0.1;
        if (callCount === 2) return 0.3;
        return 0;
      };

      const result = articulateInstrumentWithThemes('guitar', rng, ['aggressive']);
      expect(['Crunchy guitar', 'Overdriven guitar']).toContain(result);
    });

    it('biases drums toward punchy/driving for aggressive theme', () => {
      let callCount = 0;
      const rng = () => {
        callCount++;
        if (callCount === 1) return 0.1;
        if (callCount === 2) return 0.3;
        return 0;
      };

      const result = articulateInstrumentWithThemes('drums', rng, ['aggressive']);
      expect(['Punchy drums', 'Driving drums']).toContain(result);
    });
  });

  describe('theme "dreamy" biases toward reverb soaked/shimmering', () => {
    it('returns biased articulation for dreamy theme + guitar', () => {
      let callCount = 0;
      const rng = () => {
        callCount++;
        if (callCount === 1) return 0.1;
        if (callCount === 2) return 0.3;
        return 0;
      };

      const result = articulateInstrumentWithThemes('guitar', rng, ['dreamy']);
      expect(['Reverb Soaked guitar', 'Chorus Drenched guitar']).toContain(result);
    });

    it('biases synth toward shimmering/evolving for dreamy theme', () => {
      let callCount = 0;
      const rng = () => {
        callCount++;
        if (callCount === 1) return 0.1;
        if (callCount === 2) return 0.3;
        return 0;
      };

      const result = articulateInstrumentWithThemes('synth', rng, ['dreamy']);
      expect(['Shimmering synth', 'Evolving synth']).toContain(result);
    });
  });

  describe('theme "intimate" biases piano and strings', () => {
    it('biases piano toward sparse/gentle for intimate theme', () => {
      let callCount = 0;
      const rng = () => {
        callCount++;
        if (callCount === 1) return 0.1;
        if (callCount === 2) return 0.3;
        return 0;
      };

      const result = articulateInstrumentWithThemes('piano', rng, ['intimate']);
      expect(['Sparse piano', 'Gentle piano']).toContain(result);
    });

    it('biases strings toward warm/legato for intimate theme', () => {
      let callCount = 0;
      const rng = () => {
        callCount++;
        if (callCount === 1) return 0.1;
        if (callCount === 2) return 0.3;
        return 0;
      };

      const result = articulateInstrumentWithThemes('strings', rng, ['intimate']);
      expect(['Warm strings', 'Legato strings']).toContain(result);
    });
  });

  describe('falls back to random articulation when no theme match', () => {
    it('falls back when themes array is empty', () => {
      const rng = createSeededRng(42);
      const result = articulateInstrumentWithThemes('guitar', rng, []);
      // Should return something from standard guitar articulations
      expect(result).toBeTruthy();
      expect(result).toContain('guitar');
    });

    it('falls back when themes do not match any bias', () => {
      const rng = createSeededRng(42);
      const result = articulateInstrumentWithThemes('guitar', rng, ['nostalgic', 'retro']);
      // Should return standard articulation
      expect(result).toBeTruthy();
      expect(result).toContain('guitar');
    });

    it('falls back when themes undefined', () => {
      const rng = createSeededRng(42);
      const result = articulateInstrumentWithThemes('piano', rng);
      expect(result).toBeTruthy();
      expect(result).toContain('piano');
    });

    it('falls back on 40% chance even with matching theme', () => {
      // RNG returns values that pass articulation chance but fail bias chance (>= 0.6)
      let callCount = 0;
      const rng = () => {
        callCount++;
        if (callCount === 1) return 0.1; // Pass articulation chance
        if (callCount === 2) return 0.7; // Fail bias chance (>= 0.6)
        return 0.3; // For standard articulation selection
      };

      const result = articulateInstrumentWithThemes('guitar', rng, ['gentle']);
      // Should return standard articulation, not biased
      expect(result).toBeTruthy();
      expect(result).toContain('guitar');
    });
  });

  describe('returns unarticulated instrument when chance fails', () => {
    it('returns original instrument when rng > articulation chance', () => {
      // RNG returns > ARTICULATION_CHANCE (0.6 by default)
      const rng = createFixedRng(0.9);
      const result = articulateInstrumentWithThemes('guitar', rng, ['gentle'], 0.6);
      expect(result).toBe('guitar');
    });
  });

  describe('handles unknown instruments gracefully', () => {
    it('returns original instrument for unknown instrument', () => {
      let callCount = 0;
      const rng = () => {
        callCount++;
        if (callCount === 1) return 0.1;
        return 0.3;
      };

      const result = articulateInstrumentWithThemes('theremin', rng, ['gentle']);
      expect(result).toBe('theremin');
    });
  });

  describe('case insensitivity', () => {
    it('matches themes case-insensitively', () => {
      let callCount = 0;
      const rng = () => {
        callCount++;
        if (callCount === 1) return 0.1;
        if (callCount === 2) return 0.3;
        return 0;
      };

      const result = articulateInstrumentWithThemes('guitar', rng, ['GENTLE']);
      expect(['Fingerpicked guitar', 'Clean guitar']).toContain(result);
    });
  });
});

// =============================================================================
// Task 3.3: extractHarmonicComplexity Tests
// =============================================================================

describe('extractHarmonicComplexity', () => {
  describe('returns 1.8 for ≥2 matches', () => {
    it('returns 1.8 for "jazz progressive song"', () => {
      const result = extractHarmonicComplexity('a jazz progressive song');
      expect(result).toBe(1.8);
    });

    it('returns 1.8 for "modal chromatic exploration"', () => {
      const result = extractHarmonicComplexity('modal chromatic exploration');
      expect(result).toBe(1.8);
    });

    it('returns 1.8 for "complex sophisticated harmony"', () => {
      const result = extractHarmonicComplexity('complex sophisticated harmony');
      expect(result).toBe(1.8);
    });

    it('returns 1.8 for "advanced extended chords"', () => {
      const result = extractHarmonicComplexity('advanced extended chords progression');
      expect(result).toBe(1.8);
    });

    it('returns 1.8 for multiple indicators', () => {
      const result = extractHarmonicComplexity(
        'a jazz progressive modal piece with extended chords'
      );
      expect(result).toBe(1.8);
    });
  });

  describe('returns 1.4 for 1 match', () => {
    it('returns 1.4 for "modal exploration"', () => {
      const result = extractHarmonicComplexity('a modal exploration');
      expect(result).toBe(1.4);
    });

    it('returns 1.4 for "chromatic passage"', () => {
      const result = extractHarmonicComplexity('a chromatic passage in the song');
      expect(result).toBe(1.4);
    });

    it('returns 1.4 for "sophisticated melody"', () => {
      const result = extractHarmonicComplexity('a sophisticated melody');
      expect(result).toBe(1.4);
    });

    it('returns 1.4 for "progressive rock"', () => {
      const result = extractHarmonicComplexity('epic progressive rock');
      expect(result).toBe(1.4);
    });

    it('returns 1.4 for "jazz vibes"', () => {
      const result = extractHarmonicComplexity('smooth jazz vibes');
      expect(result).toBe(1.4);
    });

    it('returns 1.4 for "complex rhythms"', () => {
      const result = extractHarmonicComplexity('complex rhythms and beats');
      expect(result).toBe(1.4);
    });

    it('returns 1.4 for "polytonal sounds"', () => {
      const result = extractHarmonicComplexity('polytonal sounds');
      expect(result).toBe(1.4);
    });
  });

  describe('returns 1.0 for no matches', () => {
    it('returns 1.0 for "simple pop song"', () => {
      const result = extractHarmonicComplexity('a simple pop song');
      expect(result).toBe(1.0);
    });

    it('returns 1.0 for "upbeat dance track"', () => {
      const result = extractHarmonicComplexity('an upbeat dance track');
      expect(result).toBe(1.0);
    });

    it('returns 1.0 for "relaxing ambient music"', () => {
      const result = extractHarmonicComplexity('relaxing ambient music');
      expect(result).toBe(1.0);
    });

    it('returns 1.0 for empty string', () => {
      const result = extractHarmonicComplexity('');
      expect(result).toBe(1.0);
    });
  });

  describe('case insensitivity', () => {
    it('matches "JAZZ" case-insensitively', () => {
      const result = extractHarmonicComplexity('A JAZZ FUSION track');
      expect(result).toBe(1.4);
    });

    it('matches "Progressive" case-insensitively', () => {
      const result = extractHarmonicComplexity('Progressive rock anthem');
      expect(result).toBe(1.4);
    });

    it('matches mixed case indicators', () => {
      const result = extractHarmonicComplexity('JAZZ Progressive fusion');
      expect(result).toBe(1.8);
    });
  });

  describe('multi-word indicator "extended chords"', () => {
    it('matches "extended chords" as single indicator', () => {
      const result = extractHarmonicComplexity('a song with extended chords');
      expect(result).toBe(1.4);
    });

    it('matches "extended chords" with other indicator for 1.8', () => {
      const result = extractHarmonicComplexity('jazz with extended chords');
      expect(result).toBe(1.8);
    });
  });

  describe('parameterized tests', () => {
    test.each([
      // 1.8 cases (≥2 matches)
      ['jazz progressive', 1.8],
      ['modal chromatic', 1.8],
      ['complex sophisticated', 1.8],
      ['advanced jazz', 1.8],
      ['progressive polytonal', 1.8],
      // 1.4 cases (1 match)
      ['just jazz', 1.4],
      ['only progressive', 1.4],
      ['modal piece', 1.4],
      ['chromatic run', 1.4],
      ['sophisticated sound', 1.4],
      ['complex piece', 1.4],
      ['advanced technique', 1.4],
      ['extended chords only', 1.4],
      ['polytonal harmony', 1.4],
      // 1.0 cases (no matches)
      ['simple song', 1.0],
      ['pop music', 1.0],
      ['rock ballad', 1.0],
      ['electronic beat', 1.0],
      ['', 1.0],
    ])('extractHarmonicComplexity("%s") returns %p', (description, expected) => {
      expect(extractHarmonicComplexity(description)).toBe(expected);
    });
  });
});

// =============================================================================
// Integration: Inference logic functions work together
// =============================================================================

describe('Inference Logic Integration', () => {
  it('all inference functions are exported and callable', () => {
    expect(typeof selectRecordingContextWithScene).toBe('function');
    expect(typeof articulateInstrumentWithThemes).toBe('function');
    expect(typeof extractHarmonicComplexity).toBe('function');
  });

  it('scene-based recording context integrates with genre fallback', () => {
    const rng = createSeededRng(42);

    // With keyword match
    const studioContext = selectRecordingContextWithScene('jazz', rng, 'studio session');
    expect(studioContext).toContain('studio');

    // Without keyword match - should fall back to genre
    const rng2 = createSeededRng(42);
    const fallbackContext = selectRecordingContextWithScene('jazz', rng2, 'walking in nature');
    expect(fallbackContext).toBeTruthy();
  });

  it('theme-based articulation works with various instrument types', () => {
    const rng = createSeededRng(42);

    // Test different instrument categories with matching themes
    const gentleGuitar = articulateInstrumentWithThemes('guitar', rng, ['gentle'], 1.0);
    expect(gentleGuitar).toContain('guitar');

    const rng2 = createSeededRng(42);
    const aggressiveDrums = articulateInstrumentWithThemes('drums', rng2, ['aggressive'], 1.0);
    expect(aggressiveDrums).toContain('drums');

    const rng3 = createSeededRng(42);
    const dreamySynth = articulateInstrumentWithThemes('synth', rng3, ['dreamy'], 1.0);
    expect(dreamySynth).toContain('synth');
  });

  it('harmonic complexity works with various music descriptions', () => {
    // High complexity (jazz + progressive)
    expect(extractHarmonicComplexity('a jazz-influenced progressive rock epic')).toBe(1.8);

    // Medium complexity (single indicator)
    expect(extractHarmonicComplexity('smooth jazz evening vibes')).toBe(1.4);

    // No complexity indicators
    expect(extractHarmonicComplexity('upbeat summer pop track')).toBe(1.0);
  });
});
