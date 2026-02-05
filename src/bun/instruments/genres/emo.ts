import type { GenreDefinition } from '@bun/instruments/genres/types';

export const EMO_GENRE: GenreDefinition = {
  name: 'Emo',
  keywords: ['emo', 'emo rock', 'emotional hardcore', 'midwest emo', 'screamo'],
  description:
    'Emotionally expressive rock with confessional lyrics, dynamic shifts, and raw performances',
  pools: {
    guitar: {
      pick: { min: 1, max: 2 },
      instruments: ['guitar', 'distorted guitar', 'acoustic guitar'],
    },
    rhythm: {
      pick: { min: 1, max: 2 },
      instruments: ['drums', 'bass', 'snare drum'],
    },
    texture: {
      pick: { min: 0, max: 1 },
      chanceToInclude: 0.3,
      instruments: ['felt piano', 'acoustic guitar', 'strings'],
    },
    rare: {
      pick: { min: 0, max: 1 },
      chanceToInclude: 0.2,
      instruments: ['glockenspiel', 'violin', 'trumpet'],
    },
  },
  poolOrder: ['guitar', 'rhythm', 'texture', 'rare'],
  maxTags: 4,
  exclusionRules: [
    ['guitar', 'distorted guitar'],
    ['guitar', 'acoustic guitar'],
  ],
  bpm: { min: 110, max: 140, typical: 125 },
  moods: ['Emotional', 'Raw', 'Confessional', 'Intense', 'Melancholic', 'Cathartic', 'Vulnerable'],
};
