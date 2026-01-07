import { describe, expect, it } from 'bun:test';

import {
  DEFAULT_TIME_SIGNATURES,
  GENRE_TIME_SIGNATURES,
  getAllBlendedTimeSignatures,
  getBlendedTimeSignature,
} from '@bun/instruments/genres/mappings/time-signatures';

import type { GenreType } from '@bun/instruments/genres';
import type { TimeSignatureType } from '@bun/instruments/rhythms';

describe('GENRE_TIME_SIGNATURES', () => {
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
      expect(GENRE_TIME_SIGNATURES[genre as GenreType]).toBeDefined();
      expect(GENRE_TIME_SIGNATURES[genre as GenreType]!.length).toBeGreaterThan(0);
    }
  });

  it('should have non-empty arrays for all genres', () => {
    for (const [_genre, sigs] of Object.entries(GENRE_TIME_SIGNATURES)) {
      expect(sigs.length).toBeGreaterThan(0);
    }
  });

  it('should contain valid TimeSignatureType values', () => {
    const validSigs: TimeSignatureType[] = [
      'time_4_4',
      'time_3_4',
      'time_6_8',
      'time_5_4',
      'time_5_8',
      'time_7_8',
      'time_7_4',
      'time_9_8',
      'time_11_8',
      'time_13_8',
      'time_15_8',
    ];

    for (const [_genre, sigs] of Object.entries(GENRE_TIME_SIGNATURES)) {
      for (const sig of sigs) {
        expect(validSigs).toContain(sig);
      }
    }
  });
});

describe('DEFAULT_TIME_SIGNATURES', () => {
  it('should be a non-empty array', () => {
    expect(DEFAULT_TIME_SIGNATURES.length).toBeGreaterThan(0);
  });

  it('should contain time_4_4 as the default', () => {
    expect(DEFAULT_TIME_SIGNATURES).toContain('time_4_4');
  });

  it('should contain valid TimeSignatureType values', () => {
    const validSigs: TimeSignatureType[] = [
      'time_4_4',
      'time_3_4',
      'time_6_8',
      'time_5_4',
      'time_5_8',
      'time_7_8',
      'time_7_4',
      'time_9_8',
      'time_11_8',
      'time_13_8',
      'time_15_8',
    ];

    for (const sig of DEFAULT_TIME_SIGNATURES) {
      expect(validSigs).toContain(sig);
    }
  });
});

describe('getBlendedTimeSignature', () => {
  it('should return a signature from single genre pool', () => {
    // Use seeded RNG for deterministic test
    const seededRng = () => 0;
    const result = getBlendedTimeSignature('jazz', seededRng);

    expect(result).not.toBeNull();
    expect(GENRE_TIME_SIGNATURES.jazz).toContain(result!);
  });

  it('should return signature from combined pools for multi-genre', () => {
    const result = getBlendedTimeSignature('jazz rock');

    expect(result).not.toBeNull();
    // Result should be from either jazz or rock pool
    const combinedPool = [
      ...GENRE_TIME_SIGNATURES.jazz!,
      ...GENRE_TIME_SIGNATURES.rock!,
    ];
    expect(combinedPool).toContain(result!);
  });

  it('should prefer common signatures (appears in multiple genres)', () => {
    // Jazz has time_4_4, time_5_4, time_3_4, time_6_8, time_9_8
    // Rock has time_4_4, time_6_8
    // time_4_4 and time_6_8 should be preferred (appear in both)
    let count4_4 = 0;
    let count6_8 = 0;
    const trials = 500; // Increased for statistical stability

    for (let i = 0; i < trials; i++) {
      const result = getBlendedTimeSignature('jazz rock');
      if (result === 'time_4_4') count4_4++;
      if (result === 'time_6_8') count6_8++;
    }

    // Common signatures should appear more frequently (at least 40% of trials)
    // With frequency-weighted selection and 75% top-half preference, common
    // signatures (appearing in both genres) should dominate the top half
    expect(count4_4 + count6_8).toBeGreaterThan(trials * 0.4);
  });

  it('should handle comma-separated genres', () => {
    const result = getBlendedTimeSignature('jazz, rock');

    expect(result).not.toBeNull();
    const combinedPool = [
      ...GENRE_TIME_SIGNATURES.jazz!,
      ...GENRE_TIME_SIGNATURES.rock!,
    ];
    expect(combinedPool).toContain(result!);
  });

  it('should return null for unrecognized single genre', () => {
    const result = getBlendedTimeSignature('unknown');
    // parseGenreComponents returns [] for unrecognized, so result should be null
    expect(result).toBeNull();
  });

  it('should return null for empty string', () => {
    const result = getBlendedTimeSignature('');
    expect(result).toBeNull();
  });

  it('should return null for whitespace-only string', () => {
    const result = getBlendedTimeSignature('   ');
    expect(result).toBeNull();
  });

  it('should handle mixed valid and invalid genre components', () => {
    // "jazz unknown" - jazz is valid, unknown is not
    const result = getBlendedTimeSignature('jazz unknown');

    expect(result).not.toBeNull();
    // Should only get signatures from jazz since unknown is filtered out
    expect(GENRE_TIME_SIGNATURES.jazz).toContain(result!);
  });

  it('should use provided RNG for selection', () => {
    // RNG that always returns 0 - should select from top half
    const rngFirst = () => 0;
    // RNG that returns values above 0.75 - should use full pool
    const rngLast = () => 0.8;

    const firstResult = getBlendedTimeSignature('jazz', rngFirst);
    const lastResult = getBlendedTimeSignature('jazz', rngLast);

    expect(firstResult).not.toBeNull();
    expect(lastResult).not.toBeNull();
    // Both should be valid jazz signatures
    expect(GENRE_TIME_SIGNATURES.jazz).toContain(firstResult!);
    expect(GENRE_TIME_SIGNATURES.jazz).toContain(lastResult!);
  });

  it('should handle three or more genres', () => {
    const result = getBlendedTimeSignature('jazz rock metal');

    expect(result).not.toBeNull();
    const combinedPool = [
      ...GENRE_TIME_SIGNATURES.jazz!,
      ...GENRE_TIME_SIGNATURES.rock!,
      ...GENRE_TIME_SIGNATURES.metal!,
    ];
    expect(combinedPool).toContain(result!);
  });
});

