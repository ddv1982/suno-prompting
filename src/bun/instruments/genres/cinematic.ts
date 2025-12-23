import type { GenreDefinition } from '@bun/instruments/genres/types';

export const CINEMATIC_GENRE: GenreDefinition = {
  name: 'Cinematic',
  keywords: ['cinematic', 'epic', 'trailer', 'film score', 'soundtrack', 'orchestral', 'dramatic'],
  description: 'Epic, dramatic music designed to evoke powerful emotions and visual imagery',
  pools: {
    harmonic: {
      pick: { min: 1, max: 2 },
      instruments: ['strings', 'felt piano'],
    },
    color: {
      pick: { min: 1, max: 2 },
      instruments: [
        'french horn',
        'cello',
        'choir',
        'wordless choir',
        'violin',
        'celesta',
        'glockenspiel',
        'bells',
        'harp',
      ],
    },
    movement: {
      pick: { min: 1, max: 2 },
      instruments: ['taiko drums', 'percussion', 'toms', 'timpani'],
    },
  },
  poolOrder: ['harmonic', 'color', 'movement'],
  maxTags: 5,
  exclusionRules: [
    ['choir', 'wordless choir'],
    ['taiko drums', 'timpani'],
  ],
};
