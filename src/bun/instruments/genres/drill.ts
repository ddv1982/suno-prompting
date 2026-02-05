import type { GenreDefinition } from '@bun/instruments/genres/types';

export const DRILL_GENRE: GenreDefinition = {
  name: 'Drill',
  keywords: ['drill', 'uk drill', 'chicago drill', 'ny drill', 'brooklyn drill'],
  description: 'Dark, aggressive hip-hop with sliding 808s, rapid hi-hats, and ominous melodies',
  pools: {
    harmonic: {
      pick: { min: 1, max: 1 },
      instruments: ['dark piano', 'strings', 'synth', 'guitar'],
    },
    pad: {
      pick: { min: 0, max: 1 },
      chanceToInclude: 0.4,
      instruments: ['synth pad', 'ambient pad', 'synth strings'],
    },
    movement: {
      pick: { min: 2, max: 2 },
      instruments: ['sliding 808', 'drill hi hats', 'hi-hat', 'percussion'],
    },
    rare: {
      pick: { min: 0, max: 1 },
      chanceToInclude: 0.3,
      instruments: ['FX risers', 'impacts', 'brass stabs'],
    },
  },
  poolOrder: ['harmonic', 'pad', 'movement', 'rare'],
  maxTags: 4,
  exclusionRules: [['drill hi hats', 'hi-hat']],
  bpm: { min: 140, max: 150, typical: 145 },
  moods: ['Dark', 'Aggressive', 'Menacing', 'Hard', 'Street', 'Intense', 'Gritty', 'Bouncy'],
};
