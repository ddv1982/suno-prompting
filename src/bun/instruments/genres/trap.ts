import type { GenreDefinition } from '@bun/instruments/genres/types';

export const TRAP_GENRE: GenreDefinition = {
  name: 'Trap',
  keywords: [
    'trap', 'dark trap', 'emo rap', 'cloud rap', 'cinematic trap',
    'trap soul', 'melodic trap', 'drill', 'phonk',
  ],
  description: 'Heavy bass-driven music with rolling hi-hats, 808s, and atmospheric dark textures',
  pools: {
    harmonic: {
      pick: { min: 1, max: 2 },
      instruments: ['felt piano', 'guitar', 'pluck synth', 'strings'],
    },
    pad: {
      pick: { min: 0, max: 1 },
      chanceToInclude: 0.5,
      instruments: ['synth pad', 'ambient pad', 'choir', 'vinyl noise'],
    },
    movement: {
      pick: { min: 2, max: 3 },
      instruments: ['808', 'trap hi hats', 'kick drum', 'snare drum'],
    },
    rare: {
      pick: { min: 0, max: 1 },
      chanceToInclude: 0.3,
      instruments: ['pizzicato strings', 'braams', 'FX risers'],
    },
  },
  poolOrder: ['harmonic', 'movement', 'pad', 'rare'],
  maxTags: 4,
  exclusionRules: [
    ['strings', 'pizzicato strings'],
    ['synth pad', 'ambient pad'],
  ],
  bpm: { min: 65, max: 85, typical: 70 },
  moods: ['Dark', 'Heavy', 'Menacing', 'Brooding', 'Ominous', 'Hard', 'Emotional', 'Moody', 'Aggressive'],
};
