import type { GenreDefinition } from '@bun/instruments/genres/types';

export const AMBIENT_GENRE: GenreDefinition = {
  name: 'Ambient',
  keywords: ['ambient', 'atmospheric', 'soundscape'],
  description: 'Warm, intimate, emotional soundscapes with gentle movement',
  pools: {
    harmonicAnchor: {
      pick: { min: 1, max: 1 },
      instruments: [
        'prepared piano', 'felt piano', 'harmonium', 'celesta',
        'strings', 'guitar', 'acoustic guitar', 'fretless guitar',
      ],
    },
    padOrSynth: {
      pick: { min: 1, max: 1 },
      instruments: [
        'synth pad', 'analog synth pads', 'analog synth', 'digital synth',
        'FM synth', 'Moog synth', 'synth', 'crystalline synth pads', 'ambient pad',
      ],
    },
    rare: {
      pick: { min: 0, max: 1 },
      chanceToInclude: 0.25,
      instruments: ['taiko drums', 'steel pan', 'Hammond organ'],
    },
    color: {
      pick: { min: 0, max: 1 },
      instruments: [
        'electric piano', 'Rhodes', 'Wurlitzer', 'Clavinet',
        'cello', 'vibraphone', 'oboe', 'bassoon', 'bowed vibraphone',
        'marimba', 'kalimba', 'glockenspiel', 'bells', 'glass bells',
        'congas', 'singing bowls', 'choir', 'wordless choir',
        'clarinet', 'shakuhachi', 'duduk', 'breathy EWI',
      ],
    },
    movement: {
      pick: { min: 0, max: 1 },
      instruments: [
        'percussion', 'toms', 'shaker', 'frame drum', 'handpan',
        'sub-bass', 'snare drum', 'jazz brushes', 'cajón', 'djembe',
      ],
    },
  },
  poolOrder: ['harmonicAnchor', 'padOrSynth', 'rare', 'color', 'movement'],
  maxTags: 4,
  exclusionRules: [
    ['acoustic piano', 'Rhodes'],
    ['Rhodes', 'Wurlitzer'],
    ['bells', 'singing bowls'],
  ],
};
