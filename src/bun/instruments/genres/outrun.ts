import type { GenreDefinition } from '@bun/instruments/genres/types';

export const OUTRUN_GENRE: GenreDefinition = {
  name: 'Outrun',
  keywords: ['outrun', 'retrowave', 'new retro wave', '80s synth', 'miami night'],
  description: 'Nostalgic synthwave evoking 80s aesthetics with driving rhythms and neon vibes',
  pools: {
    synth: {
      pick: { min: 1, max: 2 },
      instruments: ['synth', 'analog synth pads', 'FM synth', 'arpeggiator'],
    },
    bass: {
      pick: { min: 1, max: 1 },
      instruments: ['synth bass', '808', 'analog synth'],
    },
    drums: {
      pick: { min: 1, max: 1 },
      instruments: ['Linn drum', 'drums', 'snare drum'],
    },
    fx: {
      pick: { min: 0, max: 1 },
      chanceToInclude: 0.3,
      instruments: ['saxophone', 'guitar', 'vocoder'],
    },
  },
  poolOrder: ['synth', 'bass', 'drums', 'fx'],
  maxTags: 4,
  exclusionRules: [
    ['synth', 'analog synth'],
    ['Linn drum', 'drums'],
  ],
  bpm: { min: 110, max: 130, typical: 120 },
  moods: ['Nostalgic', 'Driving', 'Neon', 'Retro', 'Energetic', 'Cool', 'Slick'],
};
