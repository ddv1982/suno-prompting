import type { GenreDefinition } from '@bun/instruments/genres/types';

export const JAZZ_GENRE: GenreDefinition = {
  name: 'Jazz',
  keywords: ['jazz', 'bebop', 'swing', 'cool jazz', 'fusion', 'big band', 'bossa nova'],
  description: 'Sophisticated, improvisational music with complex harmonies and swing feel',
  pools: {
    harmonic: {
      pick: { min: 1, max: 1 },
      instruments: ['Rhodes', 'felt piano', 'acoustic guitar', 'Hammond organ', 'Wurlitzer'],
    },
    color: {
      pick: { min: 1, max: 2 },
      instruments: ['saxophone', 'trumpet', 'trombone', 'vibraphone', 'clarinet', 'flute'],
    },
    movement: {
      pick: { min: 1, max: 2 },
      instruments: ['upright bass', 'jazz brushes', 'drums', 'congas', 'bongos', 'timbales'],
    },
  },
  poolOrder: ['harmonic', 'color', 'movement'],
  maxTags: 4,
  exclusionRules: [
    ['Rhodes', 'felt piano'],
    ['Rhodes', 'Wurlitzer'],
    ['felt piano', 'Wurlitzer'],
    ['Rhodes', 'Hammond organ'],
    ['felt piano', 'Hammond organ'],
    ['Wurlitzer', 'Hammond organ'],
  ],
};
