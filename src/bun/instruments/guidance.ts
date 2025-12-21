import { HARMONIC_STYLES, RHYTHMIC_STYLES, AMBIENT_INSTRUMENT_POOLS, AMBIENT_EXCLUSION_RULES } from './data';
import type { HarmonicStyle, RhythmicStyle, Rarity, AmbientPoolName, InstrumentTag } from './data';

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

function hasExclusion(selected: string[], candidate: string): boolean {
  const candidateLower = candidate.toLowerCase();
  for (const existing of selected) {
    const existingLower = existing.toLowerCase();
    for (const [a, b] of AMBIENT_EXCLUSION_RULES) {
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

type PoolInstrument = { readonly name: string; readonly rarity: Rarity; readonly tags?: readonly InstrumentTag[] };

type SelectedInstrument = PoolInstrument & { readonly pool: AmbientPoolName };

function weightedShuffle(instruments: readonly PoolInstrument[]): PoolInstrument[] {
  const weighted: PoolInstrument[] = [];
  for (const inst of instruments) {
    // Common instruments get 4x weight, rare get 1x
    const copies = inst.rarity === 'common' ? 4 : 1;
    for (let i = 0; i < copies; i++) {
      weighted.push(inst);
    }
  }
  return shuffle(weighted);
}

function hasTag(selected: readonly SelectedInstrument[], tag: InstrumentTag): boolean {
  return selected.some(i => i.tags?.includes(tag));
}

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

function selectFromPool(
  poolName: AmbientPoolName,
  pool: { readonly pick: { readonly min: number; readonly max: number }; readonly chanceToInclude?: number; readonly instruments: readonly PoolInstrument[] },
  selected: readonly SelectedInstrument[]
): SelectedInstrument[] {
  // Check probability gate for optional pools (like rare)
  if (pool.chanceToInclude !== undefined && Math.random() > pool.chanceToInclude) {
    return [];
  }

  // Determine how many to pick
  const range = pool.pick.max - pool.pick.min + 1;
  const count = pool.pick.min + Math.floor(Math.random() * range);
  if (count === 0) return [];

  // Filter out excluded instruments
  const selectedNames = selected.map(s => s.name);
  const available = pool.instruments.filter(inst => !hasExclusion(selectedNames, inst.name));
  if (available.length === 0) return [];

  // Weighted shuffle and pick unique instruments
  const shuffled = weightedShuffle(available);
  const picks: SelectedInstrument[] = [];
  const seen = new Set<string>();

  for (const inst of shuffled) {
    if (picks.length >= count) break;
    if (!seen.has(inst.name) && !hasExclusion([...selectedNames, ...picks.map(p => p.name)], inst.name)) {
      picks.push({ ...inst, pool: poolName });
      seen.add(inst.name);
    }
  }

  return picks;
}

function enforceContrast(selected: SelectedInstrument[]): SelectedInstrument[] {
  // Goal: always include at least one organic and one electronic element.
  const required: InstrumentTag[] = ['organic', 'electronic'];

  // Core/pads should remain present; replacing *within* those pools is fine, but replacing them
  // with an instrument from a different pool is not.
  const protectedPools = new Set<AmbientPoolName>(['coreHarmonic', 'padsAtmosphere']);

  const poolFixPriority: AmbientPoolName[] = [
    'colorOvertones',
    'expressiveVoices',
    'subtleRhythm',
    'contrastWildcard',
    'textureTime',
    'rare',
    'coreHarmonic',
    'padsAtmosphere',
  ];

  for (const tag of required) {
    if (hasTag(selected, tag)) continue;

    let fixed = false;
    for (const poolName of poolFixPriority) {
      const idx = selected.findIndex(s => s.pool === poolName);
      if (idx === -1) continue;

      const pool = AMBIENT_INSTRUMENT_POOLS[poolName];
      const instruments = pool.instruments as readonly PoolInstrument[];
      const candidates = shuffle(instruments).filter(i => i.tags?.includes(tag));
      if (candidates.length === 0) continue;

      for (const cand of candidates) {
        if (selected.some(s => s.name === cand.name)) continue;

        const remaining = [...selected.slice(0, idx), ...selected.slice(idx + 1)];
        const remainingNames = remaining.map(s => s.name);
        if (hasExclusion(remainingNames, cand.name)) continue;

        const existing = selected[idx]!;
        if (protectedPools.has(existing.pool) && existing.pool !== poolName) continue;

        selected[idx] = { ...cand, pool: poolName };
        fixed = true;
        break;
      }

      if (fixed) break;
    }
  }

  return selected;
}

export function getGenreInstruments(): string {
  let selected: SelectedInstrument[] = [];
  const pools = AMBIENT_INSTRUMENT_POOLS;

  const poolOrder: (keyof typeof pools)[] = [
    'coreHarmonic',
    'padsAtmosphere',
    'colorOvertones',
    'expressiveVoices',
    'textureTime',
    'subtleRhythm',
    'contrastWildcard',
    'rare',
  ];

  for (const poolName of poolOrder) {
    const pool = pools[poolName];
    const picks = selectFromPool(poolName, pool, selected);
    selected = [...selected, ...picks];
  }

  selected = enforceContrast(selected);

  return [
    'SUGGESTED INSTRUMENTS (Ambient):',
    'Warm, intimate, emotional soundscapes with gentle movement',
    ...selected.map(i => `- ${i.name}`),
  ].join('\n');
}
