import type { GenreDefinition } from '@bun/instruments/genres/types';

export const DARKSYNTH_GENRE: GenreDefinition = {
  name: 'Darksynth',
  keywords: ['darksynth', 'dark synthwave', 'horror synth', 'darkwave', 'cyberpunk'],
  description:
    'Dark, aggressive synthwave with cinematic horror elements and industrial influences',
  pools: {
    synth: {
      pick: { min: 1, max: 2 },
      instruments: ['synth', 'modular synth', 'wavetable synth', 'analog synth'],
    },
    pad: {
      pick: { min: 1, max: 1 },
      instruments: ['ambient pad', 'synth strings', 'drone', 'synth pad'],
    },
    rhythm: {
      pick: { min: 1, max: 2 },
      instruments: ['drums', 'synth bass', 'distorted 808', '808'],
    },
    fx: {
      pick: { min: 0, max: 1 },
      chanceToInclude: 0.4,
      instruments: ['FX risers', 'impacts', 'vocal chops'],
    },
  },
  poolOrder: ['synth', 'pad', 'rhythm', 'fx'],
  maxTags: 5,
  exclusionRules: [
    ['synth', 'analog synth'],
    ['ambient pad', 'synth pad'],
  ],
  bpm: { min: 100, max: 130, typical: 115 },
  moods: ['Dark', 'Cinematic', 'Aggressive', 'Menacing', 'Intense', 'Ominous', 'Sinister'],
};
