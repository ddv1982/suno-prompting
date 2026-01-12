import type { GenreDefinition } from '@bun/instruments/genres/types';

export const GOSPEL_GENRE: GenreDefinition = {
  name: 'Gospel',
  keywords: ['gospel', 'spiritual', 'christian', 'choir', 'praise and worship', 'soul gospel'],
  description: 'Uplifting spiritual music with powerful vocals, choirs, and soulful arrangements',
  pools: {
    keys: {
      pick: { min: 1, max: 1 },
      instruments: ['Hammond organ', 'felt piano', 'Wurlitzer', 'Rhodes'],
    },
    vocals: {
      pick: { min: 1, max: 2 },
      instruments: ['choir', 'wordless choir'],
    },
    rhythm: {
      pick: { min: 1, max: 2 },
      instruments: ['drums', 'bass', 'handclaps', 'tambourine'],
    },
    rare: {
      pick: { min: 0, max: 1 },
      chanceToInclude: 0.3,
      instruments: ['low brass', 'strings', 'guitar', 'saxophone'],
    },
  },
  poolOrder: ['keys', 'vocals', 'rhythm', 'rare'],
  maxTags: 4,
  exclusionRules: [
    ['Hammond organ', 'Wurlitzer'],
    ['felt piano', 'Rhodes'],
    ['choir', 'wordless choir'],
  ],
  bpm: { min: 80, max: 130, typical: 100 },
  moods: ['Uplifting', 'Soulful', 'Spiritual', 'Powerful', 'Joyful', 'Passionate', 'Triumphant'],
};
