import type { GenreDefinition } from '@bun/instruments/genres/types';

export const BOSSANOVA_GENRE: GenreDefinition = {
  name: 'Bossa Nova',
  keywords: ['bossa nova', 'brazilian jazz', 'mpb', 'tropicalia', 'brazilian'],
  description: 'Smooth Brazilian jazz with gentle rhythms, intimate vocals, and sophisticated harmonies',
  pools: {
    guitar: {
      pick: { min: 1, max: 1 },
      instruments: ['nylon string guitar', 'acoustic guitar'],
    },
    harmonic: {
      pick: { min: 1, max: 1 },
      instruments: ['felt piano', 'Rhodes', 'vibraphone', 'flute'],
    },
    rhythm: {
      pick: { min: 1, max: 2 },
      instruments: ['jazz brushes', 'shaker', 'bass', 'pandeiro'],
    },
    rare: {
      pick: { min: 0, max: 1 },
      chanceToInclude: 0.25,
      instruments: ['saxophone', 'trumpet', 'strings', 'cello'],
    },
  },
  poolOrder: ['guitar', 'harmonic', 'rhythm', 'rare'],
  maxTags: 4,
  exclusionRules: [
    ['nylon string guitar', 'acoustic guitar'],
    ['felt piano', 'Rhodes'],
    ['shaker', 'pandeiro'],
  ],
  bpm: { min: 70, max: 100, typical: 85 },
  moods: ['Smooth', 'Relaxed', 'Romantic', 'Intimate', 'Breezy', 'Sophisticated', 'Warm'],
};
