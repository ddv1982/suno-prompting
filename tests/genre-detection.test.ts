/**
 * Genre Detection Tests
 *
 * Comprehensive tests for enhanced genre detection including:
 * - Mood-to-genre mapping
 * - Genre aliases
 * - Multi-genre detection
 *
 * @module tests/genre-detection
 */

import { describe, expect, test } from 'bun:test';

import { detectGenre, detectGenreFromMood, MOOD_TO_GENRE } from '@bun/instruments/detection';
import {
  resolveGenreAlias,
  findGenreAliasInText,
  GENRE_ALIASES,
} from '@bun/prompt/deterministic/aliases';
import { detectAllGenres } from '@bun/prompt/deterministic/genre';

// Fixed RNG for deterministic tests
const createFixedRng = (value: number) => () => value;

describe('Genre Aliases', () => {
  describe('resolveGenreAlias', () => {
    test('resolves "hip hop" to trap', () => {
      expect(resolveGenreAlias('hip hop')).toBe('trap');
    });

    test('resolves "hip-hop" to trap', () => {
      expect(resolveGenreAlias('hip-hop')).toBe('trap');
    });

    test('resolves "hiphop" to trap', () => {
      expect(resolveGenreAlias('hiphop')).toBe('trap');
    });

    test('resolves "rap" to trap', () => {
      expect(resolveGenreAlias('rap')).toBe('trap');
    });

    test('resolves "r&b" to rnb', () => {
      expect(resolveGenreAlias('r&b')).toBe('rnb');
    });

    test('resolves "r and b" to rnb', () => {
      expect(resolveGenreAlias('r and b')).toBe('rnb');
    });

    test('resolves "synth wave" to synthwave', () => {
      expect(resolveGenreAlias('synth wave')).toBe('synthwave');
    });

    test('resolves "synth-pop" to synthpop', () => {
      expect(resolveGenreAlias('synth-pop')).toBe('synthpop');
    });

    test('resolves "heavy metal" to metal', () => {
      expect(resolveGenreAlias('heavy metal')).toBe('metal');
    });

    test('resolves "edm" to electronic', () => {
      expect(resolveGenreAlias('edm')).toBe('electronic');
    });

    test('resolves "lo-fi" to lofi', () => {
      expect(resolveGenreAlias('lo-fi')).toBe('lofi');
    });

    test('resolves "lo fi" to lofi', () => {
      expect(resolveGenreAlias('lo fi')).toBe('lofi');
    });

    test('resolves "dnb" to drumandbass', () => {
      expect(resolveGenreAlias('dnb')).toBe('drumandbass');
    });

    test('resolves "d&b" to drumandbass', () => {
      expect(resolveGenreAlias('d&b')).toBe('drumandbass');
    });

    test('resolves "drum n bass" to drumandbass', () => {
      expect(resolveGenreAlias('drum n bass')).toBe('drumandbass');
    });

    test('resolves "drum and bass" to drumandbass', () => {
      expect(resolveGenreAlias('drum and bass')).toBe('drumandbass');
    });

    test('is case insensitive', () => {
      expect(resolveGenreAlias('HIP HOP')).toBe('trap');
      expect(resolveGenreAlias('R&B')).toBe('rnb');
      expect(resolveGenreAlias('EDM')).toBe('electronic');
    });

    test('trims whitespace', () => {
      expect(resolveGenreAlias('  hip hop  ')).toBe('trap');
    });

    test('returns null for unknown aliases', () => {
      expect(resolveGenreAlias('unknown genre')).toBeNull();
      expect(resolveGenreAlias('asdfqwer')).toBeNull();
    });

    test('returns null for empty input', () => {
      expect(resolveGenreAlias('')).toBeNull();
    });
  });

  describe('findGenreAliasInText', () => {
    test('finds "hip hop" in text', () => {
      expect(findGenreAliasInText('I want hip hop beats')).toBe('trap');
    });

    test('finds "r&b" in text', () => {
      expect(findGenreAliasInText('some r&b vibes')).toBe('rnb');
    });

    test('finds "heavy metal" in text', () => {
      expect(findGenreAliasInText('heavy metal song')).toBe('metal');
    });

    test('prefers longer matches', () => {
      // "drum and bass" should be found before shorter aliases
      expect(findGenreAliasInText('drum and bass track')).toBe('drumandbass');
    });

    test('returns null when no alias found', () => {
      expect(findGenreAliasInText('random text')).toBeNull();
    });
  });

  describe('GENRE_ALIASES coverage', () => {
    test('has at least 35 aliases', () => {
      expect(Object.keys(GENRE_ALIASES).length).toBeGreaterThanOrEqual(35);
    });

    test('all aliases are lowercase', () => {
      for (const alias of Object.keys(GENRE_ALIASES)) {
        expect(alias).toBe(alias.toLowerCase());
      }
    });
  });
});

