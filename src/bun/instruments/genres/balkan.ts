import type { GenreDefinition } from '@bun/instruments/genres/types';

export const BALKAN_GENRE: GenreDefinition = {
  name: 'Balkan',
  keywords: ['balkan', 'balkan beats', 'balkan brass', 'gypsy', 'klezmer', 'romani'],
  description: 'Energetic Eastern European music with brass bands, folk melodies, and driving rhythms',
  pools: {
    brass: {
      pick: { min: 1, max: 2 },
      instruments: ['trumpet', 'trombone', 'tuba', 'clarinet', 'saxophone'],
    },
    strings: {
      pick: { min: 1, max: 1 },
      instruments: ['violin', 'accordion', 'guitar', 'bass', 'bouzouki'],
    },
    percussion: {
      pick: { min: 1, max: 1 },
      instruments: ['drums', 'doumbek', 'tambourine', 'percussion'],
    },
    rare: {
      pick: { min: 0, max: 1 },
      chanceToInclude: 0.2,
      instruments: ['hammered dulcimer', 'violin'],
    },
  },
  poolOrder: ['brass', 'strings', 'percussion', 'rare'],
  maxTags: 4,
  exclusionRules: [
    ['trumpet', 'saxophone'],
    ['violin', 'accordion'],
  ],
  bpm: { min: 120, max: 160, typical: 140 },
  moods: ['Energetic', 'Folk', 'Festive', 'Wild', 'Exuberant', 'Celebratory', 'Spirited'],
};
