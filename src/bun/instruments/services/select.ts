import { GENRE_REGISTRY } from '@bun/instruments/genres';
import type { GenreType, InstrumentPool } from '@bun/instruments/genres';
import type { Rng } from '@bun/instruments/services/random';
import { shuffle, randomIntInclusive, rollChance } from '@bun/instruments/services/random';

export type InstrumentSelectionOptions = {
  readonly userInstruments?: readonly string[];
  readonly maxTags?: number;
  readonly rng?: Rng;
};

function hasExclusion(
  selected: readonly string[],
  candidate: string,
  exclusionRules: readonly [string, string][]
): boolean {
  if (!exclusionRules.length) return false;
  const candidateLower = candidate.toLowerCase();
  for (const existing of selected) {
    const existingLower = existing.toLowerCase();
    for (const [a, b] of exclusionRules) {
      const aLower = a.toLowerCase();
      const bLower = b.toLowerCase();
      if (
        (existingLower.includes(aLower) && candidateLower.includes(bLower)) ||
        (existingLower.includes(bLower) && candidateLower.includes(aLower))
      ) {
        return true;
      }
    }
  }
  return false;
}

function computePickCount(pick: InstrumentPool['pick'], remainingSlots: number, rng: Rng): number {
  if (remainingSlots <= 0) return 0;
  const desired = randomIntInclusive(pick.min, pick.max, rng);
  return Math.min(desired, remainingSlots);
}

function pickUniqueTokens(
  candidates: readonly string[],
  selected: readonly string[],
  count: number,
  exclusionRules: readonly [string, string][]
): string[] {
  if (count <= 0) return [];

  const picks: string[] = [];
  const seen = new Set<string>(selected);

  for (const token of candidates) {
    if (picks.length >= count) break;
    if (seen.has(token)) continue;
    if (hasExclusion([...selected, ...picks], token, exclusionRules)) continue;
    picks.push(token);
    seen.add(token);
  }

  return picks;
}

function pickFromPool(
  pool: InstrumentPool,
  selected: readonly string[],
  remainingSlots: number,
  exclusionRules: readonly [string, string][],
  rng: Rng
): string[] {
  if (!rollChance(pool.chanceToInclude, rng)) return [];

  const count = computePickCount(pool.pick, remainingSlots, rng);
  if (count <= 0) return [];

  const available = pool.instruments.filter(token => !hasExclusion(selected, token, exclusionRules));
  const shuffled = shuffle(available, rng);
  return pickUniqueTokens(shuffled, selected, count, exclusionRules);
}

export function selectInstrumentsForGenre(
  genre: GenreType,
  options?: InstrumentSelectionOptions
): string[] {
  const def = GENRE_REGISTRY[genre];
  const maxTags = options?.maxTags ?? def.maxTags;
  const rng = options?.rng ?? Math.random;
  const userInstruments = options?.userInstruments ?? [];
  const exclusionRules = def.exclusionRules ?? [];

  const userSelected = userInstruments.slice(0, maxTags);
  let selected: string[] = [...userSelected];

  for (const poolName of def.poolOrder) {
    if (selected.length >= maxTags) break;
    const pool = def.pools[poolName];
    if (!pool) continue;
    const picks = pickFromPool(pool, selected, maxTags - selected.length, exclusionRules, rng);
    selected = [...selected, ...picks].slice(0, maxTags);
  }

  return selected;
}
