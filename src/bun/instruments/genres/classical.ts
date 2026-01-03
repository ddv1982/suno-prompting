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
        'alto flute',
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
        'xylophone',
        'triangle',
        'tubular bells',
      ],
    },
    movement: {
      pick: { min: 0, max: 1 },
      chanceToInclude: 0.4,
      instruments: ['timpani', 'orchestral bass drum', 'suspended cymbal', 'crash cymbal', 'tam tam', 'slapstick'],
    },
    rare: {
      pick: { min: 0, max: 1 },
      chanceToInclude: 0.2,
      instruments: ['recorder', 'lute', 'harpsichord', 'viola da gamba', 'theorbo', 'crotales'],
    },
  },
  poolOrder: ['harmonic', 'color', 'movement', 'rare'],
  maxTags: 5,
  exclusionRules: [
    ['violin', 'viola'],
    ['cello', 'viola'],
  ],
  bpm: { min: 60, max: 140, typical: 90 },
  moods: ['Majestic', 'Elegant', 'Dramatic', 'Tender', 'Noble', 'Triumphant', 'Melancholic', 'Regal', 'Soaring'],
};
