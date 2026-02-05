import { describe, expect, test } from 'bun:test';

import {
  MODE_PALETTES,
  selectInstrumentsForMode,
  EXCLUSION_RULES,
  getModePalette,
} from '@bun/instruments/modes';
import { INSTRUMENT_REGISTRY, getInstrumentsByCategory } from '@bun/instruments/registry';

describe('MODE_PALETTES', () => {
  test('has palettes for all Lydian modes', () => {
    expect(MODE_PALETTES.lydian).toBeDefined();
    expect(MODE_PALETTES.lydian_dominant).toBeDefined();
    expect(MODE_PALETTES.lydian_augmented).toBeDefined();
    expect(MODE_PALETTES.lydian_sharp_two).toBeDefined();
  });

  test('has palettes for other modes', () => {
    expect(MODE_PALETTES.ionian).toBeDefined();
    expect(MODE_PALETTES.dorian).toBeDefined();
    expect(MODE_PALETTES.phrygian).toBeDefined();
    expect(MODE_PALETTES.mixolydian).toBeDefined();
    expect(MODE_PALETTES.aeolian).toBeDefined();
    expect(MODE_PALETTES.locrian).toBeDefined();
    expect(MODE_PALETTES.harmonic_minor).toBeDefined();
    expect(MODE_PALETTES.melodic_minor).toBeDefined();
  });

  test('each palette has required fields', () => {
    for (const [, palette] of Object.entries(MODE_PALETTES)) {
      expect(palette.name).toBeDefined();
      expect(palette.pools).toBeDefined();
      expect(palette.maxTags).toBeGreaterThan(0);
      expect(Object.keys(palette.pools).length).toBeGreaterThan(0);
    }
  });
});

describe('selectInstrumentsForMode', () => {
  test('returns instruments for valid mode', () => {
    const instruments = selectInstrumentsForMode('lydian');
    expect(instruments.length).toBeGreaterThan(0);
  });

  test('returns empty array for unknown mode', () => {
    const instruments = selectInstrumentsForMode('unknown_mode');
    expect(instruments).toEqual([]);
  });

  test('all returned instruments are from registry', () => {
    const allCanonical = new Set(INSTRUMENT_REGISTRY.map((e) => e.canonical));

    for (let i = 0; i < 20; i++) {
      const instruments = selectInstrumentsForMode('lydian_augmented');
      for (const instrument of instruments) {
        expect(allCanonical.has(instrument)).toBe(true);
      }
    }
  });

  test('respects maxTags limit', () => {
    for (const [mode, palette] of Object.entries(MODE_PALETTES)) {
      for (let i = 0; i < 10; i++) {
        const instruments = selectInstrumentsForMode(mode);
        expect(instruments.length).toBeLessThanOrEqual(palette.maxTags);
      }
    }
  });

  test('produces variety across multiple calls', () => {
    const results = new Set<string>();
    for (let i = 0; i < 30; i++) {
      const instruments = selectInstrumentsForMode('lydian');
      results.add(instruments.sort().join(','));
    }
    expect(results.size).toBeGreaterThan(1);
  });

  test('instruments come from correct categories', () => {
    const palette = MODE_PALETTES.lydian_augmented!;
    const allowedCategories = Object.keys(palette.pools);

    for (let i = 0; i < 20; i++) {
      const instruments = selectInstrumentsForMode('lydian_augmented');

      for (const instrument of instruments) {
        const entry = INSTRUMENT_REGISTRY.find((e) => e.canonical === instrument);
        expect(entry).toBeDefined();
        expect(allowedCategories).toContain(entry!.category);
      }
    }
  });
});

describe('EXCLUSION_RULES', () => {
  test('exclusion rules prevent conflicting instruments', () => {
    for (let i = 0; i < 50; i++) {
      const instruments = selectInstrumentsForMode('lydian');

      for (const [a, b] of EXCLUSION_RULES) {
        const hasA = instruments.includes(a);
        const hasB = instruments.includes(b);
        expect(hasA && hasB).toBe(false);
      }
    }
  });

  test('never includes both Rhodes and Wurlitzer', () => {
    for (let i = 0; i < 50; i++) {
      const instruments = selectInstrumentsForMode('lydian_dominant');
      const hasRhodes = instruments.includes('Rhodes');
      const hasWurli = instruments.includes('Wurlitzer');
      expect(hasRhodes && hasWurli).toBe(false);
    }
  });

  test('never includes both bells and singing bowls', () => {
    for (let i = 0; i < 50; i++) {
      const instruments = selectInstrumentsForMode('lydian_augmented');
      const hasBells = instruments.includes('bells');
      const hasBowls = instruments.includes('singing bowls');
      expect(hasBells && hasBowls).toBe(false);
    }
  });
});

describe('getModePalette', () => {
  test('returns palette for valid mode', () => {
    const palette = getModePalette('lydian');
    expect(palette).toBeDefined();
    expect(palette!.name).toBe('Pure Lydian');
  });

  test('returns undefined for unknown mode', () => {
    const palette = getModePalette('nonexistent');
    expect(palette).toBeUndefined();
  });
});

describe('pool coverage', () => {
  test('harmonic category has instruments', () => {
    const instruments = getInstrumentsByCategory('harmonic');
    expect(instruments.length).toBeGreaterThan(0);
  });

  test('pad category has instruments', () => {
    const instruments = getInstrumentsByCategory('pad');
    expect(instruments.length).toBeGreaterThan(0);
  });

  test('color category has instruments', () => {
    const instruments = getInstrumentsByCategory('color');
    expect(instruments.length).toBeGreaterThan(0);
  });

  test('movement category has instruments', () => {
    const instruments = getInstrumentsByCategory('movement');
    expect(instruments.length).toBeGreaterThan(0);
  });

  test('rare category has instruments', () => {
    const instruments = getInstrumentsByCategory('rare');
    expect(instruments.length).toBeGreaterThan(0);
  });
});
