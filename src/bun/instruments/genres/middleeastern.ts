import type { GenreDefinition } from '@bun/instruments/genres/types';

export const MIDDLEEASTERN_GENRE: GenreDefinition = {
  name: 'Middle Eastern',
  keywords: ['middle eastern', 'arabic', 'oriental', 'persian', 'turkish', 'maqam'],
  description: 'Traditional Middle Eastern music with modal melodies, intricate rhythms, and exotic instruments',
  pools: {
    melody: {
      pick: { min: 1, max: 2 },
      instruments: ['oud', 'duduk', 'sitar', 'bansuri'],
    },
    percussion: {
      pick: { min: 1, max: 2 },
      instruments: ['doumbek', 'frame drum', 'tabla', 'percussion'],
    },
    texture: {
      pick: { min: 0, max: 1 },
      chanceToInclude: 0.4,
      instruments: ['strings', 'violin', 'cello', 'accordion'],
    },
    rare: {
      pick: { min: 0, max: 1 },
      chanceToInclude: 0.2,
      instruments: ['santoor', 'bass', 'synth pad'],
    },
  },
  poolOrder: ['melody', 'percussion', 'texture', 'rare'],
  maxTags: 4,
  exclusionRules: [
    ['oud', 'sitar'],
    ['doumbek', 'tabla'],
  ],
  bpm: { min: 80, max: 140, typical: 110 },
  moods: ['Exotic', 'Mystical', 'Traditional', 'Evocative', 'Ornate', 'Passionate', 'Ancient'],
};
