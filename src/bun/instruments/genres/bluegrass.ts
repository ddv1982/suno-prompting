import type { GenreDefinition } from '@bun/instruments/genres/types';

export const BLUEGRASS_GENRE: GenreDefinition = {
  name: 'Bluegrass',
  keywords: ['bluegrass', 'newgrass', 'progressive bluegrass', 'mountain music', 'appalachian'],
  description: 'Traditional acoustic American music with virtuosic picking, harmonies, and driving rhythms',
  pools: {
    strings: {
      pick: { min: 1, max: 2 },
      instruments: ['banjo', 'mandolin', 'fiddle', 'acoustic guitar', 'dobro'],
    },
    rhythm: {
      pick: { min: 1, max: 1 },
      instruments: ['upright bass', 'bass', 'acoustic guitar'],
    },
    texture: {
      pick: { min: 0, max: 1 },
      chanceToInclude: 0.3,
      instruments: ['harmonica', 'autoharp', 'mountain dulcimer', 'percussion'],
    },
    rare: {
      pick: { min: 0, max: 1 },
      chanceToInclude: 0.15,
      instruments: ['accordion', 'slide guitar'],
    },
  },
  poolOrder: ['strings', 'rhythm', 'texture', 'rare'],
  maxTags: 4,
  exclusionRules: [
    ['banjo', 'mandolin'],
    ['upright bass', 'bass'],
  ],
  bpm: { min: 100, max: 160, typical: 130 },
  moods: ['Traditional', 'Acoustic', 'Lively', 'Authentic', 'Rustic', 'Virtuosic', 'Spirited'],
};
