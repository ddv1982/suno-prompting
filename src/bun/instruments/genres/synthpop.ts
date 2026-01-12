import type { GenreDefinition } from '@bun/instruments/genres/types';

export const SYNTHPOP_GENRE: GenreDefinition = {
  name: 'Synthpop',
  keywords: ['synthpop', 'synth pop', 'electropop', 'new wave', '80s pop'],
  description: 'Catchy, upbeat pop music driven by synthesizers with memorable hooks and melodies',
  pools: {
    synth: {
      pick: { min: 1, max: 2 },
      instruments: ['synth', 'pluck synth', 'arpeggiator', 'analog synth'],
    },
    pad: {
      pick: { min: 1, max: 1 },
      instruments: ['synth pad', 'analog synth pads', 'synth strings', 'synth choir'],
    },
    rhythm: {
      pick: { min: 1, max: 2 },
      instruments: ['drums', 'synth bass', 'TR-909', 'kick drum'],
    },
    rare: {
      pick: { min: 0, max: 1 },
      chanceToInclude: 0.25,
      instruments: ['guitar', 'vocoder', 'saxophone', 'strings'],
    },
  },
  poolOrder: ['synth', 'pad', 'rhythm', 'rare'],
  maxTags: 4,
  exclusionRules: [
    ['synth', 'analog synth'],
    ['synth pad', 'analog synth pads'],
    ['drums', 'TR-909'],
  ],
  bpm: { min: 110, max: 130, typical: 120 },
  moods: ['Catchy', 'Upbeat', 'Polished', 'Nostalgic', 'Fun', 'Melodic', 'Danceable'],
};
