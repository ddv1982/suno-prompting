import { describe, expect, it } from 'bun:test';
import { createRng } from '@bun/instruments/services/random';

// Articulations
import {
  ARTICULATIONS,
  INSTRUMENT_CATEGORIES,
  getArticulationForInstrument,
  articulateInstrument,
  type InstrumentCategory,
} from '@bun/prompt/articulations';

// Vocal Descriptors
import {
  VOCAL_RANGES,
  VOCAL_DELIVERIES,
  VOCAL_TECHNIQUES,
  GENRE_VOCAL_STYLES,
  getVocalSuggestionsForGenre,
  buildVocalDescriptor,
} from '@bun/prompt/vocal-descriptors';

// Production Elements
import {
  REVERB_TYPES,
  RECORDING_TEXTURES,
  GENRE_PRODUCTION_STYLES,
  getProductionSuggestionsForGenre,
  buildProductionDescriptor,
} from '@bun/prompt/production-elements';

// Chord Progressions
import {
  POP_PROGRESSIONS,
  DARK_PROGRESSIONS,
  JAZZ_PROGRESSIONS,
  ALL_PROGRESSIONS,
  GENRE_PROGRESSIONS,
  getProgressionsForGenre,
  getRandomProgressionForGenre,
  buildProgressionDescriptor,
  detectProgression,
} from '@bun/prompt/chord-progressions';

// Test categories
const ARTICULATION_CATEGORIES: InstrumentCategory[] = [
  'guitar', 'piano', 'bass', 'drums', 'strings', 'brass', 'woodwind', 'synth', 'organ', 'percussion'
];

describe('Articulations', () => {
  describe('ARTICULATIONS constant', () => {
    it('has articulations for all 10 categories', () => {
      expect(Object.keys(ARTICULATIONS)).toHaveLength(10);
      for (const category of ARTICULATION_CATEGORIES) {
        expect(ARTICULATIONS[category]).toBeDefined();
        expect(ARTICULATIONS[category].length).toBeGreaterThan(0);
      }
    });

    it('guitar has expected articulations', () => {
      expect(ARTICULATIONS.guitar).toContain('Arpeggiated');
      expect(ARTICULATIONS.guitar).toContain('Palm Muted');
      expect(ARTICULATIONS.guitar).toContain('Fingerpicked');
    });

    it('drums has expected articulations', () => {
      expect(ARTICULATIONS.drums).toContain('Brushed');
      expect(ARTICULATIONS.drums).toContain('Tight');
      expect(ARTICULATIONS.drums).toContain('Driving');
    });
  });

  describe('INSTRUMENT_CATEGORIES mapping', () => {
    it('maps guitar instruments to guitar category', () => {
      expect(INSTRUMENT_CATEGORIES['guitar']).toBe('guitar');
      expect(INSTRUMENT_CATEGORIES['acoustic guitar']).toBe('guitar');
      expect(INSTRUMENT_CATEGORIES['Telecaster']).toBe('guitar');
    });

    it('maps piano instruments to piano category', () => {
      expect(INSTRUMENT_CATEGORIES['piano']).toBe('piano');
      expect(INSTRUMENT_CATEGORIES['Rhodes']).toBe('piano');
      expect(INSTRUMENT_CATEGORIES['Wurlitzer']).toBe('piano');
    });

    it('maps brass instruments to brass category', () => {
      expect(INSTRUMENT_CATEGORIES['trumpet']).toBe('brass');
      expect(INSTRUMENT_CATEGORIES['trombone']).toBe('brass');
      expect(INSTRUMENT_CATEGORIES['french horn']).toBe('brass');
    });
  });

  describe('getArticulationForInstrument', () => {
    it('returns articulation for known instrument', () => {
      const rng = createRng(42);
      const articulation = getArticulationForInstrument('guitar', rng);
      expect(articulation).not.toBeNull();
      expect(ARTICULATIONS.guitar).toContain(articulation);
    });

    it('returns null for unknown instrument', () => {
      const result = getArticulationForInstrument('unknown_instrument_xyz');
      expect(result).toBeNull();
    });

    it('is deterministic with seeded RNG', () => {
      const rng1 = createRng(123);
      const rng2 = createRng(123);
      const art1 = getArticulationForInstrument('drums', rng1);
      const art2 = getArticulationForInstrument('drums', rng2);
      expect(art1).toBe(art2);
    });
  });

  describe('articulateInstrument', () => {
    it('returns original instrument when chance fails', () => {
      const rng = () => 0.99; // Will fail 0.4 chance check
      const result = articulateInstrument('guitar', rng, 0.4);
      expect(result).toBe('guitar');
    });

    it('returns articulated instrument when chance succeeds', () => {
      const rng = createRng(42);
      // Run multiple times to find one that articulates
      let found = false;
      for (let i = 0; i < 20; i++) {
        const seedRng = createRng(i);
        const result = articulateInstrument('guitar', seedRng, 1.0); // 100% chance
        if (result !== 'guitar') {
          found = true;
          expect(result).toContain('guitar');
          expect(result.split(' ').length).toBe(2);
          break;
        }
      }
      expect(found).toBe(true);
    });

    it('returns original for unknown instrument even with 100% chance', () => {
      const result = articulateInstrument('unknown_xyz', () => 0, 1.0);
      expect(result).toBe('unknown_xyz');
    });
  });
});

