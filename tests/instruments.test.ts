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
    const guidance = getGenreInstruments('ambient');
    expect(guidance).toContain('SUGGESTED INSTRUMENTS (Ambient)');
    expect(guidance).toContain('Warm, intimate, emotional soundscapes');
  });

  test('picks 4 or 5 random instruments', () => {
    const guidance = getGenreInstruments('ambient');
    const lines = guidance.split('\n').filter(l => l.startsWith('- '));
    expect(lines.length).toBeGreaterThanOrEqual(4);
    expect(lines.length).toBeLessThanOrEqual(5);
  });

  test('returns different instruments on multiple calls (random)', () => {
    const results = new Set<string>();
    for (let i = 0; i < 10; i++) {
      results.add(getGenreInstruments('ambient'));
    }
    // With random selection, we expect variation
    expect(results.size).toBeGreaterThan(1);
  });
});
