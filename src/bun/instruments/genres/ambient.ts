import type { GenreDefinition } from '@bun/instruments/genres/types';

export const AMBIENT_GENRE: GenreDefinition = {
  name: 'Ambient',
  keywords: ['ambient', 'atmospheric', 'soundscape', 'meditative', 'ethereal'],
  description: 'Soothing, curiosity-sparking soundscapes with unusual textures and gentle movement',
  pools: {
    // Foundation - keyboards and strings (NO piano by default)
    foundation: {
      pick: { min: 1, max: 2 },
      instruments: [
        // Professional keyboard alternatives
        'Rhodes', 'Wurlitzer', 'electric piano', 'mellotron', 'harmonium', 'celesta',
        // Strings as foundation
        'strings', 'nylon string guitar', 'fretless guitar',
      ],
    },
    // Texture - pads and atmosphere
    texture: {
      pick: { min: 1, max: 2 },
      instruments: [
        'synth pad', 'ambient pad', 'crystalline synth pads',
        'analog synth pads', 'synth strings', 'wordless choir',
      ],
    },
    // Evolving - professional synth textures
    evolving: {
      pick: { min: 0, max: 1 },
      chanceToInclude: 0.6,
      instruments: [
        'granular synth', 'wavetable synth', 'tape loops', 'drone',
        'shimmer pad', 'FM synth', 'Moog synth',
      ],
    },
    // Piano - now optional (only 25% chance)
    piano: {
      pick: { min: 0, max: 1 },
      chanceToInclude: 0.25,
      instruments: ['felt piano', 'prepared piano'],
    },
    // Curiosity - unusual/exotic instruments (high priority)
    curiosity: {
      pick: { min: 1, max: 2 },
      chanceToInclude: 0.8,
      instruments: [
        'singing bowls', 'crystal bowls', 'kalimba', 'glass bells',
        'bansuri', 'shakuhachi', 'duduk', 'tongue drum', 'handpan',
        'koto', 'bowed vibraphone', 'mark tree', 'tam tam',
        'english horn', 'oboe', 'solo soprano',
      ],
    },
    // World color - ethnic instruments
    world: {
      pick: { min: 0, max: 1 },
      chanceToInclude: 0.5,
      instruments: [
        'sitar', 'erhu', 'oud', 'marimba', 'steel pan',
        'vibraphone', 'cello', 'harp',
      ],
    },
    // Gentle movement - subtle rhythm
    movement: {
      pick: { min: 0, max: 1 },
      chanceToInclude: 0.3,
      instruments: [
        'rain stick', 'ocean drum', 'shaker', 'frame drum',
        'jazz brushes', 'suspended cymbal', 'finger snaps',
      ],
    },
    // Rare texture - very unusual
    rare: {
      pick: { min: 0, max: 1 },
      chanceToInclude: 0.15,
      instruments: ['waterphone', 'glass armonica', 'theremin', 'prepared piano'],
    },
  },
  poolOrder: ['foundation', 'texture', 'evolving', 'piano', 'curiosity', 'world', 'movement', 'rare'],
  maxTags: 5,
  exclusionRules: [
    ['singing bowls', 'crystal bowls'],
    ['bansuri', 'shakuhachi'],
    ['kalimba', 'tongue drum'],
    ['harp', 'koto'],
    ['prepared piano', 'felt piano'],
    ['Rhodes', 'Wurlitzer'],
    ['Rhodes', 'electric piano'],
  ],
  bpm: { min: 60, max: 90, typical: 78 },
  moods: ['Dreamy', 'Ethereal', 'Meditative', 'Calm', 'Floaty', 'Spacious', 'Otherworldly', 'Serene', 'Hypnotic'],
};
