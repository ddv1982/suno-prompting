import type { GenreDefinition } from '@bun/instruments/genres/types';

export const INDIE_GENRE: GenreDefinition = {
  name: 'Indie',
  keywords: ['indie', 'indie rock', 'indie pop', 'alt rock', 'alternative pop', 'bedroom indie'],
  description:
    'Independent-spirited rock and pop with authentic instrumentation and emotional depth',
  pools: {
    harmonic: {
      pick: { min: 1, max: 2 },
      instruments: ['guitar', 'acoustic guitar', 'felt piano', 'grand piano', 'synth'],
    },
    pad: {
      pick: { min: 0, max: 1 },
      chanceToInclude: 0.4,
      instruments: ['synth pad', 'synth strings', 'ambient pad'],
    },
    color: {
      pick: { min: 0, max: 1 },
      chanceToInclude: 0.5,
      instruments: ['strings', 'glockenspiel', 'bells', 'trumpet', 'saxophone'],
    },
    movement: {
      pick: { min: 1, max: 2 },
      instruments: ['drums', 'bass', 'hi-hat', 'tambourine', 'shaker'],
    },
  },
  poolOrder: ['harmonic', 'pad', 'color', 'movement'],
  maxTags: 4,
  exclusionRules: [
    ['guitar', 'acoustic guitar'],
    ['felt piano', 'grand piano'],
  ],
  bpm: { min: 100, max: 140, typical: 120 },
  moods: [
    'Authentic',
    'Emotional',
    'Melancholic',
    'Uplifting',
    'Nostalgic',
    'Heartfelt',
    'Introspective',
    'Energetic',
  ],
};
