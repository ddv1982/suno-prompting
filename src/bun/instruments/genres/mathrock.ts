import type { GenreDefinition } from '@bun/instruments/genres/types';

export const MATHROCK_GENRE: GenreDefinition = {
  name: 'Math Rock',
  keywords: ['math rock', 'math-rock', 'technical rock', 'progressive rock', 'odd time'],
  description: 'Technical, complex rock with unconventional time signatures and intricate guitar work',
  pools: {
    guitar: {
      pick: { min: 1, max: 2 },
      instruments: ['guitar', 'acoustic guitar', 'processed guitar'],
    },
    rhythm: {
      pick: { min: 1, max: 2 },
      instruments: ['drums', 'bass', 'toms', 'percussion'],
    },
    texture: {
      pick: { min: 0, max: 1 },
      chanceToInclude: 0.25,
      instruments: ['synth', 'vibraphone', 'glockenspiel', 'Rhodes'],
    },
    rare: {
      pick: { min: 0, max: 1 },
      chanceToInclude: 0.15,
      instruments: ['trumpet', 'violin', 'saxophone', 'xylophone'],
    },
  },
  poolOrder: ['guitar', 'rhythm', 'texture', 'rare'],
  maxTags: 4,
  exclusionRules: [
    ['guitar', 'acoustic guitar'],
    ['drums', 'toms'],
  ],
  bpm: { min: 120, max: 160, typical: 140 },
  moods: ['Complex', 'Technical', 'Angular', 'Intricate', 'Cerebral', 'Precise', 'Dynamic'],
};
