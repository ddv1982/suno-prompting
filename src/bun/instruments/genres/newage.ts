import type { GenreDefinition } from '@bun/instruments/genres/types';

export const NEWAGE_GENRE: GenreDefinition = {
  name: 'New Age',
  keywords: ['new age', 'newage', 'meditation', 'healing', 'spa', 'yoga', 'relaxation', 'wellness'],
  description:
    'Peaceful, meditative music with flowing melodies, natural sounds, and calming textures',
  pools: {
    harmonic: {
      pick: { min: 1, max: 2 },
      instruments: ['harp', 'grand piano', 'felt piano', 'nylon string guitar', 'kora'],
    },
    pad: {
      pick: { min: 1, max: 2 },
      instruments: ['synth pad', 'ambient pad', 'shimmer pad', 'drone', 'evolving pad', 'warm pad'],
    },
    color: {
      pick: { min: 1, max: 2 },
      instruments: [
        'flute',
        'shakuhachi',
        'singing bowls',
        'crystal bowls',
        'kalimba',
        'bansuri',
        'bells',
      ],
    },
    movement: {
      pick: { min: 0, max: 1 },
      chanceToInclude: 0.4,
      instruments: ['rain stick', 'ocean drum', 'shaker', 'frame drum', 'handpan'],
    },
  },
  poolOrder: ['pad', 'harmonic', 'color', 'movement'],
  maxTags: 4,
  exclusionRules: [
    ['grand piano', 'felt piano'],
    ['singing bowls', 'crystal bowls'],
    ['shakuhachi', 'bansuri'],
  ],
  bpm: { min: 50, max: 80, typical: 65 },
  moods: [
    'Peaceful',
    'Meditative',
    'Serene',
    'Healing',
    'Tranquil',
    'Flowing',
    'Ethereal',
    'Calming',
  ],
};
