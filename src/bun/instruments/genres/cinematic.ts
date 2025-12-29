import type { GenreDefinition } from '@bun/instruments/genres/types';

export const CINEMATIC_GENRE: GenreDefinition = {
  name: 'Cinematic',
  keywords: ['cinematic', 'epic', 'trailer', 'film score', 'soundtrack', 'orchestral', 'dramatic', 'hybrid orchestral'],
  description: 'Epic, dramatic music designed to evoke powerful emotions and visual imagery',
  pools: {
    harmonic: {
      pick: { min: 1, max: 2 },
      instruments: ['strings', 'grand piano', 'string ostinato', 'pizzicato strings'],
    },
    color: {
      pick: { min: 1, max: 2 },
      instruments: [
        'french horn',
        'low brass',
        'tuba',
        'trombone',
        'cello',
        'choir',
        'wordless choir',
        'solo soprano',
        'violin',
        'celesta',
        'glockenspiel',
        'bells',
        'harp',
        'english horn',
        'piccolo',
      ],
    },
    movement: {
      pick: { min: 1, max: 2 },
      instruments: ['taiko drums', 'percussion', 'toms', 'timpani', 'orchestral bass drum', 'tam tam', 'suspended cymbal'],
    },
    rare: {
      pick: { min: 0, max: 1 },
      chanceToInclude: 0.4,
      instruments: ['braams', 'impacts', 'FX risers', 'sub-bass'],
    },
  },
  poolOrder: ['harmonic', 'color', 'movement', 'rare'],
  maxTags: 5,
  exclusionRules: [
    ['choir', 'wordless choir'],
    ['taiko drums', 'timpani'],
    ['strings', 'string ostinato'],
    ['strings', 'pizzicato strings'],
    ['french horn', 'low brass'],
  ],
  bpm: { min: 80, max: 140, typical: 110 },
  moods: ['Epic', 'Dramatic', 'Triumphant', 'Tense', 'Majestic', 'Heroic', 'Suspenseful', 'Powerful', 'Emotional'],
};
