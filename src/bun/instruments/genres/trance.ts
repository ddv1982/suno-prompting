import type { GenreDefinition } from '@bun/instruments/genres/types';

export const TRANCE_GENRE: GenreDefinition = {
  name: 'Trance',
  keywords: ['trance', 'psytrance', 'progressive trance', 'uplifting trance', 'vocal trance', 'goa', 'eurodance'],
  description: 'Euphoric electronic music with hypnotic builds, soaring melodies, and transcendent energy',
  pools: {
    pad: {
      pick: { min: 1, max: 2 },
      instruments: ['supersaw', 'arpeggiator', 'synth pad', 'analog synth', 'pluck synth'],
    },
    harmonic: {
      pick: { min: 0, max: 1 },
      chanceToInclude: 0.5,
      instruments: ['grand piano', 'strings', 'synth strings'],
    },
    color: {
      pick: { min: 0, max: 1 },
      chanceToInclude: 0.4,
      instruments: ['choir', 'wordless choir', 'solo soprano', 'synth choir'],
    },
    movement: {
      pick: { min: 1, max: 2 },
      instruments: ['kick drum', 'hi-hat', '808', 'synth bass'],
    },
    rare: {
      pick: { min: 0, max: 1 },
      chanceToInclude: 0.2,
      instruments: ['FX risers', 'impacts'],
    },
  },
  poolOrder: ['pad', 'harmonic', 'color', 'movement', 'rare'],
  maxTags: 4,
  exclusionRules: [
    ['supersaw', 'pluck synth'],
    ['choir', 'wordless choir'],
  ],
  bpm: { min: 130, max: 150, typical: 138 },
  moods: ['Euphoric', 'Hypnotic', 'Uplifting', 'Energetic', 'Transcendent', 'Epic', 'Driving', 'Emotional'],
};