describe('Mood-to-Genre Mapping', () => {
  describe('MOOD_TO_GENRE coverage', () => {
    test('has at least 20 mood keywords', () => {
      expect(Object.keys(MOOD_TO_GENRE).length).toBeGreaterThanOrEqual(20);
    });

    test('each mood maps to at least 3 genres', () => {
      for (const genres of Object.values(MOOD_TO_GENRE)) {
        expect(genres.length).toBeGreaterThanOrEqual(3);
      }
    });
  });

  describe('detectGenreFromMood', () => {
    test('"chill" maps to lofi/ambient/chillwave/downtempo', () => {
      const genre = detectGenreFromMood('something chill', createFixedRng(0));
      expect(genre).not.toBeNull();
      expect(['lofi', 'ambient', 'chillwave', 'downtempo']).toContain(genre!);
    });

    test('"chill" with different rng values covers all options', () => {
      const results = new Set<string | null>();
      for (let i = 0; i < 4; i++) {
        const genre = detectGenreFromMood('something chill', createFixedRng(i * 0.25));
        results.add(genre);
      }
      // Should have variety
      expect(results.size).toBeGreaterThanOrEqual(2);
    });

    test('"energetic" maps to electronic/house/rock/punk', () => {
      const genre = detectGenreFromMood('energetic vibes', createFixedRng(0));
      expect(genre).not.toBeNull();
      expect(['electronic', 'house', 'rock', 'punk']).toContain(genre!);
    });

    test('"dark" maps to darksynth/metal/ambient/postpunk', () => {
      const genre = detectGenreFromMood('dark atmosphere', createFixedRng(0));
      expect(genre).not.toBeNull();
      expect(['darksynth', 'metal', 'ambient', 'postpunk']).toContain(genre!);
    });

    test('"dreamy" maps to dreampop/shoegaze/ambient/chillwave', () => {
      const genre = detectGenreFromMood('dreamy sound', createFixedRng(0));
      expect(genre).not.toBeNull();
      expect(['dreampop', 'shoegaze', 'ambient', 'chillwave']).toContain(genre!);
    });

    test('"groovy" maps to funk/disco/house/soul', () => {
      const genre = detectGenreFromMood('groovy beat', createFixedRng(0));
      expect(genre).not.toBeNull();
      expect(['funk', 'disco', 'house', 'soul']).toContain(genre!);
    });

    test('"epic" maps to cinematic/symphonic/metal/classical', () => {
      const genre = detectGenreFromMood('epic adventure', createFixedRng(0));
      expect(genre).not.toBeNull();
      expect(['cinematic', 'symphonic', 'metal', 'classical']).toContain(genre!);
    });

    test('"upbeat" maps to pop/disco/funk/house', () => {
      const genre = detectGenreFromMood('upbeat song', createFixedRng(0));
      expect(genre).not.toBeNull();
      expect(['pop', 'disco', 'funk', 'house']).toContain(genre!);
    });

    test('"melancholy" maps to emo/shoegaze/folk/blues', () => {
      const genre = detectGenreFromMood('melancholy mood', createFixedRng(0));
      expect(genre).not.toBeNull();
      expect(['emo', 'shoegaze', 'folk', 'blues']).toContain(genre!);
    });

    test('"nostalgic" maps to synthwave/retro/lofi/soul', () => {
      const genre = detectGenreFromMood('nostalgic feeling', createFixedRng(0));
      expect(genre).not.toBeNull();
      expect(['synthwave', 'retro', 'lofi', 'soul']).toContain(genre!);
    });

    test('returns null for no mood match', () => {
      expect(detectGenreFromMood('random text', Math.random)).toBeNull();
    });

    test('returns null for empty input', () => {
      expect(detectGenreFromMood('', Math.random)).toBeNull();
    });
  });
});

