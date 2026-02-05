import { describe, expect, it } from 'bun:test';

import {
  DEFAULT_POLYRHYTHMS,
  GENRE_POLYRHYTHMS,
  getAllBlendedPolyrhythms,
  getBlendedPolyrhythm,
} from '@bun/instruments/genres/mappings/polyrhythms';

import type { GenreType } from '@bun/instruments/genres';
import type { PolyrhythmType } from '@bun/instruments/rhythms';

describe('GENRE_POLYRHYTHMS', () => {
  it('should only include genres with strong polyrhythmic traditions', () => {
    // These genres should have polyrhythm mappings
    const genresWithPolyrhythms = [
      'afrobeat',
      'latin',
      'jazz',
      'metal',
      'funk',
      'soul',
      'blues',
      'electronic',
      'folk',
      'classical',
      'ambient',
      'reggae',
      'downtempo',
      'house',
      'videogame',
      'symphonic',
      'cinematic',
      'indie',
    ];

    for (const genre of genresWithPolyrhythms) {
      expect(GENRE_POLYRHYTHMS[genre as GenreType]).toBeDefined();
      expect(GENRE_POLYRHYTHMS[genre as GenreType]!.length).toBeGreaterThan(0);
    }
  });

  it('should NOT include genres without strong polyrhythmic traditions', () => {
    // These genres should NOT have polyrhythm mappings
    const genresWithoutPolyrhythms = [
      'pop',
      'trap',
      'punk',
      'drill',
      'hyperpop',
      'synthwave',
      'trance',
      'lofi',
      'dreampop',
      'chillwave',
      'newage',
      'melodictechno',
      'country',
      'rock',
      'rnb',
      'disco',
      'retro',
    ];

    for (const genre of genresWithoutPolyrhythms) {
      expect(GENRE_POLYRHYTHMS[genre as GenreType]).toBeUndefined();
    }
  });

  it('should have non-empty arrays for all mapped genres', () => {
    for (const [_genre, rhythms] of Object.entries(GENRE_POLYRHYTHMS)) {
      expect(rhythms.length).toBeGreaterThan(0);
    }
  });

  it('should contain valid PolyrhythmType values', () => {
    const validRhythms: PolyrhythmType[] = [
      'hemiola',
      'reverse_hemiola',
      'afrobeat',
      'limping',
      'shifting',
      'african_compound',
      'evolving',
    ];

    for (const [_genre, rhythms] of Object.entries(GENRE_POLYRHYTHMS)) {
      for (const rhythm of rhythms) {
        expect(validRhythms).toContain(rhythm);
      }
    }
  });

  it('should have afrobeat-specific rhythms for afrobeat genre', () => {
    expect(GENRE_POLYRHYTHMS.afrobeat).toContain('afrobeat');
    expect(GENRE_POLYRHYTHMS.afrobeat).toContain('african_compound');
  });

  it('should have latin-specific rhythms for latin genre', () => {
    expect(GENRE_POLYRHYTHMS.latin).toContain('hemiola');
    expect(GENRE_POLYRHYTHMS.latin).toContain('reverse_hemiola');
  });

  it('should have complex rhythms for metal genre', () => {
    expect(GENRE_POLYRHYTHMS.metal).toContain('shifting');
    expect(GENRE_POLYRHYTHMS.metal).toContain('evolving');
  });
});

describe('DEFAULT_POLYRHYTHMS', () => {
  it('should be null (no default for polyrhythms)', () => {
    expect(DEFAULT_POLYRHYTHMS).toBeNull();
  });
});

