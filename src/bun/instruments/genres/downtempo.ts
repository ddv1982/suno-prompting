import type { GenreDefinition } from '@bun/instruments/genres/types';

export const DOWNTEMPO_GENRE: GenreDefinition = {
  name: 'Downtempo',
  keywords: ['downtempo', 'trip hop', 'trip-hop', 'triphop', 'chillout', 'chill out', 'slow electronic'],
  description: 'Relaxed electronic music with mid-tempo beats, atmospheric textures, and introspective moods',
  pools: {
    pad: {
      pick: { min: 1, max: 2 },
      instruments: ['synth pad', 'ambient pad', 'analog synth pads', 'shimmer pad', 'granular synth'],
    },
    harmonic: {
      pick: { min: 1, max: 1 },
      instruments: ['Rhodes', 'electric piano', 'felt piano', 'vibraphone'],
    },
    color: {
      pick: { min: 0, max: 1 },
      chanceToInclude: 0.5,
      instruments: ['saxophone', 'trumpet', 'flute', 'wordless choir', 'strings'],
    },
    movement: {
      pick: { min: 1, max: 2 },
      instruments: ['drums', 'hi-hat', 'percussion', 'bass', 'synth bass', 'shaker'],
    },
    rare: {
      pick: { min: 0, max: 1 },
      chanceToInclude: 0.3,
      instruments: ['vinyl noise', 'tape loops'],
    },
  },
  poolOrder: ['pad', 'harmonic', 'color', 'movement', 'rare'],
  maxTags: 4,
  exclusionRules: [
    ['Rhodes', 'electric piano'],
    ['bass', 'synth bass'],
  ],
  bpm: { min: 70, max: 100, typical: 85 },
  moods: ['Mellow', 'Introspective', 'Atmospheric', 'Laid Back', 'Contemplative', 'Smooth', 'Nocturnal', 'Groovy'],
};
