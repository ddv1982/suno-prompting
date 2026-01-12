import { describe, test, expect } from 'bun:test';

import { InvariantError } from '@shared/errors';
import { selectRandom, selectRandomN, createSeededRng } from '@shared/utils/random';

describe('selectRandom', () => {
  test('selects an item from the array', () => {
    const items = ['a', 'b', 'c'];
    const selected = selectRandom(items);
    expect(items).toContain(selected);
  });

  test('throws InvariantError for empty array', () => {
    expect(() => selectRandom([])).toThrow(InvariantError);
    expect(() => selectRandom([])).toThrow('selectRandom called with empty array');
  });

  test('returns single item from single-element array', () => {
    expect(selectRandom(['only'])).toBe('only');
  });

  test('works with seeded RNG for deterministic selection', () => {
    const items = ['a', 'b', 'c', 'd', 'e'];
    const rng1 = createSeededRng(42);
    const rng2 = createSeededRng(42);

    const result1 = selectRandom(items, rng1);
    const result2 = selectRandom(items, rng2);

    expect(result1).toBe(result2);
  });

  test('works with number arrays', () => {
    const items = [1, 2, 3, 4, 5];
    const selected = selectRandom(items);
    expect(items).toContain(selected);
  });

  test('works with object arrays', () => {
    const items = [{ id: 1 }, { id: 2 }, { id: 3 }];
    const selected = selectRandom(items);
    expect(items).toContain(selected);
  });
});

describe('selectRandomN', () => {
  test('selects N unique items from array', () => {
    const items = ['a', 'b', 'c', 'd', 'e'];
    const selected = selectRandomN(items, 3);
    
    expect(selected).toHaveLength(3);
    // All selected items should be from original array
    selected.forEach(item => {
      expect(items).toContain(item);
    });
    // All selected items should be unique
    const unique = new Set(selected);
    expect(unique.size).toBe(3);
  });

  test('throws InvariantError when count exceeds array length', () => {
    const items = ['a', 'b'];
    expect(() => selectRandomN(items, 5)).toThrow(InvariantError);
    expect(() => selectRandomN(items, 5)).toThrow('selectRandomN: requested 5 items but array only has 2');
  });

  test('returns empty array for count 0', () => {
    const items = ['a', 'b', 'c'];
    expect(selectRandomN(items, 0)).toEqual([]);
  });

  test('returns empty array for negative count', () => {
    const items = ['a', 'b', 'c'];
    expect(selectRandomN(items, -1)).toEqual([]);
  });

  test('returns all items when count equals array length', () => {
    const items = ['a', 'b', 'c'];
    const selected = selectRandomN(items, 3);
    expect(selected).toHaveLength(3);
    expect(new Set(selected)).toEqual(new Set(items));
  });

  test('works with seeded RNG for deterministic selection', () => {
    const items = ['a', 'b', 'c', 'd', 'e'];
    const rng1 = createSeededRng(42);
    const rng2 = createSeededRng(42);

    const result1 = selectRandomN(items, 3, rng1);
    const result2 = selectRandomN(items, 3, rng2);

    expect(result1).toEqual(result2);
  });
});

describe('createSeededRng', () => {
  test('produces consistent sequence for same seed', () => {
    const rng1 = createSeededRng(12345);
    const rng2 = createSeededRng(12345);

    const sequence1 = [rng1(), rng1(), rng1(), rng1(), rng1()];
    const sequence2 = [rng2(), rng2(), rng2(), rng2(), rng2()];

    expect(sequence1).toEqual(sequence2);
  });

  test('produces different sequences for different seeds', () => {
    const rng1 = createSeededRng(12345);
    const rng2 = createSeededRng(54321);

    const sequence1 = [rng1(), rng1(), rng1()];
    const sequence2 = [rng2(), rng2(), rng2()];

    expect(sequence1).not.toEqual(sequence2);
  });

  test('produces values between 0 and 1', () => {
    const rng = createSeededRng(42);
    
    for (let i = 0; i < 100; i++) {
      const value = rng();
      expect(value).toBeGreaterThanOrEqual(0);
      expect(value).toBeLessThan(1);
    }
  });
});
