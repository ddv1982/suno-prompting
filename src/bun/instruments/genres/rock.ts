import type { GenreDefinition } from '@bun/instruments/genres/types';

export const ROCK_GENRE: GenreDefinition = {
  name: 'Rock',
  keywords: ['rock', 'alternative', 'indie rock', 'hard rock', 'grunge', 'classic rock', 'heartland rock'],
  description: 'Guitar-driven music with strong rhythms and powerful energy',
  pools: {
    harmonic: {
      pick: { min: 1, max: 2 },
      instruments: ['distorted guitar', 'Fender Stratocaster', 'guitar', 'acoustic guitar', 'Telecaster'],
    },
    color: {
      pick: { min: 0, max: 1 },
      chanceToInclude: 0.3,
      instruments: ['electric piano', 'organ', 'Clavinet', 'grand piano'],
    },
    movement: {
      pick: { min: 2, max: 2 },
      instruments: ['bass', 'drums', 'kick drum', 'toms'],
    },
    rare: {
      pick: { min: 0, max: 1 },
      chanceToInclude: 0.2,
      instruments: ['Hammond organ', 'tambourine'],
    },
  },
  poolOrder: ['harmonic', 'movement', 'color', 'rare'],
  maxTags: 4,
  exclusionRules: [
    ['organ', 'Hammond organ'],
    ['distorted guitar', 'guitar'],
  ],
  bpm: { min: 100, max: 160, typical: 120 },
  moods: ['Driving', 'Powerful', 'Energetic', 'Rebellious', 'Raw', 'Intense', 'Confident', 'Gritty', 'Anthemic'],
};
