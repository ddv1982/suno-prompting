import type { GenreDefinition } from '@bun/instruments/genres/types';

export const SOUL_GENRE: GenreDefinition = {
  name: 'Soul',
  keywords: [
    'soul', 'motown', '60s soul', 'modern soul', 'gospel soul',
    'northern soul', 'southern soul', 'classic soul', 'quiet storm',
  ],
  description: 'Emotional, vocally-driven music with rich harmonies, gospel influences, and deep grooves',
  pools: {
    harmonic: {
      pick: { min: 1, max: 2 },
      instruments: ['Rhodes', 'grand piano', 'Hammond organ', 'Wurlitzer'],
    },
    color: {
      pick: { min: 1, max: 2 },
      instruments: ['strings', 'trumpet', 'saxophone', 'low brass'],
    },
    movement: {
      pick: { min: 1, max: 2 },
      instruments: ['bass', 'drums', 'tambourine', 'handclaps'],
    },
    rare: {
      pick: { min: 0, max: 1 },
      chanceToInclude: 0.3,
      instruments: ['vibraphone', 'guitar'],
    },
  },
  poolOrder: ['harmonic', 'color', 'movement', 'rare'],
  maxTags: 4,
  exclusionRules: [
    ['Rhodes', 'Wurlitzer'],
    ['Rhodes', 'grand piano'],
    ['trumpet', 'low brass'],
  ],
  bpm: { min: 80, max: 110, typical: 96 },
  moods: ['Soulful', 'Emotional', 'Heartfelt', 'Warm', 'Passionate', 'Uplifting', 'Powerful', 'Groovy', 'Joyful'],
};
