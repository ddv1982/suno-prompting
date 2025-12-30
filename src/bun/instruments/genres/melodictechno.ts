import type { GenreDefinition } from '@bun/instruments/genres/types';

export const MELODICTECHNO_GENRE: GenreDefinition = {
  name: 'Melodic Techno',
  keywords: ['melodic techno', 'techno', 'progressive techno', 'afterhours', 'peak time'],
  description: 'Hypnotic electronic music with driving beats, evolving synths, and emotional melodies',
  pools: {
    pad: {
      pick: { min: 1, max: 2 },
      instruments: ['synth pad', 'analog synth', 'arpeggiator', 'pluck synth', 'wavetable synth'],
    },
    harmonic: {
      pick: { min: 0, max: 1 },
      chanceToInclude: 0.5,
      instruments: ['grand piano', 'strings', 'synth strings'],
    },
    color: {
      pick: { min: 0, max: 1 },
      chanceToInclude: 0.3,
      instruments: ['wordless choir', 'solo soprano', 'breathy EWI'],
    },
    movement: {
      pick: { min: 1, max: 2 },
      instruments: ['kick drum', 'hi-hat', 'synth bass', 'percussion', 'ride cymbal'],
    },
    rare: {
      pick: { min: 0, max: 1 },
      chanceToInclude: 0.3,
      instruments: ['FX risers', 'impacts', 'drone'],
    },
  },
  poolOrder: ['pad', 'harmonic', 'color', 'movement', 'rare'],
  maxTags: 4,
  exclusionRules: [],
  bpm: { min: 122, max: 135, typical: 128 },
  moods: ['Hypnotic', 'Driving', 'Emotional', 'Dark', 'Uplifting', 'Atmospheric', 'Euphoric', 'Introspective'],
};
