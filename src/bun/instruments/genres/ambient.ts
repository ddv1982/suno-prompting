import type { GenreDefinition } from '@bun/instruments/genres/types';

export const AMBIENT_GENRE: GenreDefinition = {
  name: 'Ambient',
  keywords: ['ambient', 'atmospheric', 'soundscape', 'drone', 'ethereal', 'textural'],
  description: 'Immersive electronic soundscapes with evolving textures, drones, and atmospheric depth',
  pools: {
    // Core synth pads - the heart of ambient
    pads: {
      pick: { min: 1, max: 2 },
      instruments: [
        'synth pad', 'ambient pad', 'analog synth pads', 'shimmer pad',
        'crystalline synth pads', 'Moog synth',
      ],
    },
    // Evolving textures and synthesis
    texture: {
      pick: { min: 1, max: 2 },
      instruments: [
        'granular synth', 'wavetable synth', 'FM synth', 'modular synth',
        'drone', 'tape loops', 'field recordings',
      ],
    },
    // Melodic color (optional, subtle)
    melodic: {
      pick: { min: 0, max: 1 },
      chanceToInclude: 0.5,
      instruments: [
        'guitar', 'processed guitar', 'e-bow guitar',
        'glass bells', 'vibraphone', 'bowed vibraphone',
      ],
    },
    // Piano (rare, textural)
    piano: {
      pick: { min: 0, max: 1 },
      chanceToInclude: 0.25,
      instruments: ['felt piano', 'prepared piano'],
    },
    // Organic accents (minimal, authentic to ambient)
    organic: {
      pick: { min: 0, max: 1 },
      chanceToInclude: 0.4,
      instruments: [
        'singing bowls', 'crystal bowls', 'kalimba', 'handpan',
        'tongue drum', 'bansuri', 'shakuhachi',
      ],
    },
    // Movement (very subtle)
    movement: {
      pick: { min: 0, max: 1 },
      chanceToInclude: 0.2,
      instruments: [
        'rain stick', 'suspended cymbal', 'mark tree', 'shaker',
      ],
    },
    // Rare experimental
    rare: {
      pick: { min: 0, max: 1 },
      chanceToInclude: 0.15,
      instruments: [
        'theremin', 'waterphone', 'glass armonica', 'didgeridoo',
      ],
    },
    // Sustained melodic instruments for long beautiful lines
    sustainedMelodic: {
      pick: { min: 0, max: 1 },
      chanceToInclude: 0.35,
      instruments: [
        'cello', 'violin', 'strings', 'flute', 'oboe',
        'duduk', 'erhu', 'clarinet', 'harmonium',
      ],
    },
  },
  poolOrder: ['pads', 'texture', 'melodic', 'sustainedMelodic', 'piano', 'organic', 'movement', 'rare'],
  maxTags: 5,
  exclusionRules: [
    ['singing bowls', 'crystal bowls'],
    ['bansuri', 'shakuhachi'],
    ['kalimba', 'tongue drum'],
    ['prepared piano', 'felt piano'],
    ['guitar', 'processed guitar'],
    ['guitar', 'e-bow guitar'],
    ['processed guitar', 'e-bow guitar'],
    ['granular synth', 'wavetable synth'],
    // Sustained melodic exclusions
    ['cello', 'violin'],
    ['flute', 'bansuri'],
    ['flute', 'shakuhachi'],
    ['oboe', 'duduk'],
    ['harmonium', 'drone'],
  ],
  bpm: { min: 50, max: 80, typical: 65 },
  moods: ['Dreamy', 'Ethereal', 'Meditative', 'Calm', 'Floaty', 'Spacious', 'Otherworldly', 'Serene', 'Hypnotic'],
};
