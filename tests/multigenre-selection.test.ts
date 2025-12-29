import { describe, expect, test } from 'bun:test';
import { selectInstrumentsForGenre } from '@bun/instruments/services/select';
import { createRng } from '@bun/instruments/services/random';
import {
  isFoundationalInstrument,
  isMultiGenreInstrument,
  isOrchestralColorInstrument,
} from '@bun/instruments/datasets/instrument-classes';

describe('Multi-genre + foundational selection', () => {
  test('injects 1-2 multigenre instruments when none are present in pools (when slots allow)', () => {
    const rng = createRng(123);
    const selected = selectInstrumentsForGenre('classical', { maxTags: 10, rng });

    const multi = selected.filter(isMultiGenreInstrument);
    expect(multi.length).toBeGreaterThanOrEqual(1);
    expect(multi.length).toBeLessThanOrEqual(2);
  });

  test('does not collapse Jazz harmonic picks to only felt piano', () => {
    const candidates = new Set(['Rhodes', 'Hammond organ', 'Wurlitzer', 'acoustic guitar']);

    const picks = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10].flatMap(seed =>
      selectInstrumentsForGenre('jazz', {
        maxTags: 8,
        rng: createRng(seed),
        multiGenre: { enabled: false, count: { min: 1, max: 2 } },
        foundational: { enabled: false, count: { min: 0, max: 1 } },
        orchestralColor: { enabled: false, count: { min: 0, max: 1 } },
      })
    );

    expect(picks.some(p => candidates.has(p))).toBe(true);
  });

  test('can disable multigenre injection', () => {
    const rng = createRng(789);
    const selected = selectInstrumentsForGenre('classical', {
      maxTags: 10,
      rng,
      multiGenre: { enabled: false, count: { min: 1, max: 2 } },
      foundational: { enabled: false, count: { min: 0, max: 1 } },
      orchestralColor: { enabled: false, count: { min: 0, max: 1 } },
    });

    expect(selected.some(isMultiGenreInstrument)).toBe(false);
  });

  test('can disable foundational injection (pools may still contribute foundational instruments)', () => {
    const rng = createRng(456);

    const without = selectInstrumentsForGenre('jazz', {
      maxTags: 8,
      rng,
      foundational: { enabled: false, count: { min: 1, max: 1 } },
    });

    const withInjection = selectInstrumentsForGenre('jazz', {
      maxTags: 8,
      rng: createRng(456),
      foundational: { enabled: true, count: { min: 1, max: 1 } },
    });

    expect(without.filter(isFoundationalInstrument).length).toBeLessThanOrEqual(
      withInjection.filter(isFoundationalInstrument).length
    );
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