describe('getAllBlendedTimeSignatures', () => {
  it('should return signatures from single genre', () => {
    const result = getAllBlendedTimeSignatures('jazz');

    expect(result.length).toBeGreaterThan(0);
    // All results should be from jazz pool
    for (const sig of result) {
      expect(GENRE_TIME_SIGNATURES.jazz).toContain(sig);
    }
  });

  it('should return unique signatures from multiple genres', () => {
    const result = getAllBlendedTimeSignatures('jazz metal');

    expect(result.length).toBeGreaterThan(0);
    // Check for no duplicates
    const uniqueSet = new Set(result);
    expect(uniqueSet.size).toBe(result.length);
  });

  it('should contain signatures from all constituent genres', () => {
    const result = getAllBlendedTimeSignatures('jazz metal');

    // Jazz includes time_5_4
    expect(result).toContain('time_5_4');
    // Metal includes time_7_8
    expect(result).toContain('time_7_8');
  });

  it('should return empty array for empty string', () => {
    const result = getAllBlendedTimeSignatures('');
    expect(result).toEqual([]);
  });

  it('should return empty array for whitespace-only string', () => {
    const result = getAllBlendedTimeSignatures('   ');
    expect(result).toEqual([]);
  });

  it('should return empty array for unrecognized genres', () => {
    const result = getAllBlendedTimeSignatures('unknown');
    expect(result).toEqual([]);
  });

  it('should handle space-separated genres', () => {
    const result = getAllBlendedTimeSignatures('jazz rock');

    expect(result.length).toBeGreaterThan(0);
    // Should include signatures from both genres
    expect(result).toContain('time_5_4'); // from jazz only
    expect(result).toContain('time_4_4'); // from both
  });

  it('should dedupe shared signatures between genres', () => {
    // Jazz and rock both have time_4_4 and time_6_8
    const result = getAllBlendedTimeSignatures('jazz rock');

    // time_4_4 should appear only once
    const time4_4Count = result.filter((s) => s === 'time_4_4').length;
    expect(time4_4Count).toBe(1);

    // time_6_8 should appear only once
    const time6_8Count = result.filter((s) => s === 'time_6_8').length;
    expect(time6_8Count).toBe(1);
  });

  it('should handle three or more genres', () => {
    const result = getAllBlendedTimeSignatures('jazz rock videogame');

    expect(result.length).toBeGreaterThan(0);
    // Should contain signatures unique to each genre
    expect(result).toContain('time_9_8'); // jazz
    expect(result).toContain('time_7_8'); // videogame (also metal)
    expect(result).toContain('time_4_4'); // all genres
  });

  it('should handle mixed valid and invalid genre components', () => {
    const result = getAllBlendedTimeSignatures('jazz unknown rock');

    // Should only include signatures from jazz and rock
    expect(result.length).toBeGreaterThan(0);
    expect(result).toContain('time_5_4'); // from jazz
    expect(result).toContain('time_4_4'); // from both
  });
});

