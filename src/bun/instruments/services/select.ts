import { GENRE_REGISTRY } from '@bun/instruments/genres';
import type { GenreType, InstrumentPool } from '@bun/instruments/genres';
import {
  FOUNDATIONAL_INSTRUMENTS,
  MULTIGENRE_INSTRUMENTS,
  ORCHESTRAL_COLOR_INSTRUMENTS,
  isFoundationalInstrument,
  isMultiGenreInstrument,
  isOrchestralColorInstrument,
} from '@bun/instruments/datasets/instrumentClasses';
import type { Rng } from '@bun/instruments/services/random';
import { shuffle, randomIntInclusive, rollChance } from '@bun/instruments/services/random';

export type InstrumentSelectionOptions = {
  readonly userInstruments?: readonly string[];
  readonly maxTags?: number;
  readonly multiGenre?: {
    readonly enabled: boolean;
    readonly count: { readonly min: number; readonly max: number };
  };
  readonly foundational?: {
    readonly enabled: boolean;
    readonly count: { readonly min: number; readonly max: number };
  };
  readonly orchestralColor?: {
    readonly enabled: boolean;
    readonly count: { readonly min: number; readonly max: number };
  };
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
  rng: Rng,
  candidatesOverride?: readonly string[]
): string[] {
  if (!rollChance(pool.chanceToInclude, rng)) return [];

  const count = computePickCount(pool.pick, remainingSlots, rng);
  if (count <= 0) return [];

  const source = candidatesOverride ?? pool.instruments;
  const available = source.filter(token => !hasExclusion(selected, token, exclusionRules));
  const shuffled = shuffle(available, rng);
  return pickUniqueTokens(shuffled, selected, count, exclusionRules);
}

function pickFromList(
  candidates: readonly string[],
  selected: readonly string[],
  remainingSlots: number,
  desired: { readonly min: number; readonly max: number },
  exclusionRules: readonly [string, string][],
  rng: Rng
): string[] {
  if (remainingSlots <= 0) return [];
  const count = computePickCount(desired, remainingSlots, rng);
  if (count <= 0) return [];
  const available = candidates.filter(token => !hasExclusion(selected, token, exclusionRules));
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

  const multiGenre = options?.multiGenre ?? { enabled: true, count: { min: 1, max: 2 } };
  const foundational = options?.foundational ?? { enabled: true, count: { min: 0, max: 1 } };
  const orchestralColor = options?.orchestralColor ?? { enabled: true, count: { min: 0, max: 1 } };

  const userSelected = userInstruments.slice(0, maxTags);
  let selected: string[] = [...userSelected];

  const hasFoundationalAlready = () => selected.some(isFoundationalInstrument);
  const userWantsOrchestralColor = userSelected.some(isOrchestralColorInstrument);
  const isOrchestralGenre = genre === 'cinematic' || genre === 'classical' || genre === 'videogame';

  // We keep orchestral color rare outside orchestral genres.
  // Ambient is treated as non-orchestral for pool selection (so it stays rare there too).
  const allowOrchestralFromPools = isOrchestralGenre || userWantsOrchestralColor;

  for (const poolName of def.poolOrder) {
    if (selected.length >= maxTags) break;
    const pool = def.pools[poolName];
    if (!pool) continue;

    // Prefer genre-defining picks here: avoid foundational + multi-genre (and optionally orchestral color)
    // so we can inject those layers deterministically.
    const candidatesOverride = pool.instruments.filter(i => {
      if (isFoundationalInstrument(i)) return false;
      if (isMultiGenreInstrument(i)) return false;
      if (!allowOrchestralFromPools && isOrchestralColorInstrument(i)) return false;
      return true;
    });

    const picks = pickFromPool(
      pool,
      selected,
      maxTags - selected.length,
      exclusionRules,
      rng,
      candidatesOverride
    );
    selected = [...selected, ...picks].slice(0, maxTags);
  }

  if (selected.length < maxTags && multiGenre.enabled) {
    const picks = pickFromList(
      MULTIGENRE_INSTRUMENTS,
      selected,
      maxTags - selected.length,
      multiGenre.count,
      exclusionRules,
      rng
    );
    selected = [...selected, ...picks].slice(0, maxTags);
  }

  if (selected.length < maxTags && foundational.enabled) {
    // Foundational is an anchor; prefer injecting only when not already present.
    if (!hasFoundationalAlready()) {
      const picks = pickFromList(
        FOUNDATIONAL_INSTRUMENTS,
        selected,
        maxTags - selected.length,
        foundational.count,
        exclusionRules,
        rng
      );
      selected = [...selected, ...picks].slice(0, maxTags);
    }
  }

  if (selected.length < maxTags && orchestralColor.enabled) {
    const canInject =
      isOrchestralGenre ||
      genre === 'ambient' ||
      userWantsOrchestralColor;

    if (canInject) {
      const picks = pickFromList(
        ORCHESTRAL_COLOR_INSTRUMENTS,
        selected,
        maxTags - selected.length,
        orchestralColor.count,
        exclusionRules,
        rng
      );
      selected = [...selected, ...picks].slice(0, maxTags);
    }
  }

  return selected;
}
