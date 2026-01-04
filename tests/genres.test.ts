import { describe, expect, test } from 'bun:test';

import {
  GENRE_REGISTRY,
  JAZZ_GENRE,
  ELECTRONIC_GENRE,
  ROCK_GENRE,
  SYNTHWAVE_GENRE,
  CINEMATIC_GENRE,
  FOLK_GENRE,
  RNB_GENRE,
  VIDEOGAME_GENRE,
  detectGenre,
  getGenreInstruments,
  isValidInstrument,
} from '@bun/instruments';

describe('Genre Registry', () => {
  test('should have 35 genres registered', () => {
    expect(Object.keys(GENRE_REGISTRY).length).toBe(35);
  });

  test('all genres have required properties', () => {
    for (const genre of Object.values(GENRE_REGISTRY)) {
      expect(genre.name).toBeDefined();
      expect(genre.keywords.length).toBeGreaterThan(0);
      expect(genre.description).toBeDefined();
      expect(genre.pools).toBeDefined();
      expect(genre.poolOrder.length).toBeGreaterThan(0);
      expect(genre.maxTags).toBeGreaterThan(0);
    }
  });

  test('all genre instruments are valid in registry', () => {
    for (const genre of Object.values(GENRE_REGISTRY)) {
      for (const pool of Object.values(genre.pools)) {
        for (const instrument of pool.instruments) {
          expect(isValidInstrument(instrument)).toBe(true);
        }
      }
    }
  });
});

