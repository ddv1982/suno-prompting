import {
  FOUNDATIONAL_INSTRUMENTS,
  MULTIGENRE_INSTRUMENTS,
  ORCHESTRAL_COLOR_INSTRUMENTS,
  isFoundationalInstrument,
  isMultiGenreInstrument,
  isOrchestralColorInstrument,
} from '@bun/instruments/datasets/instrument-classes';
import { GENRE_REGISTRY } from '@bun/instruments/genres';
import { shuffle, randomIntInclusive, rollChance } from '@bun/instruments/services/random';

import type { GenreType, InstrumentPool } from '@bun/instruments/genres';
import type { Rng } from '@bun/instruments/services/random';


export interface InstrumentSelectionOptions {
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
}

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

interface QuotaConfig {
  readonly enabled: boolean;
  readonly count: { readonly min: number; readonly max: number };
}

interface QuotaTargets {
  readonly multi: number;
  readonly foundational: number;
  readonly orchestral: number;
}

function isOrchestralGenre(genre: GenreType): boolean {
  return genre === 'cinematic' || genre === 'classical' || genre === 'videogame';
}

function selectFromPools(
  poolOrder: readonly string[],
  pools: Record<string, InstrumentPool>,
  selected: readonly string[],
  maxTags: number,
  exclusionRules: readonly [string, string][],
  allowOrchestralFromPools: boolean,
  rng: Rng
): string[] {
  let result = [...selected];
  for (const poolName of poolOrder) {
    if (result.length >= maxTags) break;
    const pool = pools[poolName];
    if (!pool) continue;

    const candidatesOverride = allowOrchestralFromPools
      ? undefined
      : pool.instruments.filter(i => !isOrchestralColorInstrument(i));

    const picks = pickFromPool(
      pool,
      result,
      maxTags - result.length,
      exclusionRules,
      rng,
      candidatesOverride
    );
    result = [...result, ...picks].slice(0, maxTags);
  }
  return result;
}

function calculateQuotaTargets(
  genre: GenreType,
  multiGenre: QuotaConfig,
  foundational: QuotaConfig,
  orchestralColor: QuotaConfig,
  userWantsOrchestral: boolean,
  rng: Rng
): QuotaTargets {
  const multiTarget = multiGenre.enabled
    ? randomIntInclusive(multiGenre.count.min, multiGenre.count.max, rng)
    : 0;
  
  const foundationalTarget = foundational.enabled
    ? randomIntInclusive(foundational.count.min, foundational.count.max, rng)
    : 0;

  let orchestralTarget = 0;
  if (orchestralColor.enabled) {
    if (isOrchestralGenre(genre) || userWantsOrchestral) {
      orchestralTarget = randomIntInclusive(
        orchestralColor.count.min,
        orchestralColor.count.max,
        rng
      );
    } else if (genre === 'ambient') {
      orchestralTarget = rollChance(0.15, rng) ? 1 : 0;
    }
  }

  return { multi: multiTarget, foundational: foundationalTarget, orchestral: orchestralTarget };
}

function fillMissingQuotas(
  selected: readonly string[],
  targets: QuotaTargets,
  maxTags: number,
  exclusionRules: readonly [string, string][],
  rng: Rng
): string[] {
  let result = [...selected];
  
  const existingMulti = result.filter(isMultiGenreInstrument).length;
  const existingFoundational = result.filter(isFoundationalInstrument).length;
  const existingOrchestral = result.filter(isOrchestralColorInstrument).length;

  const missingMulti = Math.max(0, targets.multi - existingMulti);
  const missingFoundational = Math.max(0, targets.foundational - existingFoundational);
  const missingOrchestral = Math.max(0, targets.orchestral - existingOrchestral);

  if (result.length < maxTags && missingMulti > 0) {
    const picks = pickFromList(
      MULTIGENRE_INSTRUMENTS, result, maxTags - result.length,
      { min: missingMulti, max: missingMulti }, exclusionRules, rng
    );
    result = [...result, ...picks].slice(0, maxTags);
  }

  if (result.length < maxTags && missingFoundational > 0) {
    const picks = pickFromList(
      FOUNDATIONAL_INSTRUMENTS, result, maxTags - result.length,
      { min: missingFoundational, max: missingFoundational }, exclusionRules, rng
    );
    result = [...result, ...picks].slice(0, maxTags);
  }

  if (result.length < maxTags && missingOrchestral > 0) {
    const picks = pickFromList(
      ORCHESTRAL_COLOR_INSTRUMENTS, result, maxTags - result.length,
      { min: missingOrchestral, max: missingOrchestral }, exclusionRules, rng
    );
    result = [...result, ...picks].slice(0, maxTags);
  }

  return result;
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
  const userWantsOrchestral = userSelected.some(isOrchestralColorInstrument);
  const allowOrchestralFromPools = isOrchestralGenre(genre) || userWantsOrchestral;

  const poolSelected = selectFromPools(
    def.poolOrder, def.pools, userSelected, maxTags, exclusionRules, allowOrchestralFromPools, rng
  );

  const targets = calculateQuotaTargets(
    genre, multiGenre, foundational, orchestralColor, userWantsOrchestral, rng
  );

  return fillMissingQuotas(poolSelected, targets, maxTags, exclusionRules, rng);
}
