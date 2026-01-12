import type { GenreDefinition } from '@bun/instruments/genres/types';

export const POSTPUNK_GENRE: GenreDefinition = {
  name: 'Post-Punk',
  keywords: ['post-punk', 'post punk', 'dark wave', 'angular rock', 'gothic rock'],
  description: 'Angular, atmospheric rock with driving bass, sparse guitars, and brooding vocals',
  pools: {
    bass: {
      pick: { min: 1, max: 1 },
      instruments: ['bass', 'picked bass', 'synth bass'],
    },
    guitar: {
      pick: { min: 1, max: 2 },
      instruments: ['guitar', 'processed guitar', 'Telecaster'],
    },
    drums: {
      pick: { min: 1, max: 1 },
      instruments: ['drums', 'snare drum', 'percussion'],
    },
    synth: {
      pick: { min: 0, max: 1 },
      chanceToInclude: 0.35,
      instruments: ['analog synth', 'synth strings', 'ambient pad'],
    },
  },
  poolOrder: ['bass', 'guitar', 'drums', 'synth'],
  maxTags: 4,
  exclusionRules: [
    ['bass', 'synth bass'],
    ['guitar', 'processed guitar'],
  ],
  bpm: { min: 120, max: 140, typical: 130 },
  moods: ['Angular', 'Dark', 'Brooding', 'Cold', 'Intense', 'Moody', 'Stark'],
};
