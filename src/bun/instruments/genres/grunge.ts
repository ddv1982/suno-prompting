import type { GenreDefinition } from '@bun/instruments/genres/types';

export const GRUNGE_GENRE: GenreDefinition = {
  name: 'Grunge',
  keywords: ['grunge', 'seattle sound', 'alternative rock', 'sludge rock', 'dirty rock'],
  description: 'Raw, sludgy rock with heavy distortion, dissonant guitars, and angsty energy',
  pools: {
    guitar: {
      pick: { min: 1, max: 2 },
      instruments: ['distorted guitar', 'guitar', 'baritone guitar'],
    },
    rhythm: {
      pick: { min: 1, max: 2 },
      instruments: ['drums', 'bass', 'snare drum'],
    },
    dynamics: {
      pick: { min: 0, max: 1 },
      chanceToInclude: 0.3,
      instruments: ['guitar', 'acoustic guitar'],
    },
    rare: {
      pick: { min: 0, max: 1 },
      chanceToInclude: 0.15,
      instruments: ['cello', 'strings'],
    },
  },
  poolOrder: ['guitar', 'rhythm', 'dynamics', 'rare'],
  maxTags: 4,
  exclusionRules: [
    ['distorted guitar', 'guitar'],
    ['distorted guitar', 'acoustic guitar'],
  ],
  bpm: { min: 100, max: 130, typical: 115 },
  moods: ['Raw', 'Angry', 'Authentic', 'Angsty', 'Heavy', 'Disaffected', 'Gritty'],
};
