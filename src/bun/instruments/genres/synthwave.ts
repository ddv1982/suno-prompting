import type { GenreDefinition } from '@bun/instruments/genres/types';

export const SYNTHWAVE_GENRE: GenreDefinition = {
  name: 'Synthwave',
  keywords: ['synthwave', 'retrowave', '80s', 'outrun', 'vaporwave', 'darksynth', 'cyberpunk'],
  description: 'Retro-futuristic electronic music inspired by 1980s synthesizers and aesthetics',
  pools: {
    pad: {
      pick: { min: 2, max: 3 },
      instruments: [
        'analog synth',
        'analog synth pads',
        'FM synth',
        'digital synth',
        'Moog synth',
        'arpeggiator',
        'synth pad',
        'synth',
        'supersaw',
      ],
    },
    movement: {
      pick: { min: 1, max: 2 },
      instruments: ['synth bass', '808', 'kick drum', 'hi-hat', 'drums', 'Linn drum'],
    },
  },
  poolOrder: ['pad', 'movement'],
  maxTags: 4,
  exclusionRules: [
    ['808', 'drums'],
    ['synth bass', 'bass'],
    ['drums', 'Linn drum'],
  ],
  bpm: { min: 100, max: 130, typical: 115 },
  moods: [
    'Nostalgic',
    'Neon',
    'Driving',
    'Futuristic',
    'Dark',
    'Cool',
    'Retro',
    'Cyberpunk',
    'Dreamy',
  ],
};