describe('getBlendedPolyrhythm', () => {
  it('should return a polyrhythm from afrobeat pool', () => {
    const seededRng = () => 0;
    const result = getBlendedPolyrhythm('afrobeat', seededRng);

    expect(result).not.toBeNull();
    expect(GENRE_POLYRHYTHMS.afrobeat).toContain(result!);
  });

  it('should return a polyrhythm from latin pool', () => {
    const seededRng = () => 0;
    const result = getBlendedPolyrhythm('latin', seededRng);

    expect(result).not.toBeNull();
    expect(GENRE_POLYRHYTHMS.latin).toContain(result!);
  });

  it('should return null for genres without polyrhythm mappings (e.g., pop)', () => {
    const result = getBlendedPolyrhythm('pop');
    expect(result).toBeNull();
  });

  it('should return null for punk (no polyrhythm mapping)', () => {
    const result = getBlendedPolyrhythm('punk');
    expect(result).toBeNull();
  });

  it('should return null for trap (no polyrhythm mapping)', () => {
    const result = getBlendedPolyrhythm('trap');
    expect(result).toBeNull();
  });

  it('should return polyrhythm from combined pools for multi-genre with mappings', () => {
    const result = getBlendedPolyrhythm('afrobeat latin');

    expect(result).not.toBeNull();
    const combinedPool = [...GENRE_POLYRHYTHMS.afrobeat!, ...GENRE_POLYRHYTHMS.latin!];
    expect(combinedPool).toContain(result!);
  });

  it('should combine applicable pools when mixing mapped and unmapped genres', () => {
    // afrobeat has mapping, pop does not
    const result = getBlendedPolyrhythm('afrobeat pop');

    expect(result).not.toBeNull();
    expect(GENRE_POLYRHYTHMS.afrobeat).toContain(result!);
  });

  it('should return null when all genres lack mappings', () => {
    const result = getBlendedPolyrhythm('pop punk trap');
    expect(result).toBeNull();
  });

  it('should handle comma-separated genres', () => {
    const result = getBlendedPolyrhythm('afrobeat, jazz');

    expect(result).not.toBeNull();
    const combinedPool = [...GENRE_POLYRHYTHMS.afrobeat!, ...GENRE_POLYRHYTHMS.jazz!];
    expect(combinedPool).toContain(result!);
  });

  it('should return null for unrecognized genres', () => {
    const result = getBlendedPolyrhythm('unknown');
    expect(result).toBeNull();
  });

  it('should return null for empty string', () => {
    const result = getBlendedPolyrhythm('');
    expect(result).toBeNull();
  });

  it('should return null for whitespace-only string', () => {
    const result = getBlendedPolyrhythm('   ');
    expect(result).toBeNull();
  });

  it('should use provided RNG for selection', () => {
    // RNG that always returns 0 - should get first item
    const rngFirst = () => 0;
    // RNG that returns 0.99 - should get last item
    const rngLast = () => 0.99;

    const firstResult = getBlendedPolyrhythm('afrobeat', rngFirst);
    const lastResult = getBlendedPolyrhythm('afrobeat', rngLast);

    expect(firstResult).not.toBeNull();
    expect(lastResult).not.toBeNull();
    // Both should be valid afrobeat rhythms
    expect(GENRE_POLYRHYTHMS.afrobeat).toContain(firstResult!);
    expect(GENRE_POLYRHYTHMS.afrobeat).toContain(lastResult!);
  });

  it('should handle three or more genres', () => {
    const result = getBlendedPolyrhythm('afrobeat latin jazz');

    expect(result).not.toBeNull();
    const combinedPool = [
      ...GENRE_POLYRHYTHMS.afrobeat!,
      ...GENRE_POLYRHYTHMS.latin!,
      ...GENRE_POLYRHYTHMS.jazz!,
    ];
    expect(combinedPool).toContain(result!);
  });
});

describe('getAllBlendedPolyrhythms', () => {
  it('should return polyrhythms from single genre with mapping', () => {
    const result = getAllBlendedPolyrhythms('afrobeat');

    expect(result.length).toBeGreaterThan(0);
    // All results should be from afrobeat pool
    for (const rhythm of result) {
      expect(GENRE_POLYRHYTHMS.afrobeat).toContain(rhythm);
    }
  });

  it('should return empty array for genres without polyrhythm traditions', () => {
    const result = getAllBlendedPolyrhythms('pop');
    expect(result).toEqual([]);
  });

  it('should return empty array for punk', () => {
    const result = getAllBlendedPolyrhythms('punk');
    expect(result).toEqual([]);
  });

  it('should return empty array for multiple unmapped genres', () => {
    const result = getAllBlendedPolyrhythms('pop punk trap');
    expect(result).toEqual([]);
  });

  it('should return unique polyrhythms from multiple genres', () => {
    const result = getAllBlendedPolyrhythms('afrobeat latin');

    expect(result.length).toBeGreaterThan(0);
    // Check for no duplicates
    const uniqueSet = new Set(result);
    expect(uniqueSet.size).toBe(result.length);
  });

  it('should contain polyrhythms from all constituent genres with mappings', () => {
    const result = getAllBlendedPolyrhythms('afrobeat metal');

    // Afrobeat includes african_compound
    expect(result).toContain('african_compound');
    // Metal includes shifting
    expect(result).toContain('shifting');
  });

  it('should return empty array for empty string', () => {
    const result = getAllBlendedPolyrhythms('');
    expect(result).toEqual([]);
  });

  it('should return empty array for whitespace-only string', () => {
    const result = getAllBlendedPolyrhythms('   ');
    expect(result).toEqual([]);
  });

  it('should return empty array for unrecognized genres', () => {
    const result = getAllBlendedPolyrhythms('unknown');
    expect(result).toEqual([]);
  });

  it('should handle space-separated genres', () => {
    const result = getAllBlendedPolyrhythms('afrobeat jazz');

    expect(result.length).toBeGreaterThan(0);
    // Should include rhythms from both genres
    expect(result).toContain('afrobeat'); // from afrobeat
    expect(result).toContain('hemiola'); // from both
  });

  it('should dedupe shared polyrhythms between genres', () => {
    // Afrobeat and jazz both have hemiola
    const result = getAllBlendedPolyrhythms('afrobeat jazz');

    // hemiola should appear only once
    const hemiolaCount = result.filter((r) => r === 'hemiola').length;
    expect(hemiolaCount).toBe(1);
  });

  it('should handle three or more genres', () => {
    const result = getAllBlendedPolyrhythms('afrobeat latin jazz');

    expect(result.length).toBeGreaterThan(0);
    // Should contain rhythms from various genres
    expect(result).toContain('african_compound'); // afrobeat
    expect(result).toContain('afrobeat'); // afrobeat, latin
    expect(result).toContain('hemiola'); // all three
    expect(result).toContain('reverse_hemiola'); // latin, jazz
  });

  it('should only include rhythms from mapped genres when mixing', () => {
    // afrobeat has mapping, pop does not
    const result = getAllBlendedPolyrhythms('afrobeat pop');

    // Should only include afrobeat rhythms
    expect(result.length).toBeGreaterThan(0);
    for (const rhythm of result) {
      expect(GENRE_POLYRHYTHMS.afrobeat).toContain(rhythm);
    }
  });
});

