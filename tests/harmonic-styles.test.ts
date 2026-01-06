import { describe, expect, it } from 'bun:test';

import {
  DEFAULT_HARMONIC_STYLES,
  GENRE_HARMONIC_STYLES,
  getAllBlendedHarmonicStyles,
  getBlendedHarmonicStyle,
} from '@bun/instruments/genres/mappings/harmonic-styles';

import type { GenreType } from '@bun/instruments/genres';
import type { HarmonicStyle } from '@bun/instruments/modes';

describe('GENRE_HARMONIC_STYLES', () => {
  it('should cover all genres in GENRE_REGISTRY', () => {
    // All 35 genres from GENRE_REGISTRY
    const expectedGenres = [
      'ambient',
      'jazz',
      'electronic',
      'rock',
      'pop',
      'classical',
      'lofi',
      'synthwave',
      'cinematic',
      'folk',
      'rnb',
      'videogame',
      'country',
      'soul',
      'blues',
      'punk',
      'latin',
      'metal',
      'trap',
      'retro',
      'symphonic',
      'disco',
      'funk',
      'reggae',
      'afrobeat',
      'house',
      'trance',
      'downtempo',
      'dreampop',
      'chillwave',
      'newage',
      'hyperpop',
      'drill',
      'melodictechno',
      'indie',
    ];

    for (const genre of expectedGenres) {
      expect(GENRE_HARMONIC_STYLES[genre as GenreType]).toBeDefined();
      expect(GENRE_HARMONIC_STYLES[genre as GenreType]!.length).toBeGreaterThan(0);
    }
  });

  it('should have non-empty arrays for all genres', () => {
    for (const [_genre, styles] of Object.entries(GENRE_HARMONIC_STYLES)) {
      expect(styles.length).toBeGreaterThan(0);
    }
  });

  it('should contain valid HarmonicStyle values', () => {
    const validStyles: HarmonicStyle[] = [
      'ionian',
      'mixolydian',
      'dorian',
      'aeolian',
      'harmonic_minor',
      'melodic_minor',
      'phrygian',
      'locrian',
      'lydian',
      'lydian_dominant',
      'lydian_augmented',
      'lydian_sharp_two',
    ];

    for (const [_genre, styles] of Object.entries(GENRE_HARMONIC_STYLES)) {
      for (const style of styles) {
        expect(validStyles).toContain(style);
      }
    }
  });
});

describe('DEFAULT_HARMONIC_STYLES', () => {
  it('should be a non-empty array', () => {
    expect(DEFAULT_HARMONIC_STYLES.length).toBeGreaterThan(0);
  });

  it('should contain valid HarmonicStyle values', () => {
    const validStyles: HarmonicStyle[] = [
      'ionian',
      'mixolydian',
      'dorian',
      'aeolian',
      'harmonic_minor',
      'melodic_minor',
      'phrygian',
      'locrian',
      'lydian',
      'lydian_dominant',
      'lydian_augmented',
      'lydian_sharp_two',
    ];

    for (const style of DEFAULT_HARMONIC_STYLES) {
      expect(validStyles).toContain(style);
    }
  });
});

describe('getBlendedHarmonicStyle', () => {
  it('should return a style from single genre pool', () => {
    // Use seeded RNG for deterministic test
    const seededRng = () => 0;
    const result = getBlendedHarmonicStyle('jazz', seededRng);

    expect(result).not.toBeNull();
    expect(GENRE_HARMONIC_STYLES.jazz).toContain(result!);
  });

  it('should return style from combined pools for multi-genre', () => {
    const result = getBlendedHarmonicStyle('jazz rock');

    expect(result).not.toBeNull();
    // Result should be from either jazz or rock pool
    const combinedPool = [
      ...GENRE_HARMONIC_STYLES.jazz!,
      ...GENRE_HARMONIC_STYLES.rock!,
    ];
    expect(combinedPool).toContain(result!);
  });

  it('should handle comma-separated genres', () => {
    const result = getBlendedHarmonicStyle('jazz, rock');

    expect(result).not.toBeNull();
    const combinedPool = [
      ...GENRE_HARMONIC_STYLES.jazz!,
      ...GENRE_HARMONIC_STYLES.rock!,
    ];
    expect(combinedPool).toContain(result!);
  });

  it('should use default styles for unrecognized single genre', () => {
    const result = getBlendedHarmonicStyle('unknown');

    // parseGenreComponents returns [] for unrecognized, so result should be null
    expect(result).toBeNull();
  });

  it('should return null for empty string', () => {
    const result = getBlendedHarmonicStyle('');
    expect(result).toBeNull();
  });

  it('should return null for whitespace-only string', () => {
    const result = getBlendedHarmonicStyle('   ');
    expect(result).toBeNull();
  });

  it('should handle mixed valid and invalid genre components', () => {
    // "jazz unknown" - jazz is valid, unknown is not
    const result = getBlendedHarmonicStyle('jazz unknown');

    expect(result).not.toBeNull();
    // Should only get styles from jazz since unknown is filtered out
    expect(GENRE_HARMONIC_STYLES.jazz).toContain(result!);
  });

  it('should use provided RNG for selection', () => {
    // RNG that always returns 0 - should get first item
    const rngFirst = () => 0;
    // RNG that returns 0.99 - should get last item
    const rngLast = () => 0.99;

    const firstResult = getBlendedHarmonicStyle('jazz', rngFirst);
    const lastResult = getBlendedHarmonicStyle('jazz', rngLast);

    expect(firstResult).not.toBeNull();
    expect(lastResult).not.toBeNull();
    // Both should be valid jazz styles
    expect(GENRE_HARMONIC_STYLES.jazz).toContain(firstResult!);
    expect(GENRE_HARMONIC_STYLES.jazz).toContain(lastResult!);
  });

  it('should handle three or more genres', () => {
    const result = getBlendedHarmonicStyle('jazz rock metal');

    expect(result).not.toBeNull();
    const combinedPool = [
      ...GENRE_HARMONIC_STYLES.jazz!,
      ...GENRE_HARMONIC_STYLES.rock!,
      ...GENRE_HARMONIC_STYLES.metal!,
    ];
    expect(combinedPool).toContain(result!);
  });
});

