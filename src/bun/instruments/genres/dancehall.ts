import type { GenreDefinition } from '@bun/instruments/genres/types';

export const DANCEHALL_GENRE: GenreDefinition = {
  name: 'Dancehall',
  keywords: ['dancehall', 'reggaeton', 'bashment', 'jamaican', 'caribbean'],
  description: 'Rhythmic Jamaican party music with syncopated beats, bass, and infectious grooves',
  pools: {
    drums: {
      pick: { min: 1, max: 2 },
      instruments: ['drums', 'hi-hat', 'handclaps', 'percussion'],
    },
    bass: {
      pick: { min: 1, max: 1 },
      instruments: ['sub-bass', 'synth bass', '808'],
    },
    keys: {
      pick: { min: 1, max: 1 },
      instruments: ['stabs', 'organ', 'synth pad'],
    },
    fx: {
      pick: { min: 0, max: 1 },
      chanceToInclude: 0.35,
      instruments: ['vocal chops', 'dub siren'],
    },
  },
  poolOrder: ['drums', 'bass', 'keys', 'fx'],
  maxTags: 4,
  exclusionRules: [
    ['sub-bass', 'synth bass'],
    ['stabs', 'synth pad'],
  ],
  bpm: { min: 90, max: 110, typical: 100 },
  moods: ['Rhythmic', 'Party', 'Caribbean', 'Groovy', 'Energetic', 'Infectious', 'Summer'],
};
