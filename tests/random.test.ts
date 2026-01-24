import { describe, expect, test } from 'bun:test';

import {
  createSeededRng,
  pickRandom,
  shuffle,
  rollChance,
  randomIntInclusive,
} from '@shared/utils/random';

describe('RNG (seeded) utilities', () => {
  test('createSeededRng(seed) is deterministic for a fixed seed', () => {
    const rngA = createSeededRng(123);
    const rngB = createSeededRng(123);

    const a = Array.from({ length: 10 }, () => rngA());
    const b = Array.from({ length: 10 }, () => rngB());

    expect(a).toEqual(b);
    expect(a.some(v => v !== 0)).toBe(true);
  });

  test('pickRandom is deterministic under a seeded rng', () => {
    const items = ['a', 'b', 'c', 'd', 'e'] as const;
    const rngA = createSeededRng(42);
    const rngB = createSeededRng(42);

    const picksA = Array.from({ length: 20 }, () => pickRandom(items, rngA));
    const picksB = Array.from({ length: 20 }, () => pickRandom(items, rngB));

    expect(picksA).toEqual(picksB);
  });

  test('shuffle is deterministic under a seeded rng', () => {
    const items = [1, 2, 3, 4, 5, 6, 7, 8, 9];
    const rngA = createSeededRng(7);
    const rngB = createSeededRng(7);

    expect(shuffle(items, rngA)).toEqual(shuffle(items, rngB));
  });

  test('rollChance is deterministic under a seeded rng', () => {
    const rngA = createSeededRng(999);
    const rngB = createSeededRng(999);

    const a = Array.from({ length: 30 }, () => rollChance(0.5, rngA));
    const b = Array.from({ length: 30 }, () => rollChance(0.5, rngB));

    expect(a).toEqual(b);
  });

  test('randomIntInclusive is deterministic under a seeded rng', () => {
    const rngA = createSeededRng(31415);
    const rngB = createSeededRng(31415);

    const a = Array.from({ length: 25 }, () => randomIntInclusive(1, 6, rngA));
    const b = Array.from({ length: 25 }, () => randomIntInclusive(1, 6, rngB));

    expect(a).toEqual(b);
    expect(a.every(v => v >= 1 && v <= 6)).toBe(true);
  });
});
