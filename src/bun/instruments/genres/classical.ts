import type { GenreDefinition } from '@bun/instruments/genres/types';

export const CLASSICAL_GENRE: GenreDefinition = {
  name: 'Classical',
  keywords: ['classical', 'orchestral', 'symphony', 'chamber', 'baroque', 'romantic', 'opera'],
  description: 'Sophisticated orchestral music with rich harmonies and dynamic expression',
  pools: {
    harmonic: {
      pick: { min: 1, max: 2 },
      instruments: ['strings', 'felt piano'],
    },
    color: {
      pick: { min: 2, max: 3 },
      instruments: [
        'violin',
        'cello',
        'viola',
        'flute',
        'piccolo',
        'oboe',
        'english horn',
        'clarinet',
        'bass clarinet',
        'bassoon',
        'contrabassoon',
        'french horn',
        'tuba',
        'trombone',
        'bass trombone',
        'harp',
        'celesta',
      ],
    },
    movement: {
      pick: { min: 0, max: 1 },
      chanceToInclude: 0.4,
      instruments: ['timpani', 'orchestral bass drum', 'suspended cymbal', 'crash cymbal', 'tam tam'],
    },
  },
  poolOrder: ['harmonic', 'color', 'movement'],
  maxTags: 5,
  exclusionRules: [
    ['violin', 'viola'],
    ['cello', 'viola'],
  ],
};
