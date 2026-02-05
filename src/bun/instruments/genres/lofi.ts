import type { GenreDefinition } from '@bun/instruments/genres/types';

export const LOFI_GENRE: GenreDefinition = {
  name: 'Lo-fi',
  keywords: ['lofi', 'lo-fi', 'study beats', 'chillhop', 'lofi hip hop', 'lofi beats'],
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
      instruments: ['vibraphone', 'kalimba', 'guitar', 'cello', 'clarinet'],
    },
    movement: {
      pick: { min: 1, max: 1 },
      instruments: ['jazz brushes', 'shaker', 'percussion', 'drums'],
    },
  },
  poolOrder: ['harmonic', 'color', 'pad', 'movement'],
  maxTags: 4,
  exclusionRules: [
    ['felt piano', 'Rhodes'],
    ['Rhodes', 'electric piano'],
  ],
  bpm: { min: 70, max: 90, typical: 80 },
  moods: [
    'Chill',
    'Nostalgic',
    'Relaxed',
    'Cozy',
    'Mellow',
    'Warm',
    'Dreamy',
    'Laid Back',
    'Intimate',
  ],
};