describe('integration scenarios', () => {
  it('should produce coherent results for afrobeat jazz blend', () => {
    const all = getAllBlendedPolyrhythms('afrobeat jazz');
    const selected = getBlendedPolyrhythm('afrobeat jazz');

    // Selected should be in the all array
    expect(all).toContain(selected!);
  });

  it('should produce coherent results for latin metal blend', () => {
    const all = getAllBlendedPolyrhythms('latin metal');
    const selected = getBlendedPolyrhythm('latin metal');

    expect(all).toContain(selected!);
    // Should have rhythms from both genres
    expect(all).toContain('hemiola'); // latin
    expect(all).toContain('shifting'); // metal
  });

  it('should work with hyphenated genre strings', () => {
    // e.g., "afrobeat-jazz" style input
    const result = getAllBlendedPolyrhythms('afrobeat-jazz');

    expect(result.length).toBeGreaterThan(0);
    expect(result).toContain('african_compound'); // from afrobeat
  });

  it('should work with slash-separated genre strings', () => {
    // e.g., "afrobeat/jazz" style input
    const result = getAllBlendedPolyrhythms('afrobeat/jazz');

    expect(result.length).toBeGreaterThan(0);
    expect(result).toContain('african_compound'); // from afrobeat
    expect(result).toContain('hemiola'); // from both
  });

  it('should deterministically select with seeded RNG', () => {
    const seededRng = () => 0.5;

    const result1 = getBlendedPolyrhythm('afrobeat jazz', seededRng);
    const result2 = getBlendedPolyrhythm('afrobeat jazz', seededRng);

    expect(result1).toBe(result2);
  });

  it('should return null for pop electronic blend (neither mapped)', () => {
    // Testing with genres that have no polyrhythm traditions
    // Wait - electronic IS mapped. Let me use different genres.
    const result = getBlendedPolyrhythm('pop trap');
    expect(result).toBeNull();
  });

  it('should return polyrhythm when at least one genre has mapping', () => {
    // electronic has mapping, pop does not
    const result = getBlendedPolyrhythm('electronic pop');
    expect(result).not.toBeNull();
    expect(GENRE_POLYRHYTHMS.electronic).toContain(result!);
  });
});

describe('specific genre combinations', () => {
  it('should blend afrobeat and house (both have afrobeat polyrhythm)', () => {
    const result = getAllBlendedPolyrhythms('afrobeat house');

    expect(result).toContain('afrobeat');
    expect(result).toContain('african_compound'); // afrobeat only
    expect(result).toContain('hemiola'); // both
  });

  it('should blend jazz and funk (groove rhythms)', () => {
    const result = getAllBlendedPolyrhythms('jazz funk');

    expect(result).toContain('hemiola');
    expect(result).toContain('reverse_hemiola');
    // No duplicates
    expect(new Set(result).size).toBe(result.length);
  });

  it('should blend metal and symphonic (complex rhythms)', () => {
    const result = getAllBlendedPolyrhythms('metal symphonic');

    expect(result).toContain('shifting'); // metal
    expect(result).toContain('evolving'); // both
    expect(result).toContain('hemiola'); // symphonic
  });

  it('should return null for synthwave punk trance blend', () => {
    // All three lack polyrhythm mappings
    const result = getBlendedPolyrhythm('synthwave punk trance');
    expect(result).toBeNull();
  });
});
