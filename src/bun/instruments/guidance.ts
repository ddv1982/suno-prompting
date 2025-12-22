import { HARMONIC_STYLES, ALL_COMBINATIONS } from '@bun/instruments/modes';
import type { HarmonicStyle, CombinationType } from '@bun/instruments/modes';
import { GENRE_REGISTRY } from '@bun/instruments/genres';
import type { GenreType, GenreDefinition, InstrumentPool } from '@bun/instruments/genres';
import { RHYTHMIC_STYLES } from '@bun/instruments/data';
import type { RhythmicStyle } from '@bun/instruments/data';

export type InstrumentSelectionOptions = {
  readonly userInstruments?: readonly string[];
  readonly maxTags?: number;
};

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

export function getHarmonicGuidance(style: HarmonicStyle): string {
  const s = HARMONIC_STYLES[style];
  const chars = shuffle(s.characteristics).slice(0, 3);
  const prog = pickRandom(s.progressions);

  const lines = [
    `HARMONIC STYLE (${s.name}):`,
    s.description,
    `Chord: ${s.chordType}`,
    `Formula: ${s.formula}`,
    ...chars.map(c => `- ${c}`),
    `Suggested Progression: ${prog}`,
    `Examples: ${s.keyExamples}`,
  ];

  if (s.bestInstruments) {
    lines.push(`Best instruments: ${s.bestInstruments.join(', ')}`);
  }

  return lines.join('\n');
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

export function getCombinationGuidance(combo: CombinationType): string {
  const c = ALL_COMBINATIONS[combo];
  const progs = shuffle([...c.progressions]).slice(0, 3);

  const lines = [
    `MODAL COMBINATION (${c.name}):`,
    c.description,
    '',
    `Emotional Arc: ${c.emotionalArc}`,
    '',
  ];

  if ('borrowedChords' in c) {
    lines.push(`Borrowed chords: ${c.borrowedChords.join(', ')}`);
    lines.push('');
  }

  lines.push('Suggested progressions:');
  lines.push(...progs.map(p => `- ${p}`));

  if ('famousExamples' in c && c.famousExamples) {
    lines.push('');
    lines.push(`Famous examples: ${c.famousExamples.join(', ')}`);
  }

  lines.push('');
  lines.push(`Best instruments: ${c.bestInstruments.join(', ')}`);

  return lines.join('\n');
}

function computePickCount(pick: InstrumentPool['pick'], remainingSlots: number): number {
  if (remainingSlots <= 0) return 0;
  const desired = randomIntInclusive(pick.min, pick.max);
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
  exclusionRules: readonly [string, string][]
): string[] {
  if (!rollChance(pool.chanceToInclude)) return [];

  const count = computePickCount(pool.pick, remainingSlots);
  if (count <= 0) return [];

  const available = pool.instruments.filter(token => !hasExclusion(selected, token, exclusionRules));
  const shuffled = shuffle(available);
  const picks = pickUniqueTokens(shuffled, selected, count, exclusionRules);

  return picks;
}

export function getGenreInstruments(
  genre: GenreType,
  options?: InstrumentSelectionOptions
): string {
  const def = GENRE_REGISTRY[genre];
  const maxTags = options?.maxTags ?? def.maxTags;
  const userInstruments = options?.userInstruments ?? [];
  const exclusionRules = def.exclusionRules ?? [];

  const userSelected = userInstruments.slice(0, maxTags);
  let selected: string[] = [...userSelected];

  for (const poolName of def.poolOrder) {
    if (selected.length >= maxTags) break;
    const pool = def.pools[poolName];
    if (!pool) continue;
    const picks = pickFromPool(pool, selected, maxTags - selected.length, exclusionRules);
    selected = [...selected, ...picks].slice(0, maxTags);
  }

  const lines: string[] = [
    'SUGGESTED INSTRUMENTS (Suno tags):',
    `${def.name}: ${def.description}`,
    '',
  ];

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

export function getAmbientInstruments(options?: InstrumentSelectionOptions): string {
  return getGenreInstruments('ambient', options);
}

export type ModeSelectionInput = {
  genre: GenreType | null;
  combination: CombinationType | null;
  singleMode: HarmonicStyle | null;
  reasoning: string;
};

export function buildGuidanceFromSelection(
  selection: ModeSelectionInput,
  options?: InstrumentSelectionOptions
): string {
  const parts: string[] = [];

  if (selection.combination) {
    parts.push(getCombinationGuidance(selection.combination));
  } else if (selection.singleMode) {
    parts.push(getHarmonicGuidance(selection.singleMode));
  }

  if (selection.genre) {
    parts.push(getGenreInstruments(selection.genre, options));
  }

  return parts.join('\n\n');
}
