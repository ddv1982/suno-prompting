import type { GenreDefinition } from '@bun/instruments/genres/types';

export const VIDEOGAME_GENRE: GenreDefinition = {
  name: 'Video Game',
  keywords: [
    'video game', 'game music', 'gaming', 'chiptune', '8-bit', '8 bit',
    'retro game', 'pixel', 'arcade', 'boss battle', 'level music',
    'rpg', 'jrpg', 'adventure game', 'platformer', 'nintendo', 'sega',
  ],
  description: 'Dynamic, immersive music blending orchestral, electronic, and retro elements for interactive experiences',
  pools: {
    harmonic: {
      pick: { min: 1, max: 2 },
      instruments: ['strings', 'felt piano', 'harp'],
    },
    pad: {
      pick: { min: 1, max: 2 },
      instruments: ['synth pad', 'arpeggiator', 'FM synth', 'analog synth', 'synth strings'],
    },
    color: {
      pick: { min: 1, max: 2 },
      instruments: ['bells', 'glockenspiel', 'celesta', 'choir', 'french horn', 'trumpet'],
    },
    movement: {
      pick: { min: 1, max: 1 },
      instruments: ['drums', 'percussion', 'taiko drums', 'timpani'],
    },
    rare: {
      pick: { min: 0, max: 1 },
      chanceToInclude: 0.25,
      instruments: ['808', 'guitar', 'vocoder'],
    },
  },
  poolOrder: ['harmonic', 'pad', 'color', 'movement', 'rare'],
  maxTags: 5,
  exclusionRules: [
    ['synth strings', 'strings'],
    ['bells', 'glockenspiel'],
    ['taiko drums', 'timpani'],
  ],
  bpm: { min: 100, max: 160, typical: 130 },
  moods: ['Adventurous', 'Heroic', 'Exciting', 'Mysterious', 'Energetic', 'Triumphant', 'Whimsical', 'Intense', 'Nostalgic'],
};
