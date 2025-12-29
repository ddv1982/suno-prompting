import type { GenreDefinition } from '@bun/instruments/genres/types';

export const LATIN_GENRE: GenreDefinition = {
  name: 'Latin',
  keywords: [
    'latin', 'bossa nova', 'latin jazz', 'reggae', 'reggae fusion',
    'latin pop', 'salsa', 'tango', 'flamenco', 'afro-cuban',
  ],
  description: 'Rhythmic, groove-driven music with syncopated patterns, warm harmonies, and Latin percussion',
  pools: {
    harmonic: {
      pick: { min: 1, max: 2 },
      instruments: ['nylon string guitar', 'Rhodes', 'grand piano', 'acoustic guitar'],
    },
    color: {
      pick: { min: 0, max: 1 },
      chanceToInclude: 0.5,
      instruments: ['trumpet', 'saxophone', 'flute', 'bandoneon'],
    },
    movement: {
      pick: { min: 2, max: 3 },
      instruments: ['upright bass', 'bass', 'congas', 'bongos', 'timbales', 'claves', 'shaker'],
    },
    rare: {
      pick: { min: 0, max: 1 },
      chanceToInclude: 0.25,
      instruments: ['castanet', 'vibraphone'],
    },
  },
  poolOrder: ['harmonic', 'movement', 'color', 'rare'],
  maxTags: 5,
  exclusionRules: [
    ['bass', 'upright bass'],
    ['congas', 'bongos'],
    ['nylon string guitar', 'acoustic guitar'],
  ],
  bpm: { min: 80, max: 140, typical: 98 },
  moods: ['Groovy', 'Romantic', 'Sunny', 'Playful', 'Passionate', 'Rhythmic', 'Sensual', 'Laid Back', 'Breezy'],
};
