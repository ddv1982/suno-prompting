import type { GenreDefinition } from '@bun/instruments/genres/types';

export const HYPERPOP_GENRE: GenreDefinition = {
  name: 'Hyperpop',
  keywords: ['hyperpop', 'hyper pop', 'pc music', 'bubblegum bass', 'glitchpop', 'digicore'],
  description:
    'Maximalist, chaotic pop with pitch-shifted vocals, glitchy production, and aggressive synths',
  pools: {
    pad: {
      pick: { min: 1, max: 2 },
      instruments: ['supersaw', 'arpeggiator', 'synth', 'bitcrushed synth', 'pluck synth'],
    },
    color: {
      pick: { min: 1, max: 2 },
      instruments: ['pitched vocals', 'synth bells', 'glockenspiel', 'bells'],
    },
    movement: {
      pick: { min: 1, max: 2 },
      instruments: ['distorted 808', '808', 'kick drum', 'trap hi hats', 'hi-hat'],
    },
    rare: {
      pick: { min: 0, max: 1 },
      chanceToInclude: 0.4,
      instruments: ['glitched vocals', 'vocoder', 'FX risers'],
    },
  },
  poolOrder: ['pad', 'color', 'movement', 'rare'],
  maxTags: 5,
  exclusionRules: [
    ['distorted 808', '808'],
    ['trap hi hats', 'hi-hat'],
  ],
  bpm: { min: 130, max: 180, typical: 150 },
  moods: [
    'Chaotic',
    'Euphoric',
    'Intense',
    'Glitchy',
    'Sweet',
    'Aggressive',
    'Maximalist',
    'Energetic',
  ],
};
