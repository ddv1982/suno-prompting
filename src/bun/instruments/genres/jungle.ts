import type { GenreDefinition } from '@bun/instruments/genres/types';

export const JUNGLE_GENRE: GenreDefinition = {
  name: 'Jungle',
  keywords: ['jungle', 'ragga jungle', 'oldskool jungle', 'jungle techno', 'darkcore'],
  description: 'Fast breakbeat-driven electronic music with reggae and dub influences',
  pools: {
    drums: {
      pick: { min: 1, max: 2 },
      instruments: ['breakbeat', 'drums', 'hi-hat', 'snare drum'],
    },
    bass: {
      pick: { min: 1, max: 1 },
      instruments: ['sub-bass', 'synth bass', '808'],
    },
    texture: {
      pick: { min: 1, max: 2 },
      instruments: ['dub siren', 'stabs', 'ambient pad', 'synth pad'],
    },
    rare: {
      pick: { min: 0, max: 1 },
      chanceToInclude: 0.3,
      instruments: ['vocal chops', 'strings', 'melodica'],
    },
  },
  poolOrder: ['drums', 'bass', 'texture', 'rare'],
  maxTags: 5,
  exclusionRules: [
    ['breakbeat', 'drums'],
    ['sub-bass', 'synth bass'],
  ],
  bpm: { min: 160, max: 180, typical: 170 },
  moods: ['Chaotic', 'Raw', 'Tribal', 'Dark', 'Intense', 'Primal', 'Underground'],
};
