import type { GenreDefinition } from '@bun/instruments/genres/types';

export const METAL_GENRE: GenreDefinition = {
  name: 'Metal',
  keywords: [
    'metal', 'heavy metal', 'doom metal', 'progressive metal', 'industrial',
    'death metal', 'black metal', 'thrash metal', 'nu metal', 'gothic metal',
  ],
  description: 'Heavy, aggressive music with downtuned guitars, powerful drums, and intense vocals',
  pools: {
    harmonic: {
      pick: { min: 1, max: 2 },
      instruments: ['distorted guitar', 'guitar'],
    },
    pad: {
      pick: { min: 0, max: 1 },
      chanceToInclude: 0.4,
      instruments: ['synth pad', 'strings', 'choir', 'organ'],
    },
    movement: {
      pick: { min: 2, max: 2 },
      instruments: ['bass', 'drums', 'kick drum', 'timpani'],
    },
    rare: {
      pick: { min: 0, max: 1 },
      chanceToInclude: 0.3,
      instruments: ['orchestra', 'braams', 'low brass'],
    },
  },
  poolOrder: ['harmonic', 'movement', 'pad', 'rare'],
  maxTags: 4,
  exclusionRules: [
    ['distorted guitar', 'guitar'],
    ['choir', 'strings'],
  ],
  bpm: { min: 100, max: 180, typical: 140 },
  moods: ['Aggressive', 'Intense', 'Dark', 'Heavy', 'Brutal', 'Epic', 'Menacing', 'Powerful', 'Crushing'],
};
