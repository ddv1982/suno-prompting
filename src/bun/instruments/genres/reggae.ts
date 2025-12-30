import type { GenreDefinition } from '@bun/instruments/genres/types';

export const REGGAE_GENRE: GenreDefinition = {
  name: 'Reggae',
  keywords: ['reggae', 'roots reggae', 'dancehall', 'ska', 'rocksteady', 'jamaican', 'dub music', 'dub reggae'],
  description: 'Jamaican music with offbeat rhythms, heavy bass, and dub production textures',
  pools: {
    harmonic: {
      pick: { min: 1, max: 1 },
      instruments: ['organ', 'electric piano', 'Rhodes', 'melodica'],
    },
    color: {
      pick: { min: 1, max: 2 },
      instruments: ['guitar', 'bass', 'trumpet', 'trombone', 'saxophone'],
    },
    movement: {
      pick: { min: 1, max: 2 },
      instruments: ['drums', 'nyabinghi drums', 'hi-hat', 'percussion'],
    },
    texture: {
      pick: { min: 0, max: 1 },
      chanceToInclude: 0.4,
      instruments: ['spring reverb', 'tape delay', 'dub siren'],
    },
  },
  poolOrder: ['harmonic', 'color', 'movement', 'texture'],
  maxTags: 4,
  exclusionRules: [
    ['organ', 'Rhodes'],
    ['drums', 'nyabinghi drums'],
  ],
  bpm: { min: 60, max: 90, typical: 75 },
  moods: ['Laid Back', 'Sunny', 'Groovy', 'Spiritual', 'Relaxed', 'Warm', 'Rootsy', 'Positive'],
};
