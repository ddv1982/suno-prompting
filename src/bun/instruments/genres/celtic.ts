import type { GenreDefinition } from '@bun/instruments/genres/types';

export const CELTIC_GENRE: GenreDefinition = {
  name: 'Celtic',
  keywords: ['celtic', 'irish', 'scottish', 'gaelic', 'celtic folk', 'traditional irish'],
  description:
    'Traditional Celtic music with folk instruments, jigs, reels, and evocative melodies',
  pools: {
    melody: {
      pick: { min: 1, max: 2 },
      instruments: ['fiddle', 'tin whistle', 'flute', 'recorder'],
    },
    accompaniment: {
      pick: { min: 1, max: 2 },
      instruments: ['acoustic guitar', 'bouzouki', 'harp', 'mandolin', 'accordion'],
    },
    rhythm: {
      pick: { min: 1, max: 1 },
      instruments: ['frame drum', 'drums', 'percussion'],
    },
    rare: {
      pick: { min: 0, max: 1 },
      chanceToInclude: 0.25,
      instruments: ['concertina', 'banjo'],
    },
  },
  poolOrder: ['melody', 'accompaniment', 'rhythm', 'rare'],
  maxTags: 4,
  exclusionRules: [
    ['fiddle', 'violin'],
    ['frame drum', 'drums'],
  ],
  bpm: { min: 80, max: 140, typical: 110 },
  moods: ['Traditional', 'Lively', 'Folk', 'Spirited', 'Nostalgic', 'Warm', 'Festive'],
};
