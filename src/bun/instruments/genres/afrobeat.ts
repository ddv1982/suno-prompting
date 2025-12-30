import type { GenreDefinition } from '@bun/instruments/genres/types';

export const AFROBEAT_GENRE: GenreDefinition = {
  name: 'Afrobeat',
  keywords: ['afrobeat', 'afrobeats', 'amapiano', 'afropop', 'afro house', 'african', 'nigerian', 'south african'],
  description: 'African rhythms with infectious grooves, polyrhythmic percussion, and vibrant melodies',
  pools: {
    harmonic: {
      pick: { min: 1, max: 2 },
      instruments: ['Rhodes', 'electric piano', 'synth', 'guitar', 'kora'],
    },
    pad: {
      pick: { min: 0, max: 1 },
      chanceToInclude: 0.4,
      instruments: ['synth pad', 'analog synth pads', 'log drums'],
    },
    color: {
      pick: { min: 1, max: 2 },
      instruments: ['talking drum', 'balafon', 'kalimba', 'shekere', 'saxophone', 'trumpet'],
    },
    movement: {
      pick: { min: 1, max: 2 },
      instruments: ['djembe', 'percussion', 'drums', 'congas', 'shaker', '808'],
    },
  },
  poolOrder: ['harmonic', 'color', 'pad', 'movement'],
  maxTags: 5,
  exclusionRules: [
    ['Rhodes', 'electric piano'],
    ['kalimba', 'balafon'],
    ['djembe', 'drums'],
  ],
  bpm: { min: 100, max: 130, typical: 115 },
  moods: ['Joyful', 'Celebratory', 'Danceable', 'Hypnotic', 'Uplifting', 'Groovy', 'Vibrant', 'Energetic'],
};
