import type { GenreDefinition } from '@bun/instruments/genres/types';

export const FUNK_GENRE: GenreDefinition = {
  name: 'Funk',
  keywords: ['funk', 'funky', 'p-funk', 'parliament', 'funkadelic', 'groove'],
  description: 'Rhythmic, groove-heavy music with syncopated bass lines and tight horn sections',
  pools: {
    harmonic: {
      pick: { min: 1, max: 1 },
      instruments: ['Clavinet', 'Rhodes', 'Wurlitzer', 'Hammond organ'],
    },
    color: {
      pick: { min: 1, max: 2 },
      instruments: ['slap bass', 'wah guitar', 'low brass', 'trumpet', 'tenor sax', 'trombone'],
    },
    movement: {
      pick: { min: 1, max: 2 },
      instruments: ['drums', 'hi-hat', 'handclaps', 'congas', 'bongos', 'tambourine'],
    },
    rare: {
      pick: { min: 0, max: 1 },
      chanceToInclude: 0.2,
      instruments: ['vocoder', 'synth bass'],
    },
  },
  poolOrder: ['harmonic', 'color', 'movement', 'rare'],
  maxTags: 4,
  exclusionRules: [
    ['Rhodes', 'Wurlitzer'],
    ['Clavinet', 'Hammond organ'],
    ['slap bass', 'synth bass'],
  ],
  bpm: { min: 95, max: 115, typical: 105 },
  moods: ['Groovy', 'Tight', 'Syncopated', 'Danceable', 'Raw', 'Soulful', 'Energetic', 'Swaggering'],
};
