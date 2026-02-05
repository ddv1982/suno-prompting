import type { GenreDefinition } from '@bun/instruments/genres/types';

export const RETRO_GENRE: GenreDefinition = {
  name: 'Retro',
  keywords: [
    'retro',
    '50s',
    '60s',
    'rock and roll',
    'doo-wop',
    'rockabilly',
    'garage rock',
    'surf rock',
    'british invasion',
    'oldies',
  ],
  description:
    'Classic vintage sounds from the 50s and 60s with jangly guitars, upright bass, and timeless grooves',
  pools: {
    harmonic: {
      pick: { min: 1, max: 2 },
      instruments: ['guitar', 'tremolo guitar', 'grand piano', 'honky tonk piano'],
    },
    color: {
      pick: { min: 0, max: 1 },
      chanceToInclude: 0.5,
      instruments: ['organ', 'saxophone', 'harmonica'],
    },
    movement: {
      pick: { min: 2, max: 2 },
      instruments: ['upright bass', 'slap bass', 'drums', 'tambourine', 'handclaps'],
    },
    rare: {
      pick: { min: 0, max: 1 },
      chanceToInclude: 0.3,
      instruments: ['finger snaps', 'bells'],
    },
  },
  poolOrder: ['harmonic', 'movement', 'color', 'rare'],
  maxTags: 4,
  exclusionRules: [
    ['upright bass', 'slap bass'],
    ['grand piano', 'honky tonk piano'],
    ['guitar', 'tremolo guitar'],
  ],
  bpm: { min: 100, max: 160, typical: 140 },
  moods: [
    'Nostalgic',
    'Fun',
    'Energetic',
    'Playful',
    'Romantic',
    'Danceable',
    'Carefree',
    'Sunny',
    'Charming',
  ],
};
