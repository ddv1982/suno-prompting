import { describe, expect, test } from 'bun:test';
import {
  detectHarmonic,
  getHarmonicGuidance,
  detectRhythmic,
  detectAmbient,
  getAmbientInstruments,
  AMBIENT_INSTRUMENT_POOLS,
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
});

