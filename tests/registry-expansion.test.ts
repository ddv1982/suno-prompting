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
    instruments.forEach(i => { expect(isValidInstrument(i)).toBe(true); });
  });

  test('all latin percussion are movement category', () => {
    const instruments = ['guiro', 'cuica', 'agogo bells', 'cowbell', 'cabasa', 'pandeiro', 'maracas', 'repinique'];
    instruments.forEach(i => { expect(getCategory(i)).toBe('movement'); });
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
    instruments.forEach(i => { expect(isValidInstrument(i)).toBe(true); });
  });

  test('all extended-range guitars are harmonic category', () => {
    const instruments = ['seven-string guitar', 'eight-string guitar', 'baritone guitar'];
    instruments.forEach(i => { expect(getCategory(i)).toBe('harmonic'); });
  });
});

describe('Country/Americana Instruments', () => {
  test.each([
    ['dobro', 'dobro'],
    ['resonator guitar', 'dobro'],
    ['resophonic guitar', 'dobro'],
    ['lap steel guitar', 'lap steel guitar'],
    ['lap steel', 'lap steel guitar'],
    ['hawaiian guitar', 'lap steel guitar'],
    ['autoharp', 'autoharp'],
    ['chord zither', 'autoharp'],
    ['hammered dulcimer', 'hammered dulcimer'],
    ['cimbalom', 'hammered dulcimer'],
    ['mountain dulcimer', 'mountain dulcimer'],
    ['appalachian dulcimer', 'mountain dulcimer'],
    ['washboard', 'washboard'],
    ['frottoir', 'washboard'],
  ])('%s resolves to %s', (input, expected) => {
    expect(toCanonical(input)).toBe(expected);
  });

  test('all country instruments are valid', () => {
    const instruments = ['dobro', 'lap steel guitar', 'autoharp', 'hammered dulcimer', 'mountain dulcimer', 'washboard'];
    instruments.forEach(i => { expect(isValidInstrument(i)).toBe(true); });
  });
});

describe('Jazz Brass Instruments', () => {
  test.each([
    ['baritone saxophone', 'baritone saxophone'],
    ['bari sax', 'baritone saxophone'],
    ['baritone sax', 'baritone saxophone'],
    ['flugelhorn', 'flugelhorn'],
    ['flugel', 'flugelhorn'],
    ['fluegel horn', 'flugelhorn'],
  ])('%s resolves to %s', (input, expected) => {
    expect(toCanonical(input)).toBe(expected);
  });

  test('all jazz brass are color category', () => {
    const instruments = ['baritone saxophone', 'flugelhorn'];
    instruments.forEach(i => { expect(getCategory(i)).toBe('color'); });
  });
});

describe('Folk Traditional Instruments', () => {
  test.each([
    ['hurdy gurdy', 'hurdy gurdy'],
    ['hurdy-gurdy', 'hurdy gurdy'],
    ['wheel fiddle', 'hurdy gurdy'],
    ['nyckelharpa', 'nyckelharpa'],
    ['keyed fiddle', 'nyckelharpa'],
    ['concertina', 'concertina'],
    ['english concertina', 'concertina'],
    ['jaw harp', 'jaw harp'],
    ['jews harp', 'jaw harp'],
    ['mouth harp', 'jaw harp'],
  ])('%s resolves to %s', (input, expected) => {
    expect(toCanonical(input)).toBe(expected);
  });

  test('folk instruments have correct categories', () => {
    expect(getCategory('hurdy gurdy')).toBe('rare');
    expect(getCategory('nyckelharpa')).toBe('rare');
    expect(getCategory('concertina')).toBe('color');
    expect(getCategory('jaw harp')).toBe('rare');
  });
});

describe('World/Ethnic Instruments', () => {
  test.each([
    ['tabla', 'tabla'],
    ['indian drums', 'tabla'],
    ['dholak', 'dholak'],
    ['dholki', 'dholak'],
    ['santoor', 'santoor'],
    ['santur', 'santoor'],
    ['persian dulcimer', 'santoor'],
    ['sarod', 'sarod'],
    ['didgeridoo', 'didgeridoo'],
    ['didge', 'didgeridoo'],
    ['yidaki', 'didgeridoo'],
    ['udu drum', 'udu drum'],
    ['clay pot drum', 'udu drum'],
    ['ogene', 'ogene'],
    ['iron bell', 'ogene'],
  ])('%s resolves to %s', (input, expected) => {
    expect(toCanonical(input)).toBe(expected);
  });

  test('world instruments have correct categories', () => {
    expect(getCategory('tabla')).toBe('movement');
    expect(getCategory('dholak')).toBe('movement');
    expect(getCategory('santoor')).toBe('color');
    expect(getCategory('sarod')).toBe('color');
    expect(getCategory('didgeridoo')).toBe('rare');
    expect(getCategory('udu drum')).toBe('movement');
    expect(getCategory('ogene')).toBe('movement');
  });
});

describe('Electronic/Production Instruments', () => {
  test.each([
    ['TR-909', 'TR-909'],
    ['909', 'TR-909'],
    ['Roland 909', 'TR-909'],
    ['TB-303', 'TB-303'],
    ['303', 'TB-303'],
    ['acid bass', 'TB-303'],
    ['talkbox', 'talkbox'],
    ['talk box', 'talkbox'],
    ['Linn drum', 'Linn drum'],
    ['LinnDrum', 'Linn drum'],
  ])('%s resolves to %s', (input, expected) => {
    expect(toCanonical(input)).toBe(expected);
  });

  test('electronic instruments have correct categories', () => {
    expect(getCategory('TR-909')).toBe('movement');
    expect(getCategory('TB-303')).toBe('movement');
    expect(getCategory('talkbox')).toBe('rare');
    expect(getCategory('Linn drum')).toBe('movement');
  });
});