describe('Genre Detection', () => {
  test('detects jazz from keywords', () => {
    expect(detectGenre('smooth jazz vibes')).toBe('jazz');
    expect(detectGenre('bebop style')).toBe('jazz');
    expect(detectGenre('fusion guitar')).toBe('jazz');
  });

  test('detects electronic from keywords', () => {
    expect(detectGenre('edm club track')).toBe('electronic');
    expect(detectGenre('dubstep drop')).toBe('electronic');
  });

  test('detects house from keywords', () => {
    expect(detectGenre('house music')).toBe('house');
    expect(detectGenre('deep house vibes')).toBe('house');
  });

  test('detects trance from keywords', () => {
    expect(detectGenre('uplifting trance')).toBe('trance');
    expect(detectGenre('psytrance festival')).toBe('trance');
  });

  test('detects disco from keywords', () => {
    expect(detectGenre('disco vibes')).toBe('disco');
    expect(detectGenre('nu-disco track')).toBe('disco');
  });

  test('detects funk from keywords', () => {
    expect(detectGenre('funky groove')).toBe('funk');
    expect(detectGenre('p-funk style')).toBe('funk');
  });

  test('detects reggae from keywords', () => {
    expect(detectGenre('reggae rhythm')).toBe('reggae');
    expect(detectGenre('dancehall beat')).toBe('reggae');
  });

  test('detects afrobeat from keywords', () => {
    expect(detectGenre('afrobeats track')).toBe('afrobeat');
    expect(detectGenre('amapiano song')).toBe('afrobeat');
  });

  test('detects downtempo from keywords', () => {
    expect(detectGenre('downtempo vibes')).toBe('downtempo');
    expect(detectGenre('trip hop beat')).toBe('downtempo');
  });

  test('detects dreampop from keywords', () => {
    expect(detectGenre('dream pop sound')).toBe('dreampop');
    expect(detectGenre('shoegaze wall')).toBe('dreampop');
  });

  test('detects chillwave from keywords', () => {
    expect(detectGenre('chillwave summer')).toBe('chillwave');
    expect(detectGenre('hypnagogic vibes')).toBe('chillwave');
  });

  test('detects newage from keywords', () => {
    expect(detectGenre('new age meditation')).toBe('newage');
    expect(detectGenre('healing spa music')).toBe('newage');
  });

  test('detects hyperpop from keywords', () => {
    expect(detectGenre('hyperpop chaos')).toBe('hyperpop');
    expect(detectGenre('pc music style')).toBe('hyperpop');
  });

  test('detects drill from keywords', () => {
    expect(detectGenre('uk drill beat')).toBe('drill');
    expect(detectGenre('chicago drill')).toBe('drill');
  });

  test('detects melodictechno from keywords', () => {
    expect(detectGenre('melodic techno')).toBe('melodictechno');
    expect(detectGenre('afterhours set')).toBe('melodictechno');
  });

  test('detects indie from keywords', () => {
    expect(detectGenre('indie rock song')).toBe('indie');
    expect(detectGenre('bedroom indie vibes')).toBe('indie');
  });

  test('detects rock from keywords', () => {
    expect(detectGenre('rock anthem')).toBe('rock');
    expect(detectGenre('alternative vibes')).toBe('rock');
    expect(detectGenre('grunge style')).toBe('rock');
  });

  test('detects punk from keywords', () => {
    expect(detectGenre('punk energy')).toBe('punk');
    expect(detectGenre('pop punk song')).toBe('punk');
    expect(detectGenre('emo vibes')).toBe('punk');
  });

  test('detects metal from keywords', () => {
    expect(detectGenre('heavy metal song')).toBe('metal');
    expect(detectGenre('doom metal riff')).toBe('metal');
    expect(detectGenre('progressive metal')).toBe('metal');
  });

  test('detects symphonic from keywords', () => {
    expect(detectGenre('symphonic metal')).toBe('symphonic');
    expect(detectGenre('symphonic rock')).toBe('symphonic');
    expect(detectGenre('a symphonic piece')).toBe('symphonic');
  });

  test('detects pop from keywords', () => {
    expect(detectGenre('pop hit')).toBe('pop');
    expect(detectGenre('mainstream sound')).toBe('pop');
    expect(detectGenre('dance pop')).toBe('pop');
  });

  test('detects classical from keywords', () => {
    expect(detectGenre('classical symphony')).toBe('classical');
    expect(detectGenre('baroque chamber')).toBe('classical');
    expect(detectGenre('chamber music')).toBe('classical');
  });

  test('detects lofi from keywords', () => {
    expect(detectGenre('lofi beats')).toBe('lofi');
    expect(detectGenre('lo-fi study music')).toBe('lofi');
    expect(detectGenre('chillhop vibes')).toBe('lofi');
  });

  test('detects synthwave from keywords', () => {
    expect(detectGenre('synthwave track')).toBe('synthwave');
    expect(detectGenre('retrowave vibes')).toBe('synthwave');
    expect(detectGenre('80s nostalgia')).toBe('synthwave');
    expect(detectGenre('outrun style')).toBe('synthwave');
  });

  test('detects cinematic from keywords', () => {
    expect(detectGenre('cinematic epic')).toBe('cinematic');
    expect(detectGenre('trailer music')).toBe('cinematic');
    expect(detectGenre('film score')).toBe('cinematic');
  });

  test('detects folk from keywords', () => {
    expect(detectGenre('folk song')).toBe('folk');
    expect(detectGenre('acoustic ballad')).toBe('folk');
    expect(detectGenre('celtic music')).toBe('folk');
  });

  test('detects country from keywords', () => {
    expect(detectGenre('country road')).toBe('country');
    expect(detectGenre('americana style')).toBe('country');
    expect(detectGenre('bluegrass tune')).toBe('country');
  });

  test('detects rnb from keywords', () => {
    expect(detectGenre('rnb groove')).toBe('rnb');
    expect(detectGenre('r&b slow jam')).toBe('rnb');
    expect(detectGenre('neo-soul vibes')).toBe('rnb');
  });

  test('detects soul from keywords', () => {
    expect(detectGenre('soul music')).toBe('soul');
    expect(detectGenre('motown sound')).toBe('soul');
  });

  test('detects ambient from keywords', () => {
    expect(detectGenre('ambient soundscape')).toBe('ambient');
    expect(detectGenre('atmospheric textures')).toBe('ambient');
  });

  test('detects videogame from keywords', () => {
    expect(detectGenre('video game soundtrack')).toBe('videogame');
    expect(detectGenre('8-bit chiptune music')).toBe('videogame');
    expect(detectGenre('boss battle theme')).toBe('videogame');
    expect(detectGenre('rpg adventure music')).toBe('videogame');
    expect(detectGenre('retro game arcade')).toBe('videogame');
    expect(detectGenre('jrpg style')).toBe('videogame');
  });

  test('returns null for unrecognized descriptions', () => {
    expect(detectGenre('asdfqwer random text')).toBeNull();
  });

  test('priority order: synthwave before electronic', () => {
    expect(detectGenre('synthwave electronic')).toBe('synthwave');
  });

  test('priority order: lofi before chill pop', () => {
    expect(detectGenre('chill lofi')).toBe('lofi');
  });
});

