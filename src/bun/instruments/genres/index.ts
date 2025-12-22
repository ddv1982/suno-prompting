import { AMBIENT_GENRE } from './ambient';

export const GENRE_REGISTRY = {
  ambient: AMBIENT_GENRE,
} as const;

export type GenreType = keyof typeof GENRE_REGISTRY;

export { AMBIENT_GENRE };
export type { GenreDefinition, InstrumentPool } from './types';
