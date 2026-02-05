import type { GenreDefinition } from '@bun/instruments/genres/types';

export const HARDSTYLE_GENRE: GenreDefinition = {
  name: 'Hardstyle',
  keywords: ['hardstyle', 'hard dance', 'hardstyle kick', 'euphoric hardstyle', 'rawstyle'],
  description:
    'Hard-hitting dance music with distorted kicks, euphoric melodies, and intense drops',
  pools: {
    kick: {
      pick: { min: 1, max: 1 },
      instruments: ['kick drum', 'distorted 808', '808'],
    },
    synth: {
      pick: { min: 1, max: 2 },
      instruments: ['supersaw', 'pluck synth', 'synth', 'arpeggiator'],
    },
    bass: {
      pick: { min: 1, max: 1 },
      instruments: ['synth bass', 'sub-bass', '808'],
    },
    fx: {
      pick: { min: 0, max: 1 },
      chanceToInclude: 0.4,
      instruments: ['FX risers', 'impacts', 'vocal chops', 'dub siren'],
    },
  },
  poolOrder: ['kick', 'synth', 'bass', 'fx'],
  maxTags: 5,
  exclusionRules: [
    ['kick drum', 'distorted 808'],
    ['synth bass', 'sub-bass'],
  ],
  bpm: { min: 150, max: 160, typical: 150 },
  moods: ['Aggressive', 'Euphoric', 'Hard', 'Intense', 'Powerful', 'Anthemic', 'Epic'],
};
