import type { GenreDefinition } from '@bun/instruments/genres/types';

export const BLUES_GENRE: GenreDefinition = {
  name: 'Blues',
  keywords: [
    'blues', 'electric blues', 'blues rock', 'delta blues', 'chicago blues',
    'jazz blues', 'slow blues', 'blues shuffle', 'psychedelic blues',
  ],
  description: 'Expressive, soulful music built on 12-bar structures with bending guitar lines and heartfelt vocals',
  pools: {
    harmonic: {
      pick: { min: 1, max: 2 },
      instruments: ['hollowbody guitar', 'guitar', 'grand piano', 'slide guitar'],
    },
    color: {
      pick: { min: 0, max: 1 },
      chanceToInclude: 0.6,
      instruments: ['Hammond organ', 'harmonica', 'saxophone', 'wah guitar'],
    },
    movement: {
      pick: { min: 1, max: 2 },
      instruments: ['bass', 'drums', 'upright bass', 'walking bass'],
    },
  },
  poolOrder: ['harmonic', 'color', 'movement'],
  maxTags: 4,
  exclusionRules: [
    ['bass', 'upright bass'],
    ['bass', 'walking bass'],
    ['upright bass', 'walking bass'],
    ['guitar', 'hollowbody guitar'],
  ],
  bpm: { min: 68, max: 132, typical: 88 },
  moods: ['Smoky', 'Soulful', 'Gritty', 'Emotional', 'Laid Back', 'Mournful', 'Raw', 'Hypnotic', 'Groovy'],
};
