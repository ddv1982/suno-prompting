import type { GenreDefinition } from '@bun/instruments/genres/types';

export const SYMPHONIC_GENRE: GenreDefinition = {
  name: 'Symphonic',
  keywords: [
    'symphonic', 'symphonic metal', 'symphonic rock',
    'orchestral metal', 'orchestral rock', 'epic metal',
  ],
  description: 'Powerful blend of rock/metal with full orchestral arrangements, choirs, and dramatic compositions',
  pools: {
    harmonic: {
      pick: { min: 1, max: 2 },
      instruments: ['distorted guitar', 'guitar', 'grand piano', 'strings'],
    },
    orchestral: {
      pick: { min: 1, max: 2 },
      instruments: ['choir', 'french horn', 'low brass', 'tuba', 'trombone', 'violin', 'cello', 'orchestra'],
    },
    movement: {
      pick: { min: 2, max: 2 },
      instruments: ['bass', 'drums', 'timpani', 'kick drum', 'orchestral bass drum'],
    },
    rare: {
      pick: { min: 0, max: 1 },
      chanceToInclude: 0.3,
      instruments: ['harp', 'celesta', 'braams', 'wordless choir', 'solo soprano', 'tam tam', 'crash cymbal'],
    },
  },
  poolOrder: ['harmonic', 'orchestral', 'movement', 'rare'],
  maxTags: 5,
  exclusionRules: [
    ['distorted guitar', 'guitar'],
    ['choir', 'wordless choir'],
    ['french horn', 'low brass'],
  ],
  bpm: { min: 100, max: 160, typical: 130 },
  moods: ['Epic', 'Powerful', 'Majestic', 'Dramatic', 'Soaring', 'Triumphant', 'Intense', 'Grand', 'Dark'],
};
