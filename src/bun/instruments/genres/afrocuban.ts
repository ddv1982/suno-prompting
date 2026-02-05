import type { GenreDefinition } from '@bun/instruments/genres/types';

export const AFROCUBAN_GENRE: GenreDefinition = {
  name: 'Afro-Cuban',
  keywords: ['afro-cuban', 'cuban', 'son cubano', 'rumba', 'mambo', 'salsa'],
  description:
    'Rhythmic Afro-Cuban music blending African percussion with Cuban melodies and harmonies',
  pools: {
    percussion: {
      pick: { min: 1, max: 2 },
      instruments: ['congas', 'bongos', 'timbales', 'claves', 'guiro'],
    },
    brass: {
      pick: { min: 1, max: 2 },
      instruments: ['trumpet', 'trombone', 'saxophone', 'flute'],
    },
    harmonic: {
      pick: { min: 1, max: 1 },
      instruments: ['felt piano', 'bass', 'acoustic guitar'],
    },
    rare: {
      pick: { min: 0, max: 1 },
      chanceToInclude: 0.25,
      instruments: ['vibraphone', 'maracas', 'cowbell', 'organ'],
    },
  },
  poolOrder: ['percussion', 'brass', 'harmonic', 'rare'],
  maxTags: 4,
  exclusionRules: [
    ['congas', 'bongos'],
    ['trumpet', 'saxophone'],
  ],
  bpm: { min: 100, max: 130, typical: 115 },
  moods: ['Rhythmic', 'Warm', 'Danceable', 'Festive', 'Passionate', 'Vibrant', 'Groovy'],
};
