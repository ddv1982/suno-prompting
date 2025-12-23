import type { GenreDefinition } from '@bun/instruments/genres/types';

export const LOFI_GENRE: GenreDefinition = {
  name: 'Lo-fi',
  keywords: ['lofi', 'lo-fi', 'chill', 'study beats', 'chillhop', 'bedroom pop'],
  description: 'Relaxed, nostalgic music with warm textures and mellow beats',
  pools: {
    harmonic: {
      pick: { min: 1, max: 1 },
      instruments: ['felt piano', 'Rhodes', 'electric piano'],
    },
    pad: {
      pick: { min: 0, max: 1 },
      chanceToInclude: 0.5,
      instruments: ['synth pad', 'ambient pad'],
    },
    color: {
      pick: { min: 1, max: 1 },
      instruments: ['vibraphone', 'kalimba', 'guitar'],
    },
    movement: {
      pick: { min: 1, max: 1 },
      instruments: ['jazz brushes', 'shaker', 'drums'],
    },
  },
  poolOrder: ['harmonic', 'color', 'pad', 'movement'],
  maxTags: 4,
  exclusionRules: [
    ['felt piano', 'Rhodes'],
    ['Rhodes', 'electric piano'],
  ],
};
