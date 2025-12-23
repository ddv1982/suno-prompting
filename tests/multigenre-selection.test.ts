import { describe, expect, test } from 'bun:test';
import { selectInstrumentsForGenre } from '@bun/instruments/services/select';
import { createRng } from '@bun/instruments/services/random';
import {
  isFoundationalInstrument,
  isMultiGenreInstrument,
} from '@bun/instruments/datasets/instrumentClasses';

describe('Multi-genre + foundational selection', () => {
  test('injects 1-2 multigenre instruments by default (when slots allow)', () => {
    const rng = createRng(123);
    const selected = selectInstrumentsForGenre('rock', { maxTags: 8, rng });

    const multi = selected.filter(isMultiGenreInstrument);
    expect(multi.length).toBeGreaterThanOrEqual(1);
    expect(multi.length).toBeLessThanOrEqual(2);
  });

  test('injects at most 1 foundational instrument, and only if none already present', () => {
    const rng = createRng(456);
    const selected = selectInstrumentsForGenre('jazz', { maxTags: 8, rng });

    const foundational = selected.filter(isFoundationalInstrument);
    expect(foundational.length).toBeLessThanOrEqual(1);
  });

  test('can disable multigenre and foundational injection', () => {
    const rng = createRng(789);
    const selected = selectInstrumentsForGenre('rock', {
      maxTags: 8,
      rng,
      multiGenre: { enabled: false, count: { min: 1, max: 2 } },
      foundational: { enabled: false, count: { min: 0, max: 1 } },
    });

    expect(selected.some(isMultiGenreInstrument)).toBe(false);
    expect(selected.some(isFoundationalInstrument)).toBe(false);
  });
});
