import { describe, expect, test } from 'bun:test';
import {
  SYNTH_REPLACEMENTS,
  getSynthAlternatives,
  hasSynthAlternative,
  suggestSynthReplacement,
  getAllSynthInstruments,
  isValidInstrument,
} from '@bun/instruments';

describe('Synth Replacements', () => {
  test('SYNTH_REPLACEMENTS has entries for common acoustic instruments', () => {
    expect(SYNTH_REPLACEMENTS['strings']).toBeDefined();
    expect(SYNTH_REPLACEMENTS['choir']).toBeDefined();
    expect(SYNTH_REPLACEMENTS['trumpet']).toBeDefined();
    expect(SYNTH_REPLACEMENTS['flute']).toBeDefined();
    expect(SYNTH_REPLACEMENTS['bass']).toBeDefined();
    expect(SYNTH_REPLACEMENTS['felt piano']).toBeDefined();
  });

  test('strings can be replaced with synth strings or mellotron', () => {
    const alternatives = SYNTH_REPLACEMENTS['strings'];
    expect(alternatives).toContain('synth strings');
    expect(alternatives).toContain('mellotron');
  });

  test('choir can be replaced with synth choir, mellotron, or vocoder', () => {
    const alternatives = SYNTH_REPLACEMENTS['choir'];
    expect(alternatives).toContain('synth choir');
    expect(alternatives).toContain('mellotron');
    expect(alternatives).toContain('vocoder');
  });

  test('brass instruments share synth brass replacement', () => {
    expect(SYNTH_REPLACEMENTS['trumpet']).toContain('synth brass');
    expect(SYNTH_REPLACEMENTS['trombone']).toContain('synth brass');
    expect(SYNTH_REPLACEMENTS['french horn']).toContain('synth brass');
  });
});

describe('getSynthAlternatives', () => {
  test('returns alternatives for known instruments', () => {
    expect(getSynthAlternatives('strings')).toEqual(['synth strings', 'mellotron']);
    expect(getSynthAlternatives('flute')).toEqual(['synth flute']);
    expect(getSynthAlternatives('bass')).toEqual(['synth bass', 'sub-bass']);
  });

  test('returns empty array for instruments without synth alternatives', () => {
    expect(getSynthAlternatives('vibraphone')).toEqual([]);
    expect(getSynthAlternatives('djembe')).toEqual([]);
    expect(getSynthAlternatives('nonexistent')).toEqual([]);
  });

  test('is case-insensitive', () => {
    expect(getSynthAlternatives('STRINGS')).toEqual(['synth strings', 'mellotron']);
    expect(getSynthAlternatives('Flute')).toEqual(['synth flute']);
  });
});

describe('hasSynthAlternative', () => {
  test('returns true for instruments with alternatives', () => {
    expect(hasSynthAlternative('strings')).toBe(true);
    expect(hasSynthAlternative('choir')).toBe(true);
    expect(hasSynthAlternative('trumpet')).toBe(true);
    expect(hasSynthAlternative('felt piano')).toBe(true);
  });

  test('returns false for instruments without alternatives', () => {
    expect(hasSynthAlternative('vibraphone')).toBe(false);
    expect(hasSynthAlternative('taiko drums')).toBe(false);
    expect(hasSynthAlternative('shaker')).toBe(false);
  });
});

describe('suggestSynthReplacement', () => {
  test('returns a valid synth alternative', () => {
    const alternatives = SYNTH_REPLACEMENTS['strings'];
    const suggestion = suggestSynthReplacement('strings');
    expect(suggestion).not.toBeNull();
    expect(alternatives).toContain(suggestion!);
  });

  test('returns null for instruments without alternatives', () => {
    expect(suggestSynthReplacement('vibraphone')).toBeNull();
    expect(suggestSynthReplacement('nonexistent')).toBeNull();
  });

  test('randomly selects from available alternatives', () => {
    const suggestions = new Set<string>();
    for (let i = 0; i < 50; i++) {
      const suggestion = suggestSynthReplacement('choir');
      if (suggestion) suggestions.add(suggestion);
    }
    // Choir has 3 alternatives, we should see variety
    expect(suggestions.size).toBeGreaterThan(1);
  });
});

describe('getAllSynthInstruments', () => {
  test('returns list of all synth instruments', () => {
    const synthInstruments = getAllSynthInstruments();
    expect(synthInstruments.length).toBeGreaterThan(10);
    expect(synthInstruments).toContain('synth strings');
    expect(synthInstruments).toContain('synth brass');
    expect(synthInstruments).toContain('synth bass');
    expect(synthInstruments).toContain('arpeggiator');
    expect(synthInstruments).toContain('808');
  });

  test('all synth instruments are valid in registry', () => {
    const synthInstruments = getAllSynthInstruments();
    for (const inst of synthInstruments) {
      expect(isValidInstrument(inst)).toBe(true);
    }
  });
});

describe('New Synth Instruments in Registry', () => {
  test('synth string variants are valid', () => {
    expect(isValidInstrument('synth strings')).toBe(true);
    expect(isValidInstrument('string synth')).toBe(true);
  });

  test('synth brass is valid', () => {
    expect(isValidInstrument('synth brass')).toBe(true);
    expect(isValidInstrument('brass synth')).toBe(true);
  });

  test('synth choir is valid', () => {
    expect(isValidInstrument('synth choir')).toBe(true);
    expect(isValidInstrument('vocal synth')).toBe(true);
  });

  test('synth piano is valid', () => {
    expect(isValidInstrument('synth piano')).toBe(true);
    expect(isValidInstrument('electric grand')).toBe(true);
  });

  test('synth flute is valid', () => {
    expect(isValidInstrument('synth flute')).toBe(true);
    expect(isValidInstrument('FM flute')).toBe(true);
  });

  test('synth bells is valid', () => {
    expect(isValidInstrument('synth bells')).toBe(true);
    expect(isValidInstrument('FM bells')).toBe(true);
  });

  test('arpeggiator is valid', () => {
    expect(isValidInstrument('arpeggiator')).toBe(true);
    expect(isValidInstrument('arp')).toBe(true);
  });

  test('synth bass is valid', () => {
    expect(isValidInstrument('synth bass')).toBe(true);
    expect(isValidInstrument('bass synth')).toBe(true);
  });

  test('808 is valid', () => {
    expect(isValidInstrument('808')).toBe(true);
    expect(isValidInstrument('TR-808')).toBe(true);
  });

  test('new rare instruments are valid', () => {
    expect(isValidInstrument('theremin')).toBe(true);
    expect(isValidInstrument('vocoder')).toBe(true);
    expect(isValidInstrument('mellotron')).toBe(true);
  });

  test('folk instruments are valid', () => {
    expect(isValidInstrument('mandolin')).toBe(true);
    expect(isValidInstrument('banjo')).toBe(true);
    expect(isValidInstrument('harmonica')).toBe(true);
    expect(isValidInstrument('accordion')).toBe(true);
  });

  test('orchestral instruments are valid', () => {
    expect(isValidInstrument('timpani')).toBe(true);
    expect(isValidInstrument('organ')).toBe(true);
  });
});
