import type { GenreDefinition } from '@bun/instruments/genres/types';

export const PUNK_GENRE: GenreDefinition = {
  name: 'Punk',
  keywords: [
    'punk', 'pop punk', 'emo', 'emo pop', 'punk rock', 'hardcore',
    'y2k pop punk', 'indie pop punk', 'skate punk', 'melodic punk',
  ],
  description: 'Fast, energetic music with distorted guitars, driving rhythms, and raw emotional vocals',
  pools: {
    harmonic: {
      pick: { min: 1, max: 2 },
      instruments: ['distorted guitar', 'guitar', 'acoustic guitar'],
    },
    color: {
      pick: { min: 0, max: 1 },
      chanceToInclude: 0.3,
      instruments: ['grand piano', 'organ'],
    },
    movement: {
      pick: { min: 2, max: 2 },
      instruments: ['picked bass', 'bass', 'drums', 'kick drum'],
    },
  },
  poolOrder: ['harmonic', 'movement', 'color'],
  maxTags: 4,
  exclusionRules: [
    ['bass', 'picked bass'],
    ['distorted guitar', 'guitar'],
  ],
  bpm: { min: 160, max: 200, typical: 175 },
  moods: ['Energetic', 'Rebellious', 'Raw', 'Youthful', 'Urgent', 'Cathartic', 'Defiant', 'Emotional', 'Driving'],
};
