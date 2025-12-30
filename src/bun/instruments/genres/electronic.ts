import type { GenreDefinition } from '@bun/instruments/genres/types';

export const ELECTRONIC_GENRE: GenreDefinition = {
  name: 'Electronic',
  keywords: ['edm', 'electronic', 'dubstep', 'drum and bass', 'dnb', 'electro', 'bass music'],
  description: 'High-energy dance music driven by synthesizers and electronic beats',
  pools: {
    pad: {
      pick: { min: 1, max: 2 },
      instruments: ['synth pad', 'analog synth', 'FM synth', 'arpeggiator', 'synth'],
    },
    movement: {
      pick: { min: 2, max: 2 },
      instruments: ['808', 'synth bass', 'kick drum', 'hi-hat', 'drums'],
    },
    rare: {
      pick: { min: 0, max: 1 },
      chanceToInclude: 0.2,
      instruments: ['vocoder'],
    },
  },
  poolOrder: ['pad', 'movement', 'rare'],
  maxTags: 4,
  exclusionRules: [
    ['808', 'drums'],
    ['synth bass', 'bass'],
  ],
  bpm: { min: 120, max: 150, typical: 128 },
  moods: ['Euphoric', 'Energetic', 'Hypnotic', 'Driving', 'Pulsing', 'High Energy', 'Danceable', 'Intense'],
};
