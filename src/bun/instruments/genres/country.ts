import type { GenreDefinition } from '@bun/instruments/genres/types';

export const COUNTRY_GENRE: GenreDefinition = {
  name: 'Country',
  keywords: [
    'country',
    'country rock',
    'country pop',
    'americana',
    'bluegrass',
    'country gospel',
    'honky tonk',
    'outlaw country',
    'nashville',
  ],
  description:
    'Authentic American roots music with twangy guitars, storytelling vocals, and heartland themes',
  pools: {
    harmonic: {
      pick: { min: 1, max: 2 },
      instruments: ['acoustic guitar', 'Telecaster', 'grand piano', 'dobro', 'lap steel guitar'],
    },
    color: {
      pick: { min: 1, max: 2 },
      instruments: ['pedal steel', 'fiddle', 'harmonica', 'mandolin', 'banjo', 'autoharp'],
    },
    movement: {
      pick: { min: 1, max: 2 },
      instruments: ['bass', 'drums', 'upright bass'],
    },
    rare: {
      pick: { min: 0, max: 1 },
      chanceToInclude: 0.25,
      instruments: ['Hammond organ', 'accordion', 'washboard', 'mountain dulcimer'],
    },
  },
  poolOrder: ['harmonic', 'color', 'movement', 'rare'],
  maxTags: 4,
  exclusionRules: [
    ['bass', 'upright bass'],
    ['fiddle', 'mandolin'],
    ['dobro', 'lap steel guitar'],
    ['pedal steel', 'lap steel guitar'],
  ],
  bpm: { min: 90, max: 140, typical: 110 },
  moods: [
    'Heartfelt',
    'Nostalgic',
    'Honest',
    'Hopeful',
    'Uplifting',
    'Story Driven',
    'Warm',
    'Confident',
    'Bittersweet',
  ],
};
