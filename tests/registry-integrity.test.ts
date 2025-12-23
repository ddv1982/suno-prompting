import { describe, expect, test } from 'bun:test';
import { GENRE_REGISTRY } from '@bun/instruments/genres';
import { INSTRUMENT_REGISTRY, toCanonical } from '@bun/instruments/registry';

describe('Instrument registry integrity', () => {
  test('canonical instrument names are unique (case-insensitive)', () => {
    const seen = new Set<string>();

    for (const entry of INSTRUMENT_REGISTRY) {
      const key = entry.canonical.toLowerCase();
      expect(seen.has(key)).toBe(false);
      seen.add(key);
    }
  });

  test('each alias maps to exactly one canonical instrument (case-insensitive)', () => {
    const aliasToCanonical = new Map<string, string>();

    for (const entry of INSTRUMENT_REGISTRY) {
      const canonical = entry.canonical;
      const tokens = [entry.canonical, ...entry.aliases];

      for (const token of tokens) {
        const key = token.toLowerCase();
        const existing = aliasToCanonical.get(key);
        if (existing !== undefined) {
          expect(existing).toBe(canonical);
        } else {
          aliasToCanonical.set(key, canonical);
        }
      }
    }
  });
});

describe('Genre pool integrity', () => {
  test('no genre pool contains duplicates after canonical normalization', () => {
    for (const genre of Object.values(GENRE_REGISTRY)) {
      for (const pool of Object.values(genre.pools)) {
        const canonicals = pool.instruments.map(i => toCanonical(i));

        // Existing tests cover validity, but keep this assert here to make failures clearer.
        expect(canonicals.every(Boolean)).toBe(true);

        const normalized = canonicals as string[];
        const unique = new Set(normalized);
        expect(unique.size).toBe(normalized.length);
      }
    }
  });
});
