import type { GenreDefinition } from '@bun/instruments/genres/types';

export const FOLK_GENRE: GenreDefinition = {
  name: 'Folk',
  keywords: ['folk', 'acoustic', 'singer-songwriter', 'country', 'americana', 'bluegrass', 'celtic'],
  description: 'Organic, acoustic music rooted in traditional and storytelling traditions',
  pools: {
    harmonic: {
      pick: { min: 1, max: 2 },
      instruments: ['acoustic guitar', 'felt piano'],
    },
    color: {
      pick: { min: 1, max: 2 },
      instruments: ['violin', 'harp', 'flute', 'harmonica', 'accordion'],
    },
    movement: {
      pick: { min: 0, max: 1 },
      chanceToInclude: 0.5,
      instruments: ['cajón', 'percussion', 'frame drum'],
    },
    rare: {
      pick: { min: 0, max: 1 },
      chanceToInclude: 0.3,
      instruments: ['mandolin', 'banjo'],
    },
  },
  poolOrder: ['harmonic', 'color', 'movement', 'rare'],
  maxTags: 4,
};
