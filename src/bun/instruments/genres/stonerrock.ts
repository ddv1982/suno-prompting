import type { GenreDefinition } from '@bun/instruments/genres/types';

export const STONERROCK_GENRE: GenreDefinition = {
  name: 'Stoner Rock',
  keywords: ['stoner rock', 'desert rock', 'stoner metal', 'fuzz rock', 'heavy psych'],
  description: 'Heavy, hypnotic rock with fuzzy guitars, slow grooves, and psychedelic elements',
  pools: {
    guitar: {
      pick: { min: 1, max: 2 },
      instruments: ['distorted guitar', 'wah guitar', 'baritone guitar', 'seven-string guitar'],
    },
    rhythm: {
      pick: { min: 1, max: 2 },
      instruments: ['drums', 'bass', 'toms'],
    },
    texture: {
      pick: { min: 0, max: 1 },
      chanceToInclude: 0.3,
      instruments: ['organ', 'drone', 'mellotron'],
    },
    rare: {
      pick: { min: 0, max: 1 },
      chanceToInclude: 0.2,
      instruments: ['cowbell', 'tambourine', 'processed guitar'],
    },
  },
  poolOrder: ['guitar', 'rhythm', 'texture', 'rare'],
  maxTags: 4,
  exclusionRules: [
    ['distorted guitar', 'wah guitar'],
    ['drums', 'toms'],
  ],
  bpm: { min: 80, max: 120, typical: 100 },
  moods: ['Heavy', 'Fuzzy', 'Hypnotic', 'Groovy', 'Psychedelic', 'Trippy', 'Thunderous'],
};
