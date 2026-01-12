import type { GenreDefinition } from '@bun/instruments/genres/types';

export const DRUMANDBASS_GENRE: GenreDefinition = {
  name: 'Drum and Bass',
  keywords: ['drum and bass', 'dnb', 'd&b', 'jungle dnb', 'liquid dnb', 'neurofunk'],
  description: 'Fast-paced electronic music with breakbeats and heavy bass lines',
  pools: {
    bass: {
      pick: { min: 1, max: 2 },
      instruments: ['synth bass', 'sub-bass', 'TB-303', '808'],
    },
    drums: {
      pick: { min: 1, max: 2 },
      instruments: ['breakbeat', 'drums', 'snare drum', 'hi-hat'],
    },
    synth: {
      pick: { min: 1, max: 2 },
      instruments: ['synth pad', 'stabs', 'synth', 'ambient pad', 'wavetable synth'],
    },
    rare: {
      pick: { min: 0, max: 1 },
      chanceToInclude: 0.3,
      instruments: ['vocal chops', 'strings', 'felt piano', 'Rhodes'],
    },
  },
  poolOrder: ['bass', 'drums', 'synth', 'rare'],
  maxTags: 5,
  exclusionRules: [
    ['synth bass', 'sub-bass'],
    ['breakbeat', 'drums'],
  ],
  bpm: { min: 160, max: 180, typical: 174 },
  moods: ['Energetic', 'Driving', 'Intense', 'Uplifting', 'Dark', 'Liquid', 'Atmospheric'],
};
