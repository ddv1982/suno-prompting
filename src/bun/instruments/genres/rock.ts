import type { GenreDefinition } from '@bun/instruments/genres/types';

export const ROCK_GENRE: GenreDefinition = {
  name: 'Rock',
  keywords: ['rock', 'alternative', 'indie rock', 'hard rock', 'punk', 'grunge', 'metal'],
  description: 'Guitar-driven music with strong rhythms and powerful energy',
  pools: {
    harmonic: {
      pick: { min: 1, max: 2 },
      instruments: ['distorted guitar', 'Fender Stratocaster', 'guitar', 'acoustic guitar'],
    },
    color: {
      pick: { min: 0, max: 1 },
      chanceToInclude: 0.3,
      instruments: ['electric piano', 'organ'],
    },
    movement: {
      pick: { min: 2, max: 2 },
      instruments: ['bass', 'drums', 'kick drum'],
    },
    rare: {
      pick: { min: 0, max: 1 },
      chanceToInclude: 0.2,
      instruments: ['Hammond organ'],
    },
  },
  poolOrder: ['harmonic', 'movement', 'color', 'rare'],
  maxTags: 4,
  exclusionRules: [
    ['organ', 'Hammond organ'],
  ],
};
