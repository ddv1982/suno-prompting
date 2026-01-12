import type { GenreDefinition } from '@bun/instruments/genres/types';

export const SKA_GENRE: GenreDefinition = {
  name: 'Ska',
  keywords: ['ska', 'ska punk', 'third wave ska', 'two-tone', 'rocksteady'],
  description: 'Upbeat Jamaican-originated music with offbeat rhythms, brass, and energetic grooves',
  pools: {
    brass: {
      pick: { min: 1, max: 2 },
      instruments: ['trumpet', 'trombone', 'saxophone', 'low brass'],
    },
    guitar: {
      pick: { min: 1, max: 1 },
      instruments: ['guitar', 'Telecaster'],
    },
    rhythm: {
      pick: { min: 1, max: 2 },
      instruments: ['drums', 'bass', 'organ', 'felt piano'],
    },
    rare: {
      pick: { min: 0, max: 1 },
      chanceToInclude: 0.25,
      instruments: ['melodica', 'percussion', 'synth', 'distorted guitar'],
    },
  },
  poolOrder: ['brass', 'guitar', 'rhythm', 'rare'],
  maxTags: 4,
  exclusionRules: [
    ['trumpet', 'saxophone'],
    ['guitar', 'Telecaster'],
  ],
  bpm: { min: 130, max: 160, typical: 145 },
  moods: ['Upbeat', 'Bouncy', 'Energetic', 'Fun', 'Party', 'Danceable', 'Lively'],
};