describe('Vocal Descriptors', () => {
  describe('VOCAL_RANGES constant', () => {
    it('has male, female, and neutral ranges', () => {
      expect(VOCAL_RANGES.male).toContain('Tenor');
      expect(VOCAL_RANGES.male).toContain('Baritone');
      expect(VOCAL_RANGES.female).toContain('Soprano');
      expect(VOCAL_RANGES.female).toContain('Alto');
      expect(VOCAL_RANGES.neutral.length).toBeGreaterThan(0);
    });
  });

  describe('VOCAL_DELIVERIES constant', () => {
    it('has common deliveries', () => {
      expect(VOCAL_DELIVERIES).toContain('Belting');
      expect(VOCAL_DELIVERIES).toContain('Breathy');
      expect(VOCAL_DELIVERIES).toContain('Smooth');
      expect(VOCAL_DELIVERIES).toContain('Raspy');
    });

    it('has at least 15 deliveries', () => {
      expect(VOCAL_DELIVERIES.length).toBeGreaterThanOrEqual(15);
    });
  });

  describe('VOCAL_TECHNIQUES constant', () => {
    it('has common techniques', () => {
      expect(VOCAL_TECHNIQUES).toContain('Stacked Harmonies');
      expect(VOCAL_TECHNIQUES).toContain('Call And Response');
      expect(VOCAL_TECHNIQUES).toContain('Ad Libs');
    });
  });

  describe('GENRE_VOCAL_STYLES', () => {
    const EXPECTED_GENRES = ['jazz', 'pop', 'rock', 'electronic', 'rnb', 'soul', 'country', 'folk', 'metal', 'punk'];

    it('has styles for major genres', () => {
      for (const genre of EXPECTED_GENRES) {
        expect(GENRE_VOCAL_STYLES[genre]).toBeDefined();
        expect(GENRE_VOCAL_STYLES[genre].ranges.length).toBeGreaterThan(0);
        expect(GENRE_VOCAL_STYLES[genre].deliveries.length).toBeGreaterThan(0);
        expect(GENRE_VOCAL_STYLES[genre].techniques.length).toBeGreaterThan(0);
      }
    });

    it('jazz has appropriate vocal style', () => {
      const jazz = GENRE_VOCAL_STYLES.jazz;
      expect(jazz.deliveries).toContain('Smooth');
      expect(jazz.techniques).toContain('Scat Fills');
    });

    it('metal has appropriate vocal style', () => {
      const metal = GENRE_VOCAL_STYLES.metal;
      expect(metal.deliveries).toContain('Powerful');
      expect(metal.techniques).toContain('Shouted Hooks');
    });
  });

  describe('getVocalSuggestionsForGenre', () => {
    it('returns valid suggestions for known genre', () => {
      const rng = createRng(42);
      const result = getVocalSuggestionsForGenre('jazz', rng);
      expect(result.range).toBeDefined();
      expect(result.delivery).toBeDefined();
      expect(result.technique).toBeDefined();
    });

    it('returns default suggestions for unknown genre', () => {
      const result = getVocalSuggestionsForGenre('unknown_genre_xyz');
      expect(result.range).toBeDefined();
      expect(result.delivery).toBeDefined();
      expect(result.technique).toBeDefined();
    });

    it('is deterministic with seeded RNG', () => {
      const rng1 = createRng(99);
      const rng2 = createRng(99);
      const result1 = getVocalSuggestionsForGenre('pop', rng1);
      const result2 = getVocalSuggestionsForGenre('pop', rng2);
      expect(result1).toEqual(result2);
    });
  });

  describe('buildVocalDescriptor', () => {
    it('returns formatted descriptor string', () => {
      const rng = createRng(42);
      const result = buildVocalDescriptor('jazz', rng);
      expect(result).toContain(',');
      expect(result).toContain('Delivery');
    });

    it('contains three parts', () => {
      const result = buildVocalDescriptor('rock');
      const parts = result.split(', ');
      expect(parts.length).toBe(3);
    });
  });
});

