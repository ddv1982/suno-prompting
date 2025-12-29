import type { GenreDefinition } from '@bun/instruments/genres/types';

export const JAZZ_GENRE: GenreDefinition = {
  name: 'Jazz',
  keywords: ['jazz', 'bebop', 'swing', 'cool jazz', 'fusion', 'big band', 'smooth jazz'],
  description: 'Sophisticated, improvisational music with complex harmonies and swing feel',
  pools: {
    harmonic: {
      pick: { min: 1, max: 1 },
      instruments: ['Rhodes', 'grand piano', 'hollowbody guitar', 'Hammond organ', 'Wurlitzer'],
    },
    color: {
      pick: { min: 1, max: 2 },
      instruments: ['saxophone', 'tenor sax', 'trumpet', 'muted trumpet', 'trombone', 'vibraphone', 'clarinet', 'flute'],
    },
    movement: {
      pick: { min: 1, max: 2 },
      instruments: ['upright bass', 'walking bass', 'jazz brushes', 'drums', 'ride cymbal'],
    },
    rare: {
      pick: { min: 0, max: 1 },
      chanceToInclude: 0.2,
      instruments: ['congas', 'bongos'],
    },
  },
  poolOrder: ['harmonic', 'color', 'movement', 'rare'],
  maxTags: 4,
  exclusionRules: [
    ['Rhodes', 'grand piano'],
    ['Rhodes', 'Wurlitzer'],
    ['grand piano', 'Wurlitzer'],
    ['Rhodes', 'Hammond organ'],
    ['grand piano', 'Hammond organ'],
    ['Wurlitzer', 'Hammond organ'],
    ['upright bass', 'walking bass'],
    ['saxophone', 'tenor sax'],
    ['trumpet', 'muted trumpet'],
  ],
  bpm: { min: 72, max: 140, typical: 96 },
  moods: ['Smooth', 'Warm', 'Sophisticated', 'Intimate', 'Late Night', 'Elegant', 'Groovy', 'Laid Back', 'Cool'],
};