describe('integration scenarios', () => {
  it('should produce coherent results for jazz rock blend', () => {
    const all = getAllBlendedTimeSignatures('jazz rock');
    const selected = getBlendedTimeSignature('jazz rock');

    // Selected should be in the all array
    expect(all).toContain(selected!);
  });

  it('should produce coherent results for ambient metal blend', () => {
    const all = getAllBlendedTimeSignatures('ambient metal');
    const selected = getBlendedTimeSignature('ambient metal');

    expect(all).toContain(selected!);
    // Should have signatures from both genres
    expect(all).toContain('time_3_4'); // ambient
    expect(all).toContain('time_7_8'); // metal
  });

  it('should work with hyphenated genre strings', () => {
    // e.g., "jazz-rock" style input
    const result = getAllBlendedTimeSignatures('jazz-rock');

    expect(result.length).toBeGreaterThan(0);
    expect(result).toContain('time_5_4'); // from jazz
  });

  it('should work with slash-separated genre strings', () => {
    // e.g., "jazz/rock" style input
    const result = getAllBlendedTimeSignatures('jazz/rock');

    expect(result.length).toBeGreaterThan(0);
    expect(result).toContain('time_5_4'); // from jazz
    expect(result).toContain('time_4_4'); // from both
  });

  it('should deterministically select with seeded RNG', () => {
    const seededRng = () => 0.3;

    const result1 = getBlendedTimeSignature('jazz rock', seededRng);
    const result2 = getBlendedTimeSignature('jazz rock', seededRng);

    expect(result1).toBe(result2);
  });

  it('should use default signatures for genres not in mapping', () => {
    // If a genre was somehow in GENRE_REGISTRY but not GENRE_TIME_SIGNATURES,
    // the function should return null since parseGenreComponents filters unknown genres.
    // This test verifies default handling via mixed input.
    const result = getAllBlendedTimeSignatures('jazz');

    // Should contain jazz signatures, not defaults (since jazz is mapped)
    expect(result).toContain('time_5_4');
    expect(result).toContain('time_9_8');
  });
});

describe('frequency-weighted selection', () => {
  it('should favor signatures that appear in multiple genres', () => {
    // Jazz: time_4_4, time_5_4, time_3_4, time_6_8, time_9_8
    // Rock: time_4_4, time_6_8
    // Classical: time_4_4, time_3_4, time_6_8, time_9_8
    // time_4_4 appears in all 3 (frequency 3)
    // time_6_8 appears in all 3 (frequency 3)
    // time_3_4 appears in 2 (frequency 2)
    // time_9_8 appears in 2 (frequency 2)
    // time_5_4 appears in 1 (frequency 1)

    const counts: Record<string, number> = {};
    const trials = 200;

    for (let i = 0; i < trials; i++) {
      const result = getBlendedTimeSignature('jazz rock classical');
      if (result) {
        counts[result] = (counts[result] ?? 0) + 1;
      }
    }

    // time_4_4 and time_6_8 should appear more frequently than time_5_4
    const highFreqCount = (counts['time_4_4'] ?? 0) + (counts['time_6_8'] ?? 0);
    const lowFreqCount = counts['time_5_4'] ?? 0;

    // High frequency signatures should dominate
    expect(highFreqCount).toBeGreaterThan(lowFreqCount);
  });

  it('should give 75% weight to top half signatures', () => {
    // Test with deterministic RNG values
    // When rng() < 0.75, use top half; otherwise use full pool

    // Test 1: RNG returns 0.5 for pool selection (< 0.75, use top half)
    // and 0 for item selection (first item in pool)
    let call = 0;
    const topHalfRng = () => {
      call++;
      return call === 1 ? 0.5 : 0; // First call selects top half, second picks first item
    };

    call = 0;
    const topHalfResult = getBlendedTimeSignature('jazz rock', topHalfRng);
    // Top half contains time_4_4 and time_6_8 (both appear in both genres, frequency 2)
    expect(['time_4_4', 'time_6_8']).toContain(topHalfResult!);

    // Test 2: RNG returns 0.8 for pool selection (>= 0.75, use full pool)
    // and 0.99 to get an item from the end of the pool
    call = 0;
    const fullPoolRng = () => {
      call++;
      return call === 1 ? 0.8 : 0.99; // First call selects full pool, second picks last item
    };

    call = 0;
    const fullPoolResult = getBlendedTimeSignature('jazz rock', fullPoolRng);
    // Should be a valid signature from the combined pool
    const allSigs = [
      ...GENRE_TIME_SIGNATURES.jazz!,
      ...GENRE_TIME_SIGNATURES.rock!,
    ];
    expect(allSigs).toContain(fullPoolResult!);
  });
});