describe('Production Elements', () => {
  describe('REVERB_TYPES constant', () => {
    it('has common reverb types', () => {
      expect(REVERB_TYPES).toContain('Long Hall Reverb');
      expect(REVERB_TYPES).toContain('Plate Reverb');
      expect(REVERB_TYPES).toContain('Spring Reverb');
    });

    it('has at least 10 reverb types', () => {
      expect(REVERB_TYPES.length).toBeGreaterThanOrEqual(10);
    });
  });

  describe('RECORDING_TEXTURES constant', () => {
    it('has common textures', () => {
      expect(RECORDING_TEXTURES).toContain('Polished Production');
      expect(RECORDING_TEXTURES).toContain('Analog Warmth');
      expect(RECORDING_TEXTURES).toContain('Lo-Fi Dusty');
    });
  });

  describe('GENRE_PRODUCTION_STYLES', () => {
    const EXPECTED_GENRES = ['jazz', 'pop', 'rock', 'electronic', 'ambient', 'lofi', 'metal', 'classical'];

    it('has styles for major genres', () => {
      for (const genre of EXPECTED_GENRES) {
        expect(GENRE_PRODUCTION_STYLES[genre]).toBeDefined();
        expect(GENRE_PRODUCTION_STYLES[genre].reverbs.length).toBeGreaterThan(0);
        expect(GENRE_PRODUCTION_STYLES[genre].textures.length).toBeGreaterThan(0);
      }
    });

    it('lofi has appropriate production style', () => {
      const lofi = GENRE_PRODUCTION_STYLES.lofi;
      expect(lofi.textures).toContain('Lo-Fi Dusty');
      expect(lofi.textures).toContain('Vintage Warmth');
    });

    it('metal has appropriate production style', () => {
      const metal = GENRE_PRODUCTION_STYLES.metal;
      expect(metal.reverbs).toContain('Tight Dry Room');
      expect(metal.dynamics).toContain('Compressed Punch');
    });
  });

  describe('getProductionSuggestionsForGenre', () => {
    it('returns valid suggestions for known genre', () => {
      const rng = createRng(42);
      const result = getProductionSuggestionsForGenre('jazz', rng);
      expect(result.reverb).toBeDefined();
      expect(result.texture).toBeDefined();
      expect(result.dynamic).toBeDefined();
    });

    it('returns default suggestions for unknown genre', () => {
      const result = getProductionSuggestionsForGenre('unknown_xyz');
      expect(result.reverb).toBeDefined();
      expect(result.texture).toBeDefined();
    });

    it('is deterministic with seeded RNG', () => {
      const rng1 = createRng(77);
      const rng2 = createRng(77);
      const result1 = getProductionSuggestionsForGenre('ambient', rng1);
      const result2 = getProductionSuggestionsForGenre('ambient', rng2);
      expect(result1).toEqual(result2);
    });
  });

  describe('buildProductionDescriptor', () => {
    it('returns formatted descriptor string', () => {
      const rng = createRng(42);
      const result = buildProductionDescriptor('jazz', rng);
      expect(result).toContain(',');
      expect(result.length).toBeGreaterThan(10);
    });

    it('includes texture and reverb', () => {
      const result = buildProductionDescriptor('rock');
      // Should have format "Texture, Reverb"
      expect(result.split(', ').length).toBe(2);
    });
  });
});

