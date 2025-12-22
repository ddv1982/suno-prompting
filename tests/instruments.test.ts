import { describe, expect, test } from 'bun:test';
import {
  detectHarmonic,
  getHarmonicGuidance,
  detectRhythmic,
  detectAmbient,
  getAmbientInstruments,
  AMBIENT_INSTRUMENT_POOLS,
  extractInstruments,
  normalizeToken,
  matchInstrument,
  isValidInstrument,
  toCanonical,
  INSTRUMENT_REGISTRY,
} from '../src/bun/instruments';

describe('detectHarmonic', () => {
  test('detects lydian_dominant for jazzy/fusion keywords', () => {
    expect(detectHarmonic('jazzy fusion track')).toBe('lydian_dominant');
    expect(detectHarmonic('funky groove')).toBe('lydian_dominant');
  });

  test('detects lydian_augmented for space/mysterious keywords', () => {
    expect(detectHarmonic('alien space vibes')).toBe('lydian_augmented');
    expect(detectHarmonic('mysterious atmosphere')).toBe('lydian_augmented');
  });

  test('detects lydian_sharp_two for exotic/magic keywords', () => {
    expect(detectHarmonic('exotic enchanted melody')).toBe('lydian_sharp_two');
    expect(detectHarmonic('magic forest')).toBe('lydian_sharp_two');
  });

  test('detects pure lydian as fallback for lydian keyword', () => {
    expect(detectHarmonic('lydian mode')).toBe('lydian');
    expect(detectHarmonic('bright #11 chords')).toBe('lydian');
  });

  test('returns null for no match', () => {
    expect(detectHarmonic('rock ballad')).toBeNull();
  });
});

describe('getHarmonicGuidance', () => {
  test('includes style name and key info', () => {
    const guidance = getHarmonicGuidance('lydian');
    expect(guidance).toContain('Pure Lydian');
    expect(guidance).toContain('Maj7#11');
    expect(guidance).toContain('Examples:');
  });

  test('includes bullet points', () => {
    const guidance = getHarmonicGuidance('lydian_dominant');
    expect(guidance.match(/^- /gm)?.length).toBeGreaterThanOrEqual(1);
  });
});

describe('detectRhythmic', () => {
  test('detects polyrhythm keywords', () => {
    expect(detectRhythmic('polyrhythm beat')).toBe('polyrhythm');
    expect(detectRhythmic('3:4 groove')).toBe('polyrhythm');
  });

  test('returns null for no match', () => {
    expect(detectRhythmic('simple beat')).toBeNull();
  });
});

describe('detectAmbient', () => {
  test('detects ambient keywords', () => {
    expect(detectAmbient('ambient soundscape')).toBe(true);
    expect(detectAmbient('atmospheric pads')).toBe(true);
  });

  test('returns null for no match', () => {
    expect(detectAmbient('heavy metal')).toBe(false);
  });
});

describe('getAmbientInstruments', () => {
  function parseBullets(guidance: string): string[] {
    return guidance
      .split('\n')
      .filter(l => l.startsWith('- '))
      .map(l => l.slice(2));
  }

  test('includes genre header and description', () => {
    const guidance = getAmbientInstruments();
    expect(guidance).toContain('SUGGESTED INSTRUMENTS (Suno tags)');
    expect(guidance).toContain('Ambient: warm, intimate, emotional soundscapes');
  });

  test('picks 2-4 Suno canonical tags', () => {
    const guidance = getAmbientInstruments();
    const tags = parseBullets(guidance);
    expect(tags.length).toBeGreaterThanOrEqual(2);
    expect(tags.length).toBeLessThanOrEqual(4);

    const whitelist = new Set<string>(Object.values(AMBIENT_INSTRUMENT_POOLS).flatMap(p => p.instruments));
    for (const tag of tags) {
      expect(whitelist.has(tag)).toBe(true);
    }
  });

  test('returns different instruments on multiple calls (random)', () => {
    const results = new Set<string>();
    for (let i = 0; i < 10; i++) {
      results.add(getAmbientInstruments());
    }
    expect(results.size).toBeGreaterThan(1);
  });

  test('never includes both acoustic piano and Rhodes (exclusion rule)', () => {
    for (let i = 0; i < 50; i++) {
      const guidance = getAmbientInstruments().toLowerCase();
      const hasPiano = guidance.includes('acoustic piano');
      const hasRhodes = guidance.includes('rhodes');
      expect(hasPiano && hasRhodes).toBe(false);
    }
  });

  test('never includes both Rhodes and Wurlitzer (exclusion rule)', () => {
    for (let i = 0; i < 50; i++) {
      const guidance = getAmbientInstruments().toLowerCase();
      const hasRhodes = guidance.includes('rhodes');
      const hasWurli = guidance.includes('wurlitzer');
      expect(hasRhodes && hasWurli).toBe(false);
    }
  });

  test('never includes both bells and singing bowls (exclusion rule)', () => {
    for (let i = 0; i < 50; i++) {
      const guidance = getAmbientInstruments().toLowerCase();
      const hasBells = guidance.includes('bells');
      const hasBowls = guidance.includes('singing bowls');
      expect(hasBells && hasBowls).toBe(false);
    }
  });

  test('always includes a harmonic anchor and a pad/synth tag', () => {
    const anchor = new Set<string>(AMBIENT_INSTRUMENT_POOLS.harmonicAnchor.instruments);
    const pad = new Set<string>(AMBIENT_INSTRUMENT_POOLS.padOrSynth.instruments);

    for (let i = 0; i < 30; i++) {
      const guidance = getAmbientInstruments();
      const tags = parseBullets(guidance);
      expect(tags.some(t => anchor.has(t))).toBe(true);
      expect(tags.some(t => pad.has(t))).toBe(true);
    }
  });

  test('prioritizes user-provided instruments', () => {
    const guidance = getAmbientInstruments({ userInstruments: ['piano', 'violin'] });
    expect(guidance).toContain('User specified (MUST use):');
    expect(guidance).toContain('- piano');
    expect(guidance).toContain('- violin');
  });

  test('fills remaining slots after user instruments', () => {
    const guidance = getAmbientInstruments({ userInstruments: ['cello'] });
    const lines = guidance.split('\n').filter(l => l.startsWith('- '));
    expect(lines.length).toBeGreaterThan(1);
    expect(lines.length).toBeLessThanOrEqual(4);
  });

  test('respects maxTags option', () => {
    const guidance = getAmbientInstruments({ maxTags: 2 });
    const lines = guidance.split('\n').filter(l => l.startsWith('- '));
    expect(lines.length).toBeLessThanOrEqual(2);
  });
});

