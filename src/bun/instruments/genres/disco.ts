import type { GenreDefinition } from '@bun/instruments/genres/types';

export const DISCO_GENRE: GenreDefinition = {
  name: 'Disco',
  keywords: ['disco', 'nu-disco', 'nu disco', 'boogie', 'funky house', 'disco house', 'studio 54'],
  description: 'Dance music with four-on-the-floor beats, lush strings, and infectious grooves',
  pools: {
    harmonic: {
      pick: { min: 1, max: 2 },
      instruments: ['Rhodes', 'Wurlitzer', 'strings', 'Clavinet'],
    },
    pad: {
      pick: { min: 0, max: 1 },
      chanceToInclude: 0.4,
      instruments: ['synth strings', 'analog synth pads', 'synth pad'],
    },
    color: {
      pick: { min: 1, max: 2 },
      instruments: ['slap bass', 'wah guitar', 'low brass', 'trumpet', 'saxophone', 'flute'],
    },
    movement: {
      pick: { min: 1, max: 2 },
      instruments: ['kick drum', 'hi-hat', 'drums', 'tambourine', 'handclaps', 'congas'],
    },
    rare: {
      pick: { min: 0, max: 1 },
      chanceToInclude: 0.2,
      instruments: ['orchestra hit'],
    },
  },
  poolOrder: ['harmonic', 'color', 'pad', 'movement', 'rare'],
  maxTags: 4,
  exclusionRules: [
    ['Rhodes', 'Wurlitzer'],
    ['slap bass', 'bass'],
  ],
  bpm: { min: 110, max: 130, typical: 120 },
  moods: [
    'Groovy',
    'Funky',
    'Euphoric',
    'Danceable',
    'Uplifting',
    'Retro',
    'Celebratory',
    'Feel-good',
  ],
};
