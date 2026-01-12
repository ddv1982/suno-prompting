import type { GenreDefinition } from '@bun/instruments/genres/types';

export const UKGARAGE_GENRE: GenreDefinition = {
  name: 'UK Garage',
  keywords: ['uk garage', 'ukg', '2-step', 'speed garage', 'bassline'],
  description: 'Smooth electronic dance music with syncopated rhythms, R&B vocals, and shuffling beats',
  pools: {
    drums: {
      pick: { min: 1, max: 2 },
      instruments: ['drums', 'hi-hat', 'snare drum', 'percussion'],
    },
    bass: {
      pick: { min: 1, max: 1 },
      instruments: ['synth bass', 'sub-bass', '808'],
    },
    keys: {
      pick: { min: 1, max: 2 },
      instruments: ['stabs', 'Rhodes', 'felt piano', 'synth pad', 'analog synth pads'],
    },
    rare: {
      pick: { min: 0, max: 1 },
      chanceToInclude: 0.35,
      instruments: ['vocal chops', 'strings', 'brass stabs'],
    },
  },
  poolOrder: ['drums', 'bass', 'keys', 'rare'],
  maxTags: 5,
  exclusionRules: [
    ['Rhodes', 'felt piano'],
    ['synth bass', 'sub-bass'],
  ],
  bpm: { min: 130, max: 140, typical: 135 },
  moods: ['Smooth', 'Bouncy', 'Groovy', 'Soulful', 'Uplifting', 'Urban', 'Slick'],
};
