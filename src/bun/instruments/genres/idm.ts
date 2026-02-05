import type { GenreDefinition } from '@bun/instruments/genres/types';

export const IDM_GENRE: GenreDefinition = {
  name: 'IDM',
  keywords: ['idm', 'intelligent dance music', 'braindance', 'experimental electronic', 'glitch'],
  description: 'Experimental electronic music with complex rhythms and unconventional sound design',
  pools: {
    rhythmic: {
      pick: { min: 1, max: 2 },
      instruments: ['percussion', 'drums', 'breakbeat', 'hi-hat'],
    },
    texture: {
      pick: { min: 1, max: 2 },
      instruments: [
        'granular synth',
        'modular synth',
        'ambient pad',
        'prepared piano',
        'bitcrushed synth',
      ],
    },
    bass: {
      pick: { min: 0, max: 1 },
      chanceToInclude: 0.6,
      instruments: ['sub-bass', 'synth bass', 'TB-303'],
    },
    rare: {
      pick: { min: 0, max: 1 },
      chanceToInclude: 0.25,
      instruments: ['field recordings', 'glitched vocals', 'tape loops'],
    },
  },
  poolOrder: ['rhythmic', 'texture', 'bass', 'rare'],
  maxTags: 4,
  exclusionRules: [
    ['granular synth', 'modular synth'],
    ['sub-bass', 'synth bass'],
  ],
  bpm: { min: 100, max: 160, typical: 130 },
  moods: [
    'Experimental',
    'Complex',
    'Cerebral',
    'Abstract',
    'Glitchy',
    'Introspective',
    'Avant-garde',
  ],
};
