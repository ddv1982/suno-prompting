import type { GenreDefinition } from './types';

export const RNB_GENRE: GenreDefinition = {
  name: 'R&B',
  keywords: ['rnb', 'r&b', 'soul', 'neo-soul', 'motown', 'funk', 'gospel'],
  description: 'Soulful, groove-oriented music with rich harmonies and expressive vocals',
  pools: {
    harmonic: {
      pick: { min: 1, max: 2 },
      instruments: ['Rhodes', 'Wurlitzer', 'felt piano'],
    },
    color: {
      pick: { min: 0, max: 1 },
      chanceToInclude: 0.5,
      instruments: ['saxophone', 'strings', 'trumpet'],
    },
    movement: {
      pick: { min: 1, max: 2 },
      instruments: ['bass', 'drums'],
    },
  },
  poolOrder: ['harmonic', 'color', 'movement'],
  maxTags: 4,
  exclusionRules: [
    ['Rhodes', 'Wurlitzer'],
    ['Rhodes', 'felt piano'],
  ],
};
