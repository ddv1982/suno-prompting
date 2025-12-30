import type { GenreDefinition } from '@bun/instruments/genres/types';

export const DREAMPOP_GENRE: GenreDefinition = {
  name: 'Dream Pop',
  keywords: ['dream pop', 'dreampop', 'shoegaze', 'ethereal', 'dreamy', 'hazy'],
  description: 'Ethereal, atmospheric rock with lush textures, reverb-drenched guitars, and dreamy vocals',
  pools: {
    harmonic: {
      pick: { min: 1, max: 2 },
      instruments: ['guitar', 'tremolo guitar', 'synth', 'felt piano'],
    },
    pad: {
      pick: { min: 1, max: 2 },
      instruments: ['synth pad', 'shimmer pad', 'ambient pad', 'synth strings'],
    },
    color: {
      pick: { min: 0, max: 1 },
      chanceToInclude: 0.4,
      instruments: ['wordless choir', 'strings', 'glockenspiel', 'bells'],
    },
    movement: {
      pick: { min: 1, max: 2 },
      instruments: ['drums', 'bass', 'hi-hat', 'shaker', 'tambourine'],
    },
  },
  poolOrder: ['pad', 'harmonic', 'color', 'movement'],
  maxTags: 4,
  exclusionRules: [
    ['guitar', 'tremolo guitar'],
  ],
  bpm: { min: 80, max: 120, typical: 100 },
  moods: ['Dreamy', 'Ethereal', 'Hazy', 'Nostalgic', 'Melancholic', 'Atmospheric', 'Lush', 'Wistful'],
};
