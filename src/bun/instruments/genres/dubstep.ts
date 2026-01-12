import type { GenreDefinition } from '@bun/instruments/genres/types';

export const DUBSTEP_GENRE: GenreDefinition = {
  name: 'Dubstep',
  keywords: ['dubstep', 'wobble', 'brostep', 'riddim', 'bass drop', 'heavy bass'],
  description: 'Heavy bass music with wobble bass, aggressive synths, and half-time rhythms',
  pools: {
    bass: {
      pick: { min: 1, max: 2 },
      instruments: ['synth bass', 'sub-bass', 'distorted 808', '808', 'TB-303'],
    },
    drums: {
      pick: { min: 1, max: 2 },
      instruments: ['snare drum', '808', 'hi-hat', 'breakbeat', 'drums'],
    },
    synth: {
      pick: { min: 1, max: 2 },
      instruments: ['supersaw', 'stabs', 'FM synth', 'synth', 'wavetable synth', 'modular synth'],
    },
    fx: {
      pick: { min: 0, max: 1 },
      chanceToInclude: 0.4,
      instruments: ['FX risers', 'impacts', 'vocal chops', 'dub siren'],
    },
  },
  poolOrder: ['bass', 'drums', 'synth', 'fx'],
  maxTags: 5,
  exclusionRules: [
    ['synth bass', 'sub-bass'],
    ['808', 'distorted 808'],
  ],
  bpm: { min: 138, max: 150, typical: 140 },
  moods: ['Intense', 'Aggressive', 'Heavy', 'Dark', 'Energetic', 'Powerful', 'Menacing'],
};
