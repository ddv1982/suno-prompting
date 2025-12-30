import type { GenreDefinition } from '@bun/instruments/genres/types';

export const HOUSE_GENRE: GenreDefinition = {
  name: 'House',
  keywords: ['house', 'deep house', 'tech house', 'progressive house', 'chicago house', 'garage', 'uk garage'],
  description: 'Four-on-the-floor dance music with soulful vocals, warm pads, and driving rhythms',
  pools: {
    harmonic: {
      pick: { min: 1, max: 1 },
      instruments: ['Rhodes', 'electric piano', 'grand piano', 'organ'],
    },
    pad: {
      pick: { min: 1, max: 2 },
      instruments: ['synth pad', 'analog synth pads', 'sidechain pad', 'synth strings'],
    },
    color: {
      pick: { min: 0, max: 1 },
      chanceToInclude: 0.5,
      instruments: ['synth bass', 'bass', 'saxophone', 'choir'],
    },
    movement: {
      pick: { min: 1, max: 2 },
      instruments: ['kick drum', 'hi-hat', '808', 'TR-909', 'handclaps', 'shaker', 'percussion', 'cowbell'],
    },
  },
  poolOrder: ['pad', 'harmonic', 'color', 'movement'],
  maxTags: 4,
  exclusionRules: [
    ['Rhodes', 'grand piano'],
    ['synth bass', 'bass'],
    ['808', 'kick drum'],
  ],
  bpm: { min: 120, max: 130, typical: 124 },
  moods: ['Groovy', 'Uplifting', 'Soulful', 'Deep', 'Euphoric', 'Hypnotic', 'Warm', 'Underground'],
};