describe('instrument registry', () => {
  test('registry has entries for all categories', () => {
    const categories = new Set(INSTRUMENT_REGISTRY.map(e => e.category));
    expect(categories.has('harmonic')).toBe(true);
    expect(categories.has('pad')).toBe(true);
    expect(categories.has('color')).toBe(true);
    expect(categories.has('movement')).toBe(true);
    expect(categories.has('rare')).toBe(true);
  });

  test('isValidInstrument returns true for canonical names', () => {
    expect(isValidInstrument('felt piano')).toBe(true);
    expect(isValidInstrument('synth pad')).toBe(true);
    expect(isValidInstrument('cello')).toBe(true);
  });

  test('isValidInstrument returns true for aliases', () => {
    expect(isValidInstrument('piano')).toBe(true);
    expect(isValidInstrument('keys')).toBe(true);
    expect(isValidInstrument('fiddle')).toBe(true);
  });

  test('isValidInstrument is case-insensitive', () => {
    expect(isValidInstrument('Piano')).toBe(true);
    expect(isValidInstrument('PIANO')).toBe(true);
    expect(isValidInstrument('PiAnO')).toBe(true);
  });

  test('isValidInstrument returns false for unknown instruments', () => {
    expect(isValidInstrument('kazoo')).toBe(false);
    expect(isValidInstrument('theremin')).toBe(false);
  });

  test('toCanonical converts aliases to canonical names', () => {
    expect(toCanonical('piano')).toBe('felt piano');
    expect(toCanonical('keys')).toBe('felt piano');
    expect(toCanonical('fiddle')).toBe('violin');
    expect(toCanonical('vibes')).toBe('vibraphone');
  });

  test('toCanonical returns null for unknown instruments', () => {
    expect(toCanonical('kazoo')).toBeNull();
    expect(toCanonical('theremin')).toBeNull();
  });
});

describe('normalizeToken', () => {
  test('lowercases and trims', () => {
    expect(normalizeToken('  Piano  ')).toBe('piano');
    expect(normalizeToken('GUITAR')).toBe('guitar');
  });

  test('removes special characters', () => {
    expect(normalizeToken('piano!')).toBe('piano');
    expect(normalizeToken('(guitar)')).toBe('guitar');
  });

  test('normalizes whitespace', () => {
    expect(normalizeToken('felt   piano')).toBe('felt piano');
  });
});

describe('matchInstrument', () => {
  test('matches canonical names', () => {
    expect(matchInstrument('felt piano')).toBe('felt piano');
    expect(matchInstrument('cello')).toBe('cello');
  });

  test('matches aliases to canonical', () => {
    expect(matchInstrument('piano')).toBe('felt piano');
    expect(matchInstrument('keys')).toBe('felt piano');
    expect(matchInstrument('fiddle')).toBe('violin');
  });

  test('handles articles', () => {
    expect(matchInstrument('a piano')).toBe('felt piano');
    expect(matchInstrument('the guitar')).toBe('guitar');
  });

  test('returns null for non-instruments', () => {
    expect(matchInstrument('happy')).toBeNull();
    expect(matchInstrument('loud')).toBeNull();
  });
});

describe('extractInstruments', () => {
  test('extracts instruments from "with" phrases', () => {
    const result = extractInstruments('An ambient track with piano and cello');
    expect(result.found).toContain('felt piano');
    expect(result.found).toContain('cello');
  });

  test('extracts instruments from "featuring" phrases', () => {
    const result = extractInstruments('A soundscape featuring strings and synth');
    expect(result.found).toContain('strings');
    expect(result.found).toContain('synth');
  });

  test('extracts multiple instruments from comma-separated list', () => {
    const result = extractInstruments('Using piano, guitar, and drums');
    expect(result.found).toContain('felt piano');
    expect(result.found).toContain('guitar');
    expect(result.found).toContain('drums');
  });

  test('handles aliases and converts to canonical', () => {
    const result = extractInstruments('A track with keys and fiddle');
    expect(result.found).toContain('felt piano');
    expect(result.found).toContain('violin');
  });

  test('returns empty array for no instruments', () => {
    const result = extractInstruments('A happy upbeat song');
    expect(result.found).toHaveLength(0);
  });

  test('deduplicates instruments', () => {
    const result = extractInstruments('Piano with piano and more piano');
    const pianoCount = result.found.filter(i => i === 'felt piano').length;
    expect(pianoCount).toBe(1);
  });

  test('handles complex descriptions', () => {
    const result = extractInstruments(
      'Create an atmospheric ambient track featuring lush strings and ethereal synth pads, with subtle piano melodies'
    );
    expect(result.found).toContain('strings');
    expect(result.found).toContain('synth pad');
    expect(result.found).toContain('felt piano');
  });
});

