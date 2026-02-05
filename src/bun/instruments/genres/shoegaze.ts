import type { GenreDefinition } from '@bun/instruments/genres/types';

export const SHOEGAZE_GENRE: GenreDefinition = {
  name: 'Shoegaze',
  keywords: ['shoegaze', 'shoegazing', 'dreamy rock', 'wall of sound', 'noise pop'],
  description:
    'Hazy, ethereal rock with heavily effected guitars, dense layers, and obscured vocals',
  pools: {
    guitar: {
      pick: { min: 1, max: 2 },
      instruments: ['processed guitar', 'tremolo guitar', 'distorted guitar', 'e-bow guitar'],
    },
    effects: {
      pick: { min: 1, max: 2 },
      instruments: ['shimmer pad', 'tape delay', 'ambient pad', 'synth pad'],
    },
    rhythm: {
      pick: { min: 1, max: 1 },
      instruments: ['drums', 'bass', 'jazz brushes'],
    },
    rare: {
      pick: { min: 0, max: 1 },
      chanceToInclude: 0.25,
      instruments: ['synth pad', 'mellotron', 'strings'],
    },
  },
  poolOrder: ['guitar', 'effects', 'rhythm', 'rare'],
  maxTags: 4,
  exclusionRules: [
    ['processed guitar', 'e-bow guitar'],
    ['shimmer pad', 'ambient pad'],
  ],
  bpm: { min: 100, max: 130, typical: 110 },
  moods: ['Dreamy', 'Hazy', 'Ethereal', 'Melancholic', 'Hypnotic', 'Atmospheric', 'Wistful'],
};
