import type { GenreDefinition } from '@bun/instruments/genres/types';

export const RNB_GENRE: GenreDefinition = {
  name: 'R&B',
  keywords: ['rnb', 'r&b', 'neo-soul', 'contemporary r&b', 'quiet storm'],
  description: 'Soulful, groove-oriented music with rich harmonies and expressive vocals',
  pools: {
    harmonic: {
      pick: { min: 1, max: 2 },
      instruments: ['Rhodes', 'Wurlitzer', 'electric piano', 'grand piano', 'Clavinet'],
    },
    color: {
      pick: { min: 0, max: 1 },
      chanceToInclude: 0.5,
      instruments: ['saxophone', 'strings', 'guitar', 'wah guitar'],
    },
    movement: {
      pick: { min: 1, max: 2 },
      instruments: ['bass', 'drums', '808', 'trap hi hats', 'slap bass'],
    },
    rare: {
      pick: { min: 0, max: 1 },
      chanceToInclude: 0.2,
      instruments: ['handclaps', 'shaker'],
    },
  },
  poolOrder: ['harmonic', 'color', 'movement', 'rare'],
  maxTags: 4,
  exclusionRules: [
    ['Rhodes', 'Wurlitzer'],
    ['Rhodes', 'electric piano'],
    ['bass', 'slap bass'],
    ['drums', '808'],
  ],
  bpm: { min: 70, max: 100, typical: 88 },
  moods: ['Smooth', 'Intimate', 'Groovy', 'Sensual', 'Late Night', 'Soulful', 'Romantic', 'Confident', 'Warm'],
};
