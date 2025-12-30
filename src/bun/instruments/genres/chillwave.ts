import type { GenreDefinition } from '@bun/instruments/genres/types';

export const CHILLWAVE_GENRE: GenreDefinition = {
  name: 'Chillwave',
  keywords: ['chillwave', 'glo-fi', 'hypnagogic', 'bedroom pop', 'chillsynth'],
  description: 'Lo-fi electronic pop with nostalgic synths, hazy production, and summery vibes',
  pools: {
    pad: {
      pick: { min: 1, max: 2 },
      instruments: ['analog synth pads', 'synth pad', 'arpeggiator', 'synth'],
    },
    harmonic: {
      pick: { min: 0, max: 1 },
      chanceToInclude: 0.5,
      instruments: ['guitar', 'Rhodes', 'felt piano', 'Wurlitzer'],
    },
    color: {
      pick: { min: 0, max: 1 },
      chanceToInclude: 0.3,
      instruments: ['saxophone', 'wordless choir', 'glockenspiel'],
    },
    movement: {
      pick: { min: 1, max: 2 },
      instruments: ['drums', 'synth bass', 'hi-hat', '808', 'shaker'],
    },
    rare: {
      pick: { min: 0, max: 1 },
      chanceToInclude: 0.4,
      instruments: ['vinyl noise', 'tape loops'],
    },
  },
  poolOrder: ['pad', 'harmonic', 'color', 'movement', 'rare'],
  maxTags: 4,
  exclusionRules: [
    ['Rhodes', 'Wurlitzer'],
    ['drums', '808'],
  ],
  bpm: { min: 80, max: 110, typical: 95 },
  moods: ['Nostalgic', 'Hazy', 'Summery', 'Dreamy', 'Lo-fi', 'Warm', 'Breezy', 'Melancholic'],
};
