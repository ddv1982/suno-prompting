import type { GenreDefinition } from '@bun/instruments/genres/types';

export const POP_GENRE: GenreDefinition = {
  name: 'Pop',
  keywords: ['pop', 'mainstream', 'top 40', 'dance pop', 'synth pop', 'electropop'],
  description: 'Catchy, accessible music with memorable melodies and polished production',
  pools: {
    harmonic: {
      pick: { min: 1, max: 1 },
      instruments: ['felt piano', 'Fender Stratocaster', 'guitar', 'acoustic guitar'],
    },
    pad: {
      pick: { min: 1, max: 1 },
      instruments: ['synth pad', 'synth', 'analog synth', 'digital synth', 'arpeggiator', 'synth piano'],
    },
    movement: {
      pick: { min: 1, max: 2 },
      instruments: ['bass', 'drums', '808'],
    },
  },
  poolOrder: ['harmonic', 'pad', 'movement'],
  maxTags: 4,
  exclusionRules: [
    ['808', 'drums'],
  ],
};
