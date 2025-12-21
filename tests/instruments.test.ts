import { describe, expect, test } from 'bun:test';
import { detectHarmonic, getHarmonicGuidance, detectRhythmic, detectGenre, getGenreInstruments } from '../src/bun/instruments';

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

describe('detectGenre', () => {
  test('detects ambient keywords', () => {
    expect(detectGenre('ambient soundscape')).toBe('ambient');
    expect(detectGenre('atmospheric pads')).toBe('ambient');
  });

  test('returns null for no match', () => {
    expect(detectGenre('heavy metal')).toBeNull();
  });
});

describe('getGenreInstruments', () => {
  test('includes genre header and description', () => {
    const guidance = getGenreInstruments();
    expect(guidance).toContain('SUGGESTED INSTRUMENTS (Ambient)');
    expect(guidance).toContain('Warm, intimate, emotional soundscapes');
  });

  test('picks 4-9 instruments from pools', () => {
    const guidance = getGenreInstruments();
    const lines = guidance.split('\n').filter(l => l.startsWith('- '));
    // Pool system: 1 core + 1-2 pads + 1 color + 0-1 voice + 1 texture + 0-1 rhythm + 0-1 contrast + 0-1 rare = 4-9
    expect(lines.length).toBeGreaterThanOrEqual(4);
    expect(lines.length).toBeLessThanOrEqual(9);
  });

  test('returns different instruments on multiple calls (random)', () => {
    const results = new Set<string>();
    for (let i = 0; i < 10; i++) {
      results.add(getGenreInstruments());
    }
    expect(results.size).toBeGreaterThan(1);
  });

  test('never includes both acoustic piano and Rhodes (exclusion rule)', () => {
    for (let i = 0; i < 50; i++) {
      const guidance = getGenreInstruments().toLowerCase();
      const hasPiano = guidance.includes('acoustic piano');
      const hasRhodes = guidance.includes('rhodes');
      expect(hasPiano && hasRhodes).toBe(false);
    }
  });

  test('never includes both Rhodes and Wurlitzer (exclusion rule)', () => {
    for (let i = 0; i < 50; i++) {
      const guidance = getGenreInstruments().toLowerCase();
      const hasRhodes = guidance.includes('rhodes');
      const hasWurli = guidance.includes('wurlitzer');
      expect(hasRhodes && hasWurli).toBe(false);
    }
  });

  test('never includes both bells and singing bowls (exclusion rule)', () => {
    for (let i = 0; i < 50; i++) {
      const guidance = getGenreInstruments().toLowerCase();
      const hasBells = guidance.includes('bells');
      const hasBowls = guidance.includes('singing bowls');
      expect(hasBells && hasBowls).toBe(false);
    }
  });

  test('always includes at least one core harmonic instrument', () => {
    const coreKeywords = ['piano', 'rhodes', 'wurlitzer', 'nord stage', 'triton', 'harmonium', 'celesta', 'omnichord'];
    for (let i = 0; i < 20; i++) {
      const guidance = getGenreInstruments().toLowerCase();
      const hasCore = coreKeywords.some(k => guidance.includes(k));
      expect(hasCore).toBe(true);
    }
  });

  test('includes at least one organic and one electronic element (contrast guarantee)', () => {
    const organicMarkers = [
      'acoustic',
      'piano',
      'vibraphone',
      'marimba',
      'kalimba',
      'glockenspiel',
      'gamelan',
      'bells',
      'bowls',
      'waterphone',
      'strings',
      'cello',
      'viola',
      'clarinet',
      'shakuhachi',
      'duduk',
      'guitar',
      'harmonium',
      'handpan',
      'frame-drum',
      'shakers',
      'rattles',
      'gourds',
      'clockwork',
      'ticks',
      'hydrophone',
      'contact-mic',
      'found-percussion',
    ];

    const electronicMarkers = ['synth', 'wavetable', 'wavestation', 'd-50', 'digital', 'fm', 'dx7', 'tape', 'granular', 'sequencer', 'eventide', 'triton', 'nord'];

    for (let i = 0; i < 30; i++) {
      const guidance = getGenreInstruments().toLowerCase();
      const hasOrganic = organicMarkers.some(k => guidance.includes(k));
      const hasElectronic = electronicMarkers.some(k => guidance.includes(k));
      expect(hasOrganic).toBe(true);
      expect(hasElectronic).toBe(true);
    }
  });
});