describe('Chord Progressions', () => {
  describe('Progression collections', () => {
    it('POP_PROGRESSIONS has expected progressions', () => {
      expect(POP_PROGRESSIONS.the_standard).toBeDefined();
      expect(POP_PROGRESSIONS.the_standard.pattern).toBe('I-V-vi-IV');
      expect(POP_PROGRESSIONS.the_doo_wop).toBeDefined();
      expect(POP_PROGRESSIONS.the_sensitive).toBeDefined();
    });

    it('DARK_PROGRESSIONS has expected progressions', () => {
      expect(DARK_PROGRESSIONS.the_andalusian).toBeDefined();
      expect(DARK_PROGRESSIONS.the_phrygian).toBeDefined();
      expect(DARK_PROGRESSIONS.the_sad_loop).toBeDefined();
    });

    it('JAZZ_PROGRESSIONS has expected progressions', () => {
      expect(JAZZ_PROGRESSIONS.the_two_five_one).toBeDefined();
      expect(JAZZ_PROGRESSIONS.the_two_five_one.pattern).toBe('ii-V-I');
      expect(JAZZ_PROGRESSIONS.the_blues).toBeDefined();
      expect(JAZZ_PROGRESSIONS.the_bossa).toBeDefined();
    });

    it('ALL_PROGRESSIONS combines all collections', () => {
      expect(ALL_PROGRESSIONS.the_standard).toBeDefined();
      expect(ALL_PROGRESSIONS.the_andalusian).toBeDefined();
      expect(ALL_PROGRESSIONS.the_two_five_one).toBeDefined();
      expect(Object.keys(ALL_PROGRESSIONS).length).toBeGreaterThanOrEqual(25);
    });
  });

  describe('Progression structure', () => {
    it('each progression has required fields', () => {
      for (const [key, prog] of Object.entries(ALL_PROGRESSIONS)) {
        expect(prog.name).toBeDefined();
        expect(prog.pattern).toBeDefined();
        expect(prog.numerals).toBeDefined();
        expect(prog.mood).toBeDefined();
        expect(prog.mood.length).toBeGreaterThan(0);
        expect(prog.genres).toBeDefined();
        expect(prog.genres.length).toBeGreaterThan(0);
        expect(prog.description).toBeDefined();
      }
    });
  });

  describe('GENRE_PROGRESSIONS mapping', () => {
    const EXPECTED_GENRES = ['jazz', 'pop', 'rock', 'blues', 'electronic', 'metal', 'ambient', 'lofi'];

    it('has mappings for major genres', () => {
      for (const genre of EXPECTED_GENRES) {
        expect(GENRE_PROGRESSIONS[genre]).toBeDefined();
        expect(GENRE_PROGRESSIONS[genre].length).toBeGreaterThan(0);
      }
    });

    it('jazz includes ii-V-I', () => {
      expect(GENRE_PROGRESSIONS.jazz).toContain('the_two_five_one');
    });

    it('blues includes blues progression', () => {
      expect(GENRE_PROGRESSIONS.blues).toContain('the_blues');
    });

    it('metal includes phrygian', () => {
      expect(GENRE_PROGRESSIONS.metal).toContain('the_phrygian');
    });
  });

  describe('getProgressionsForGenre', () => {
    it('returns array of progressions for known genre', () => {
      const progressions = getProgressionsForGenre('jazz');
      expect(progressions.length).toBeGreaterThan(0);
      expect(progressions[0]?.name).toBeDefined();
    });

    it('returns pop progressions for unknown genre', () => {
      const progressions = getProgressionsForGenre('unknown_xyz');
      expect(progressions.length).toBeGreaterThan(0);
    });
  });

  describe('getRandomProgressionForGenre', () => {
    it('returns a progression for known genre', () => {
      const rng = createRng(42);
      const prog = getRandomProgressionForGenre('rock', rng);
      expect(prog.name).toBeDefined();
      expect(prog.pattern).toBeDefined();
    });

    it('returns a pop progression for unknown genre', () => {
      const prog = getRandomProgressionForGenre('unknown_xyz');
      // Falls back to pop progressions
      expect(prog.name).toBeDefined();
      expect(prog.pattern).toBeDefined();
    });

    it('is deterministic with seeded RNG', () => {
      const rng1 = createRng(55);
      const rng2 = createRng(55);
      const prog1 = getRandomProgressionForGenre('jazz', rng1);
      const prog2 = getRandomProgressionForGenre('jazz', rng2);
      expect(prog1.name).toBe(prog2.name);
    });
  });

  describe('buildProgressionDescriptor', () => {
    it('returns formatted descriptor', () => {
      const rng = createRng(42);
      const result = buildProgressionDescriptor('jazz', rng);
      expect(result).toContain('(');
      expect(result).toContain(':');
    });

    it('includes progression name and pattern', () => {
      const result = buildProgressionDescriptor('pop');
      expect(result).toMatch(/\(.+-/); // Contains (pattern-
    });
  });

  describe('detectProgression', () => {
    it('detects ii-V-I mentions', () => {
      const prog = detectProgression('I want a jazz song with a 2-5-1 progression');
      expect(prog?.name).toBe('The 2-5-1');
    });

    it('detects ii-v-i notation', () => {
      const prog = detectProgression('Use a ii-v-i cadence');
      expect(prog?.name).toBe('The 2-5-1');
    });

    it('detects andalusian mentions', () => {
      const prog = detectProgression('A dramatic andalusian descent');
      expect(prog?.name).toBe('The Andalusian');
    });

    it('detects flamenco (maps to andalusian)', () => {
      const prog = detectProgression('Spanish flamenco style');
      expect(prog?.name).toBe('The Andalusian');
    });

    it('detects doo-wop mentions', () => {
      const prog = detectProgression('Classic doo-wop harmony');
      expect(prog?.name).toBe('The Doo-Wop');
    });

    it('detects blues progression', () => {
      const prog = detectProgression('A 12 bar blues shuffle');
      expect(prog?.name).toBe('The Blues');
    });

    it('detects bossa nova', () => {
      const prog = detectProgression('Brazilian bossa nova feel');
      expect(prog?.name).toBe('The Bossa Nova');
    });

    it('detects lydian mentions', () => {
      const prog = detectProgression('A dreamy lydian sound');
      expect(prog?.name).toBe('The Lydian Dream');
    });

    it('detects phrygian mentions', () => {
      const prog = detectProgression('Dark phrygian metal riff');
      expect(prog?.name).toBe('The Phrygian');
    });

    it('returns null for no match', () => {
      const prog = detectProgression('A happy song about sunshine');
      expect(prog).toBeNull();
    });
  });
});