describe('Genre Instrument Selection', () => {
  test('jazz genre returns formatted string with instruments', () => {
    const result = getGenreInstruments('jazz');
    expect(result).toContain('SUGGESTED INSTRUMENTS');
    expect(result).toContain('Jazz');
    expect(result.length).toBeGreaterThan(0);
  });

  test('electronic genre returns formatted string', () => {
    const result = getGenreInstruments('electronic');
    expect(result).toContain('Electronic');
    expect(result.length).toBeGreaterThan(0);
  });

  test('synthwave genre contains synth instruments', () => {
    const result = getGenreInstruments('synthwave');
    const hasSynth = result.includes('synth') || result.includes('arpeggiator') || result.includes('808');
    expect(hasSynth).toBe(true);
  });

  test('classical genre contains orchestral instruments', () => {
    const result = getGenreInstruments('classical');
    const hasOrchestral = ['strings', 'violin', 'cello', 'flute', 'oboe', 'clarinet', 'felt piano'].some(i => result.includes(i));
    expect(hasOrchestral).toBe(true);
  });

  test('folk genre may include rare instruments over multiple calls', () => {
    // Use a deterministic RNG sequence to force:
    // 1) chance check to pass (0 <= chance)
    // 2) pick count to choose max (near-1)
    const sequence = [0, 0.999, 0, 0.999, 0, 0.999];
    let idx = 0;
    const rng = () => sequence[(idx++) % sequence.length]!;

    const result = getGenreInstruments('folk', {
      rng,
      multiGenre: { enabled: false, count: { min: 1, max: 2 } },
      foundational: { enabled: false, count: { min: 0, max: 1 } },
    });
    // Folk rare pool: mandolin, banjo, hurdy gurdy, jaw harp, nyckelharpa
    const folkRareInstruments = ['mandolin', 'banjo', 'hurdy gurdy', 'jaw harp', 'nyckelharpa'];
    const hasRare = folkRareInstruments.some(i => result.includes(i));
    expect(hasRare).toBe(true);
  });

  test('handles user instruments option', () => {
    const result = getGenreInstruments('jazz', { userInstruments: ['saxophone'] });
    expect(result).toContain('User specified');
    expect(result).toContain('saxophone');
  });
});

describe('Individual Genre Definitions', () => {
  test('JAZZ_GENRE has correct structure', () => {
    expect(JAZZ_GENRE.name).toBe('Jazz');
    expect(JAZZ_GENRE.keywords).toContain('jazz');
    expect(JAZZ_GENRE.pools.harmonic).toBeDefined();
    expect(JAZZ_GENRE.pools.color).toBeDefined();
    expect(JAZZ_GENRE.pools.movement).toBeDefined();
  });

  test('ELECTRONIC_GENRE has synth instruments', () => {
    expect(ELECTRONIC_GENRE.name).toBe('Electronic');
    expect(ELECTRONIC_GENRE.pools.pad?.instruments).toContain('arpeggiator');
    expect(ELECTRONIC_GENRE.pools.movement?.instruments).toContain('808');
  });

  test('ROCK_GENRE has guitar and drums', () => {
    expect(ROCK_GENRE.pools.harmonic?.instruments).toContain('guitar');
    expect(ROCK_GENRE.pools.movement?.instruments).toContain('drums');
  });

  test('CINEMATIC_GENRE has epic instruments', () => {
    expect(CINEMATIC_GENRE.pools.movement?.instruments).toContain('taiko drums');
    expect(CINEMATIC_GENRE.pools.color?.instruments).toContain('choir');
  });

  test('SYNTHWAVE_GENRE is synth-focused', () => {
    expect(SYNTHWAVE_GENRE.pools.pad?.instruments).toContain('analog synth');
    expect(SYNTHWAVE_GENRE.pools.pad?.instruments).toContain('arpeggiator');
    expect(SYNTHWAVE_GENRE.pools.movement?.instruments).toContain('synth bass');
  });

  test('FOLK_GENRE has acoustic instruments', () => {
    expect(FOLK_GENRE.pools.harmonic?.instruments).toContain('acoustic guitar');
    expect(FOLK_GENRE.pools.rare?.instruments).toContain('banjo');
  });

  test('RNB_GENRE has soulful keys', () => {
    expect(RNB_GENRE.pools.harmonic?.instruments).toContain('Rhodes');
    expect(RNB_GENRE.pools.harmonic?.instruments).toContain('Wurlitzer');
  });

  test('VIDEOGAME_GENRE has orchestral and retro elements', () => {
    expect(VIDEOGAME_GENRE.name).toBe('Video Game');
    expect(VIDEOGAME_GENRE.pools.harmonic?.instruments).toContain('strings');
    expect(VIDEOGAME_GENRE.pools.pad?.instruments).toContain('arpeggiator');
    expect(VIDEOGAME_GENRE.pools.pad?.instruments).toContain('FM synth');
    expect(VIDEOGAME_GENRE.pools.color?.instruments).toContain('bells');
    expect(VIDEOGAME_GENRE.pools.movement?.instruments).toContain('taiko drums');
  });
});
