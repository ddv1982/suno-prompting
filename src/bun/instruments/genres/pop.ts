import type { GenreDefinition } from '@bun/instruments/genres/types';

export const POP_GENRE: GenreDefinition = {
  name: 'Pop',
  keywords: ['pop', 'mainstream', 'top 40', 'dance pop', 'synth pop', 'electropop', 'future bass'],
  description: 'Catchy, accessible music with memorable melodies and polished production',
  pools: {
    harmonic: {
      pick: { min: 1, max: 1 },
      instruments: [
        'felt piano',
        'Fender Stratocaster',
        'guitar',
        'acoustic guitar',
        'grand piano',
      ],
    },
    pad: {
      pick: { min: 1, max: 1 },
      instruments: [
        'synth pad',
        'synth',
        'analog synth',
        'digital synth',
        'arpeggiator',
        'synth piano',
        'supersaw',
        'pluck synth',
        'synth choir',
      ],
    },
    movement: {
      pick: { min: 1, max: 2 },
      instruments: ['bass', 'drums', '808', 'handclaps', 'kick drum'],
    },
    rare: {
      pick: { min: 0, max: 1 },
      chanceToInclude: 0.25,
      instruments: ['FX risers', 'strings'],
    },
  },
  poolOrder: ['harmonic', 'pad', 'movement', 'rare'],
  maxTags: 4,
  exclusionRules: [['808', 'drums']],
  bpm: { min: 100, max: 130, typical: 118 },
  moods: [
    'Energetic',
    'Uplifting',
    'Catchy',
    'Bright',
    'Fun',
    'Confident',
    'Romantic',
    'Playful',
    'Anthemic',
  ],
};
