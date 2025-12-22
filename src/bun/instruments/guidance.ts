import {
  HARMONIC_STYLES,
  RHYTHMIC_STYLES,
  AMBIENT_INSTRUMENT_POOLS,
  AMBIENT_EXCLUSION_RULES,
  AMBIENT_POOL_ORDER,
  AMBIENT_MAX_TAGS,
  AMBIENT_GUIDANCE_DESCRIPTION,
  AMBIENT_INSTRUMENTS_HEADER,
} from '@bun/instruments/data';
import type { HarmonicStyle, RhythmicStyle, AmbientPoolName, SunoInstrumentToken } from '@bun/instruments/data';

export type InstrumentSelectionOptions = {
  readonly userInstruments?: readonly string[];
  readonly maxTags?: number;
};

const POOL_ORDER: readonly AmbientPoolName[] = AMBIENT_POOL_ORDER;

const EXCLUSION_RULES_LC = AMBIENT_EXCLUSION_RULES.map(([a, b]) => [a.toLowerCase(), b.toLowerCase()] as const);

function shuffle<T>(arr: readonly T[]): T[] {
  const result = [...arr];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j]!, result[i]!];
  }
  return result;
}

function pickRandom<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]!;
}

function randomIntInclusive(min: number, max: number): number {
  return min + Math.floor(Math.random() * (max - min + 1));
}

function rollChance(chance: number | undefined): boolean {
  if (chance === undefined) return true;
  return Math.random() <= chance;
}

function hasExclusion(selected: readonly string[], candidate: string): boolean {
  const candidateLower = candidate.toLowerCase();
  for (const existing of selected) {
    const existingLower = existing.toLowerCase();
    for (const [aLower, bLower] of EXCLUSION_RULES_LC) {
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

type AmbientPool = {
  readonly pick: { readonly min: number; readonly max: number };
  readonly instruments: readonly SunoInstrumentToken[];
  readonly chanceToInclude?: number;
};

const POOLS: Record<AmbientPoolName, AmbientPool> = AMBIENT_INSTRUMENT_POOLS;

export function getHarmonicGuidance(style: HarmonicStyle): string {
  const s = HARMONIC_STYLES[style];
  const chars = shuffle(s.characteristics).slice(0, 3);
  const prog = pickRandom(s.progressions);

  return [
    `HARMONIC STYLE (${s.name}):`,
    s.description,
    `Chord: ${s.chordType}`,
    `Formula: ${s.formula}`,
    ...chars.map(c => `- ${c}`),
    `Suggested Progression: ${prog}`,
    `Examples: ${s.keyExamples}`,
  ].join('\n');
}

export function getRhythmicGuidance(style: RhythmicStyle): string {
  const s = RHYTHMIC_STYLES[style];
  const chars = shuffle(s.characteristics).slice(0, 3);

  return [
    `RHYTHMIC STYLE (${s.name}):`,
    s.description,
    `Common ratios: ${s.commonRatios}`,
    `Suggested elements: ${s.instruments}`,
    ...chars.map(c => `- ${c}`),
  ].join('\n');
}

function computePickCount(pick: AmbientPool['pick'], remainingSlots: number): number {
  if (remainingSlots <= 0) return 0;
  const desired = randomIntInclusive(pick.min, pick.max);
  return Math.min(desired, remainingSlots);
}

function pickUniqueTokens(
  candidates: readonly SunoInstrumentToken[],
  selected: readonly SunoInstrumentToken[],
  count: number
): SunoInstrumentToken[] {
  if (count <= 0) return [];

  const picks: SunoInstrumentToken[] = [];
  const seen = new Set<SunoInstrumentToken>(selected);

  for (const token of candidates) {
    if (picks.length >= count) break;
    if (seen.has(token)) continue;
    if (hasExclusion([...selected, ...picks], token)) continue;
    picks.push(token);
    seen.add(token);
  }

  return picks;
}

function pickFromPool(
  pool: AmbientPool,
  selected: readonly SunoInstrumentToken[],
  remainingSlots: number
): SunoInstrumentToken[] {
  if (!rollChance(pool.chanceToInclude)) return [];

  const count = computePickCount(pool.pick, remainingSlots);
  if (count <= 0) return [];

  const available = pool.instruments.filter(token => !hasExclusion(selected, token));
  const shuffled = shuffle(available);
  const picks = pickUniqueTokens(shuffled, selected, count);

  return picks;
}

export function getAmbientInstruments(options?: InstrumentSelectionOptions): string {
  const maxTags = options?.maxTags ?? AMBIENT_MAX_TAGS;
  const userInstruments = options?.userInstruments ?? [];
  
  // Start with user-provided instruments (up to maxTags)
  const userSelected = userInstruments.slice(0, maxTags) as SunoInstrumentToken[];
  let selected: SunoInstrumentToken[] = [...userSelected];

  // Fill remaining slots from pools
  for (const poolName of POOL_ORDER) {
    if (selected.length >= maxTags) break;
    const pool = POOLS[poolName];
    const picks = pickFromPool(pool, selected, maxTags - selected.length);
    selected = [...selected, ...picks].slice(0, maxTags);
  }

  // Build output with clear distinction between user and suggested
  const lines: string[] = [AMBIENT_INSTRUMENTS_HEADER, AMBIENT_GUIDANCE_DESCRIPTION, ''];
  
  if (userSelected.length > 0) {
    lines.push('User specified (MUST use):');
    lines.push(...userSelected.map(t => `- ${t}`));
  }
  
  const suggested = selected.filter(t => !userSelected.includes(t));
  if (suggested.length > 0) {
    if (userSelected.length > 0) {
      lines.push('');
      lines.push('Suggested additions:');
    }
    lines.push(...suggested.map(t => `- ${t}`));
  }

  return lines.join('\n');
}