describe('Enhanced detectGenre', () => {
  test('detects direct genre names', () => {
    expect(detectGenre('jazz vibes')).toBe('jazz');
    expect(detectGenre('rock anthem')).toBe('rock');
  });

  test('detects genre keywords', () => {
    expect(detectGenre('smooth bebop style')).toBe('jazz');
    expect(detectGenre('dubstep drop')).toBe('electronic');
  });

  test('detects genre via aliases', () => {
    expect(detectGenre('hip hop beats')).toBe('trap');
    expect(detectGenre('some r&b vibes')).toBe('rnb');
    expect(detectGenre('heavy metal song')).toBe('metal');
  });

  test('detects genre via mood with rng', () => {
    // "chill" without a direct genre match should use mood detection
    const genre = detectGenre('something cool and chill tonight', createFixedRng(0));
    expect(genre).not.toBeNull();
    expect(['lofi', 'ambient', 'chillwave', 'downtempo']).toContain(genre!);
  });

  test('prioritizes direct match over alias', () => {
    // "jazz" is a direct match, should not use alias
    expect(detectGenre('jazz music')).toBe('jazz');
  });

  test('returns null for unrecognized without rng', () => {
    expect(detectGenre('asdfqwer random')).toBeNull();
  });
});

describe('Multi-Genre Detection', () => {
  describe('detectAllGenres', () => {
    test('detects single genre', () => {
      const genres = detectAllGenres('jazz night');
      expect(genres).toContain('jazz');
      expect(genres.length).toBe(1);
    });

    test('detects multiple genres', () => {
      const genres = detectAllGenres('jazz rock fusion');
      expect(genres).toContain('jazz');
      expect(genres).toContain('rock');
      expect(genres.length).toBe(2);
    });

    test('detects genres in any order', () => {
      const genres = detectAllGenres('rock and jazz together');
      expect(genres).toContain('jazz');
      expect(genres).toContain('rock');
    });

    test('includes genres from aliases', () => {
      const genres = detectAllGenres('jazz with hip hop elements');
      expect(genres).toContain('jazz');
      expect(genres).toContain('trap'); // hip hop → trap
    });

    test('limits to 4 genres max', () => {
      const genres = detectAllGenres(
        'ambient jazz metal house rock electronic pop classical'
      );
      expect(genres.length).toBeLessThanOrEqual(4);
    });

    test('no duplicate genres', () => {
      const genres = detectAllGenres('jazz jazz jazz music');
      expect(genres.filter((g) => g === 'jazz').length).toBe(1);
    });

    test('maintains priority order (first detected = primary)', () => {
      // Based on GENRE_PRIORITY, jazz comes before rock
      const genres = detectAllGenres('jazz rock fusion');
      expect(genres[0]).toBe('jazz');
    });

    test('returns empty array for no matches', () => {
      const genres = detectAllGenres('random asdfqwer text');
      expect(genres).toEqual([]);
    });

    test('returns empty array for empty input', () => {
      expect(detectAllGenres('')).toEqual([]);
    });

    test('handles complex multi-genre descriptions', () => {
      const genres = detectAllGenres('cinematic symphonic metal anthem');
      expect(genres).toContain('cinematic');
      expect(genres).toContain('symphonic');
      expect(genres).toContain('metal');
    });
  });
});

describe('Integration: resolveGenre with Enhanced Detection', () => {
  // We can't easily test resolveGenre directly without importing from genre.ts
  // but we can verify detectAllGenres works as expected for the integration

  test('jazz rock fusion returns both components', () => {
    const genres = detectAllGenres('jazz rock fusion');
    expect(genres.length).toBe(2);
    expect(genres).toContain('jazz');
    expect(genres).toContain('rock');
  });

  test('chill lofi with hip hop includes both', () => {
    const genres = detectAllGenres('chill lofi with hip hop vibes');
    expect(genres).toContain('lofi');
    expect(genres).toContain('trap'); // hip hop → trap
  });

  test('electronic synthwave combination', () => {
    const genres = detectAllGenres('electronic synthwave track');
    expect(genres).toContain('synthwave');
    expect(genres).toContain('electronic');
  });
});
