import { describe, expect, test } from 'bun:test';
import { detectHarmonic, getHarmonicGuidance, detectRhythmic, detectGenre } from '../src/bun/instruments';

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

import { getGenreInstruments } from '../src/bun/instruments';

describe('getGenreInstruments', () => {
  test('includes ambient instruments and picks 5', () => {
    const guidance = getGenreInstruments('ambient');
    expect(guidance).toContain('SUGGESTED INSTRUMENTS (Ambient)');
    const lines = guidance.split('\n').filter(l => l.startsWith('- '));
    expect(lines.length).toBe(5);
  });

  test('can pick from the expanded ambient instrument list', () => {
    // Run multiple times to increase chance of hitting a new instrument
    const instruments = new Set<string>();
    for (let i = 0; i < 20; i++) {
      const guidance = getGenreInstruments('ambient');
      const lines = guidance.split('\n').filter(l => l.startsWith('- '));
      lines.forEach(l => instruments.add(l.replace('- ', '')));
    }
    
    expect(instruments.has('Looped tape textures / tape-hiss-saturated soundscapes')).toBe(true);
    expect(instruments.has('Briefcase modular synth (Synthi AKS-style)')).toBe(true);
    expect(instruments.has('Early digital FM synths (DX7-style) - glassy, cold, but evolving')).toBe(true);
  });
});
