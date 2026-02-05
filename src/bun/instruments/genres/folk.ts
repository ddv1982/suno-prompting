import type { GenreDefinition } from '@bun/instruments/genres/types';

export const FOLK_GENRE: GenreDefinition = {
  name: 'Folk',
  keywords: ['folk', 'acoustic', 'singer-songwriter', 'celtic', 'traditional'],
  description: 'Organic, acoustic music rooted in traditional and storytelling traditions',
  pools: {
    harmonic: {
      pick: { min: 1, max: 2 },
      instruments: ['acoustic guitar', 'felt piano', 'autoharp', 'mountain dulcimer'],
    },
    color: {
      pick: { min: 1, max: 2 },
      instruments: ['violin', 'harp', 'flute', 'harmonica', 'accordion', 'clarinet', 'concertina'],
    },
    movement: {
      pick: { min: 0, max: 1 },
      chanceToInclude: 0.5,
      instruments: ['cajón', 'percussion', 'frame drum', 'washboard'],
    },
    rare: {
      pick: { min: 0, max: 1 },
      chanceToInclude: 0.3,
      instruments: ['mandolin', 'banjo', 'hurdy gurdy', 'jaw harp', 'nyckelharpa'],
    },
  },
  poolOrder: ['harmonic', 'color', 'movement', 'rare'],
  maxTags: 4,
  bpm: { min: 80, max: 120, typical: 100 },
  moods: [
    'Warm',
    'Intimate',
    'Nostalgic',
    'Heartfelt',
    'Earthy',
    'Rustic',
    'Tender',
    'Story Driven',
    'Cozy',
  ],
};
