import { describe, expect, test } from 'bun:test';

import {
  FOUNDATIONAL_INSTRUMENTS,
  MULTIGENRE_INSTRUMENTS,
  ORCHESTRAL_COLOR_INSTRUMENTS,
  MULTIGENRE_FORCE_INCLUDE,
  MULTIGENRE_FORCE_EXCLUDE,
  buildInstrumentToGenresIndex,
  isFoundationalInstrument,
  isMultiGenreInstrument,
  isOrchestralColorInstrument,
  computeMultiGenreInstruments,
} from '@bun/instruments/datasets/instrument-classes';
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
      expect(isOrchestralColorInstrument(i)).toBe(false);
      expect(isMultiGenreInstrument(i)).toBe(true);
    }
  });

  test('orchestral color instruments exist in registry and exclude foundational/multigenre', () => {
    for (const i of ORCHESTRAL_COLOR_INSTRUMENTS) {
      expect(isValidInstrument(i)).toBe(true);
      expect(isFoundationalInstrument(i)).toBe(false);
      expect(isMultiGenreInstrument(i)).toBe(false);
      expect(isOrchestralColorInstrument(i)).toBe(true);
    }
  });

  test('multigenre list matches curated computation', () => {
    const computed = computeMultiGenreInstruments(3);
    expect(computed).toEqual(MULTIGENRE_INSTRUMENTS);
  });

  test('multigenre instruments appear in >=3 genres (or are force-included)', () => {
    const { genresByInstrument } = buildInstrumentToGenresIndex();
    const force = new Set(MULTIGENRE_FORCE_INCLUDE.map((i) => i.toLowerCase()));
    for (const i of MULTIGENRE_INSTRUMENTS) {
      const key = i.toLowerCase();
      const genres = genresByInstrument.get(key);
      expect(genres).toBeDefined();
      if (!force.has(key)) {
        expect(genres!.size).toBeGreaterThanOrEqual(3);
      }
    }
  });

  test('force exclude items never appear in multigenre', () => {
    for (const i of MULTIGENRE_FORCE_EXCLUDE) {
      expect(MULTIGENRE_INSTRUMENTS.map((x) => x.toLowerCase())).not.toContain(i.toLowerCase());
    }
  });
});
