import type { GenreDefinition } from '@bun/instruments/genres/types';

export const SYNTHWAVE_GENRE: GenreDefinition = {
  name: 'Synthwave',
  keywords: ['synthwave', 'retrowave', '80s', 'outrun', 'vaporwave', 'darksynth', 'cyberpunk'],
  description: 'Retro-futuristic electronic music inspired by 1980s synthesizers and aesthetics',
  pools: {
    pad: {
      pick: { min: 2, max: 3 },
      instruments: ['analog synth', 'FM synth', 'Moog synth', 'arpeggiator', 'synth pad'],
    },
    movement: {
      pick: { min: 1, max: 2 },
      instruments: ['synth bass', '808', 'drums'],
    },
  },
  poolOrder: ['pad', 'movement'],
  maxTags: 4,
  exclusionRules: [
    ['808', 'drums'],
    ['synth bass', 'bass'],
  ],
};