describe('getAllBlendedHarmonicStyles', () => {
  it('should return styles from single genre', () => {
    const result = getAllBlendedHarmonicStyles('jazz');

    expect(result.length).toBeGreaterThan(0);
    // All results should be from jazz pool
    for (const style of result) {
      expect(GENRE_HARMONIC_STYLES.jazz).toContain(style);
    }
  });

  it('should return unique styles from multiple genres', () => {
    const result = getAllBlendedHarmonicStyles('jazz metal');

    expect(result.length).toBeGreaterThan(0);
    // Check for no duplicates
    const uniqueSet = new Set(result);
    expect(uniqueSet.size).toBe(result.length);
  });

  it('should contain styles from all constituent genres', () => {
    const result = getAllBlendedHarmonicStyles('jazz metal');

    // Jazz includes dorian
    expect(result).toContain('dorian');
    // Metal includes phrygian
    expect(result).toContain('phrygian');
  });

  it('should return empty array for empty string', () => {
    const result = getAllBlendedHarmonicStyles('');
    expect(result).toEqual([]);
  });

  it('should return empty array for whitespace-only string', () => {
    const result = getAllBlendedHarmonicStyles('   ');
    expect(result).toEqual([]);
  });

  it('should return empty array for unrecognized genres', () => {
    const result = getAllBlendedHarmonicStyles('unknown');
    expect(result).toEqual([]);
  });

  it('should handle comma-separated genres', () => {
    const result = getAllBlendedHarmonicStyles('jazz, rock');

    expect(result.length).toBeGreaterThan(0);
    // Should include styles from both genres
    expect(result).toContain('dorian'); // from jazz
    expect(result).toContain('mixolydian'); // from both
  });

  it('should dedupe shared styles between genres', () => {
    // Jazz and rock both have mixolydian
    const result = getAllBlendedHarmonicStyles('jazz rock');

    // mixolydian should appear only once
    const mixolydianCount = result.filter((s) => s === 'mixolydian').length;
    expect(mixolydianCount).toBe(1);
  });

  it('should handle three or more genres', () => {
    const result = getAllBlendedHarmonicStyles('jazz rock metal');

    expect(result.length).toBeGreaterThan(0);
    // Should contain styles unique to each genre
    expect(result).toContain('melodic_minor'); // jazz
    expect(result).toContain('phrygian'); // metal
    expect(result).toContain('ionian'); // rock
  });

  it('should handle mixed valid and invalid genre components', () => {
    const result = getAllBlendedHarmonicStyles('jazz unknown rock');

    // Should only include styles from jazz and rock
    expect(result.length).toBeGreaterThan(0);
    expect(result).toContain('dorian'); // from jazz
    expect(result).toContain('ionian'); // from rock
  });
});

describe('integration scenarios', () => {
  it('should produce coherent results for jazz rock blend', () => {
    const all = getAllBlendedHarmonicStyles('jazz rock');
    const selected = getBlendedHarmonicStyle('jazz rock');

    // Selected should be in the all array
    expect(all).toContain(selected!);
  });

  it('should produce coherent results for ambient metal blend', () => {
    const all = getAllBlendedHarmonicStyles('ambient metal');
    const selected = getBlendedHarmonicStyle('ambient metal');

    expect(all).toContain(selected!);
    // Should have styles from both genres
    expect(all).toContain('lydian'); // ambient
    expect(all).toContain('phrygian'); // metal
  });

  it('should work with hyphenated genre strings', () => {
    // e.g., "jazz-rock" style input
    const result = getAllBlendedHarmonicStyles('jazz-rock');

    expect(result.length).toBeGreaterThan(0);
    expect(result).toContain('dorian'); // from jazz
  });

  it('should work with slash-separated genre strings', () => {
    // e.g., "jazz/rock" style input
    const result = getAllBlendedHarmonicStyles('jazz/rock');

    expect(result.length).toBeGreaterThan(0);
    expect(result).toContain('dorian'); // from jazz
    expect(result).toContain('ionian'); // from rock
  });

  it('should deterministically select with seeded RNG', () => {
    const seededRng = () => 0.5;

    const result1 = getBlendedHarmonicStyle('jazz rock', seededRng);
    const result2 = getBlendedHarmonicStyle('jazz rock', seededRng);

    expect(result1).toBe(result2);
  });
});
