import { describe, expect, test } from 'bun:test';
import { selectInstrumentsForGenre } from '@bun/instruments/services/select';
import { createRng } from '@bun/instruments/services/random';
import {
  isFoundationalInstrument,
  isMultiGenreInstrument,
  isOrchestralColorInstrument,
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
      orchestralColor: { enabled: false, count: { min: 0, max: 1 } },
    });

    expect(selected.some(isMultiGenreInstrument)).toBe(false);
    expect(selected.some(isFoundationalInstrument)).toBe(false);
    expect(selected.some(isOrchestralColorInstrument)).toBe(false);
  });

  test('injects orchestral color for cinematic/classical/videogame when enabled', () => {
    const rng = createRng(222);
    const selected = selectInstrumentsForGenre('cinematic', { maxTags: 10, rng });

    // Might already include orchestral instruments from pools; but it should be possible to have at least one.
    expect(selected.some(isOrchestralColorInstrument)).toBe(true);
  });

  test('does not inject orchestral color for non-orchestral genres unless user asks', () => {
    const rng = createRng(333);
    const selected = selectInstrumentsForGenre('rock', { maxTags: 10, rng });
    expect(selected.some(isOrchestralColorInstrument)).toBe(false);

    const selectedWithUser = selectInstrumentsForGenre('rock', {
      maxTags: 10,
      rng: createRng(333),
      userInstruments: ['violin'],
    });
    expect(selectedWithUser.some(isOrchestralColorInstrument)).toBe(true);
  });
});
