import type { GenreDefinition } from '@bun/instruments/genres/types';

export const BREAKBEAT_GENRE: GenreDefinition = {
  name: 'Breakbeat',
  keywords: ['breakbeat', 'breaks', 'big beat', 'breakbeat hardcore', 'nu skool breaks'],
  description: 'Electronic music built around syncopated drum breaks with funky, energetic grooves',
  pools: {
    drums: {
      pick: { min: 1, max: 2 },
      instruments: ['breakbeat', 'drums', 'snare drum', 'hi-hat'],
    },
    bass: {
      pick: { min: 1, max: 1 },
      instruments: ['slap bass', 'synth bass', 'sub-bass', 'TB-303'],
    },
    synth: {
      pick: { min: 1, max: 2 },
      instruments: ['TB-303', 'stabs', 'synth', 'arpeggiator'],
    },
    fx: {
      pick: { min: 0, max: 1 },
      chanceToInclude: 0.35,
      instruments: ['vocal chops', 'FX risers'],
    },
  },
  poolOrder: ['drums', 'bass', 'synth', 'fx'],
  maxTags: 5,
  exclusionRules: [
    ['slap bass', 'synth bass'],
    ['TB-303', 'stabs'],
  ],
  bpm: { min: 120, max: 140, typical: 130 },
  moods: ['Funky', 'Energetic', 'Groovy', 'Bouncy', 'Party', 'Raw', 'Rhythmic'],
};
