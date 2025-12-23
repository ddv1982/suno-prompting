import { getInstrumentsByCategory, type InstrumentCategory } from '@bun/instruments/registry';

export type PoolConfig = {
  readonly min: number;
  readonly max: number;
  readonly chance?: number;
};

export type ModePalette = {
  readonly name: string;
  readonly pools: Partial<Record<InstrumentCategory, PoolConfig>>;
  readonly maxTags: number;
};

export const EXCLUSION_RULES: readonly [string, string][] = [
  ['felt piano', 'Rhodes'],
  ['felt piano', 'Wurlitzer'],
  ['Rhodes', 'Wurlitzer'],
  ['bells', 'singing bowls'],
  ['bells', 'glass bells'],
  ['glockenspiel', 'celesta'],
  ['violin', 'viola'],
  ['cello', 'viola'],
  ['synth pad', 'ambient pad'],
  ['analog synth pads', 'crystalline synth pads'],
  ['taiko drums', 'djembe'],
  ['congas', 'djembe'],
  ['frame drum', 'cajón'],
  // Synth vs acoustic conflicts
  ['synth strings', 'strings'],
  ['synth brass', 'trumpet'],
  ['synth brass', 'trombone'],
  ['synth brass', 'french horn'],
  ['synth choir', 'choir'],
  ['synth choir', 'wordless choir'],
  ['synth piano', 'felt piano'],
  ['synth flute', 'flute'],
  ['synth bells', 'bells'],
  ['synth bells', 'glockenspiel'],
  ['synth bass', 'bass'],
  ['808', 'drums'],
  ['808', 'kick drum'],
  // Organ conflicts
  ['organ', 'Hammond organ'],
];

export const MODE_PALETTES: Record<string, ModePalette> = {
  lydian_dominant: {
    name: 'Lydian Dominant',
    pools: {
      harmonic: { min: 1, max: 1 },
      color: { min: 2, max: 3 },
      movement: { min: 1, max: 1 },
      rare: { min: 0, max: 1, chance: 0.3 },
    },
    maxTags: 5,
  },
  lydian_augmented: {
    name: 'Lydian Augmented',
    pools: {
      pad: { min: 1, max: 2 },
      color: { min: 2, max: 3 },
      rare: { min: 0, max: 1, chance: 0.2 },
    },
    maxTags: 5,
  },
  lydian_sharp_two: {
    name: 'Lydian #2',
    pools: {
      harmonic: { min: 1, max: 1 },
      color: { min: 2, max: 3 },
      movement: { min: 0, max: 1, chance: 0.4 },
    },
    maxTags: 4,
  },
  lydian: {
    name: 'Pure Lydian',
    pools: {
      harmonic: { min: 1, max: 1 },
      pad: { min: 1, max: 1 },
      color: { min: 1, max: 2 },
      movement: { min: 0, max: 1, chance: 0.3 },
    },
    maxTags: 4,
  },
  ionian: {
    name: 'Ionian',
    pools: {
      harmonic: { min: 1, max: 2 },
      color: { min: 1, max: 2 },
      movement: { min: 0, max: 1 },
    },
    maxTags: 4,
  },
  mixolydian: {
    name: 'Mixolydian',
    pools: {
      harmonic: { min: 1, max: 1 },
      color: { min: 1, max: 2 },
      movement: { min: 1, max: 2 },
      rare: { min: 0, max: 1, chance: 0.25 },
    },
    maxTags: 5,
  },
  dorian: {
    name: 'Dorian',
    pools: {
      harmonic: { min: 1, max: 1 },
      color: { min: 2, max: 3 },
      movement: { min: 1, max: 1 },
    },
    maxTags: 5,
  },
  aeolian: {
    name: 'Aeolian',
    pools: {
      harmonic: { min: 1, max: 2 },
      color: { min: 2, max: 3 },
      movement: { min: 0, max: 1, chance: 0.3 },
    },
    maxTags: 5,
  },
  phrygian: {
    name: 'Phrygian',
    pools: {
      harmonic: { min: 1, max: 1 },
      color: { min: 1, max: 2 },
      movement: { min: 1, max: 2 },
      rare: { min: 0, max: 1, chance: 0.3 },
    },
    maxTags: 5,
  },
  locrian: {
    name: 'Locrian',
    pools: {
      pad: { min: 1, max: 2 },
      color: { min: 1, max: 2 },
      movement: { min: 1, max: 1 },
    },
    maxTags: 4,
  },
  harmonic_minor: {
    name: 'Harmonic Minor',
    pools: {
      harmonic: { min: 1, max: 2 },
      color: { min: 2, max: 3 },
      rare: { min: 0, max: 1, chance: 0.2 },
    },
    maxTags: 5,
  },
  melodic_minor: {
    name: 'Melodic Minor',
    pools: {
      harmonic: { min: 1, max: 1 },
      color: { min: 2, max: 3 },
      movement: { min: 1, max: 1 },
    },
    maxTags: 5,
  },
};

function pickRandom<T>(arr: readonly T[], count: number): T[] {
  const shuffled = [...arr].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

function randomBetween(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function applyExclusionRules(selected: string[]): string[] {
  const result = [...selected];

  for (const [a, b] of EXCLUSION_RULES) {
    const hasA = result.includes(a);
    const hasB = result.includes(b);

    if (hasA && hasB) {
      const removeIndex = Math.random() < 0.5 ? result.indexOf(a) : result.indexOf(b);
      result.splice(removeIndex, 1);
    }
  }

  return result;
}

export function selectInstrumentsForMode(mode: string): string[] {
  const palette = MODE_PALETTES[mode];
  if (!palette) {
    return [];
  }

  const selected: string[] = [];

  for (const [category, config] of Object.entries(palette.pools) as [
    InstrumentCategory,
    PoolConfig,
  ][]) {
    if (config.chance !== undefined && Math.random() > config.chance) {
      continue;
    }

    const instruments = getInstrumentsByCategory(category);
    const count = randomBetween(config.min, config.max);
    const picks = pickRandom(instruments, count);
    selected.push(...picks);
  }

  const filtered = applyExclusionRules(selected);
  return filtered.slice(0, palette.maxTags);
}

export function getModePalette(mode: string): ModePalette | undefined {
  return MODE_PALETTES[mode];
}
