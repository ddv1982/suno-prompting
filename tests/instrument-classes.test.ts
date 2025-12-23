import { describe, expect, test } from 'bun:test';
import {
  FOUNDATIONAL_INSTRUMENTS,
  MULTIGENRE_INSTRUMENTS,
  buildInstrumentToGenresIndex,
  isFoundationalInstrument,
  isMultiGenreInstrument,
  computeMultiGenreInstruments,
} from '@bun/instruments/datasets/instrumentClasses';
import { isValidInstrument } from '@bun/instruments/registry';

describe('Instrument classes', () => {
  test('foundational instruments exist in registry', () => {
    for (const i of FOUNDATIONAL_INSTRUMENTS) {
      expect(isValidInstrument(i)).toBe(true);
      expect(isFoundationalInstrument(i)).toBe(true);
    }
  });

  test('multigenre instruments exist in registry and exclude foundational', () => {
    for (const i of MULTIGENRE_INSTRUMENTS) {
      expect(isValidInstrument(i)).toBe(true);
      expect(isFoundationalInstrument(i)).toBe(false);
      expect(isMultiGenreInstrument(i)).toBe(true);
    }
  });

  test('multigenre list matches computed overlap threshold (>=3) minus foundational', () => {
    const computed = computeMultiGenreInstruments(3);
    expect(computed).toEqual(MULTIGENRE_INSTRUMENTS);
  });

  test('multigenre instruments appear in >=3 genres', () => {
    const { genresByInstrument } = buildInstrumentToGenresIndex();
    for (const i of MULTIGENRE_INSTRUMENTS) {
      const key = i.toLowerCase();
      const genres = genresByInstrument.get(key);
      expect(genres).toBeDefined();
      expect(genres!.size).toBeGreaterThanOrEqual(3);
    }
  });
});
