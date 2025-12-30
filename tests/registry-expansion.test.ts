import { describe, test, expect } from 'bun:test';
import { isValidInstrument, toCanonical, getCategory } from '@bun/instruments/registry';

describe('Latin Percussion Instruments', () => {
  test.each([
    ['guiro', 'guiro'],
    ['scraper', 'guiro'],
    ['guira', 'guiro'],
    ['cuica', 'cuica'],
    ['friction drum', 'cuica'],
    ['agogo bells', 'agogo bells'],
    ['agogo', 'agogo bells'],
    ['double bells', 'agogo bells'],
    ['cowbell', 'cowbell'],
    ['cencerro', 'cowbell'],
    ['campana', 'cowbell'],
    ['cabasa', 'cabasa'],
    ['afuche', 'cabasa'],
    ['pandeiro', 'pandeiro'],
    ['brazilian tambourine', 'pandeiro'],
    ['maracas', 'maracas'],
    ['rumba shakers', 'maracas'],
    ['repinique', 'repinique'],
    ['repique', 'repinique'],
  ])('%s resolves to %s', (input, expected) => {
    expect(toCanonical(input)).toBe(expected);
  });

  test('all latin percussion are valid instruments', () => {
    const instruments = ['guiro', 'cuica', 'agogo bells', 'cowbell', 'cabasa', 'pandeiro', 'maracas', 'repinique'];
    instruments.forEach(i => expect(isValidInstrument(i)).toBe(true));
  });

  test('all latin percussion are movement category', () => {
    const instruments = ['guiro', 'cuica', 'agogo bells', 'cowbell', 'cabasa', 'pandeiro', 'maracas', 'repinique'];
    instruments.forEach(i => expect(getCategory(i)).toBe('movement'));
  });
});

describe('Extended-Range Guitars', () => {
  test.each([
    ['seven-string guitar', 'seven-string guitar'],
    ['7-string', 'seven-string guitar'],
    ['7 string guitar', 'seven-string guitar'],
    ['7-string electric', 'seven-string guitar'],
    ['eight-string guitar', 'eight-string guitar'],
    ['8-string', 'eight-string guitar'],
    ['8 string guitar', 'eight-string guitar'],
    ['baritone guitar', 'baritone guitar'],
    ['bari guitar', 'baritone guitar'],
    ['baritone electric', 'baritone guitar'],
  ])('%s resolves to %s', (input, expected) => {
    expect(toCanonical(input)).toBe(expected);
  });

  test('all extended-range guitars are valid instruments', () => {
    const instruments = ['seven-string guitar', 'eight-string guitar', 'baritone guitar'];
    instruments.forEach(i => expect(isValidInstrument(i)).toBe(true));
  });

  test('all extended-range guitars are harmonic category', () => {
    const instruments = ['seven-string guitar', 'eight-string guitar', 'baritone guitar'];
    instruments.forEach(i => expect(getCategory(i)).toBe('harmonic'));
  });
});
