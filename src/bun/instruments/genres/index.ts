import { AMBIENT_GENRE } from './ambient';
import { JAZZ_GENRE } from './jazz';
import { ELECTRONIC_GENRE } from './electronic';
import { ROCK_GENRE } from './rock';
import { POP_GENRE } from './pop';
import { CLASSICAL_GENRE } from './classical';
import { LOFI_GENRE } from './lofi';
import { SYNTHWAVE_GENRE } from './synthwave';
import { CINEMATIC_GENRE } from './cinematic';
import { FOLK_GENRE } from './folk';
import { RNB_GENRE } from './rnb';

export const GENRE_REGISTRY = {
  ambient: AMBIENT_GENRE,
  jazz: JAZZ_GENRE,
  electronic: ELECTRONIC_GENRE,
  rock: ROCK_GENRE,
  pop: POP_GENRE,
  classical: CLASSICAL_GENRE,
  lofi: LOFI_GENRE,
  synthwave: SYNTHWAVE_GENRE,
  cinematic: CINEMATIC_GENRE,
  folk: FOLK_GENRE,
  rnb: RNB_GENRE,
} as const;

export type GenreType = keyof typeof GENRE_REGISTRY;

export {
  AMBIENT_GENRE,
  JAZZ_GENRE,
  ELECTRONIC_GENRE,
  ROCK_GENRE,
  POP_GENRE,
  CLASSICAL_GENRE,
  LOFI_GENRE,
  SYNTHWAVE_GENRE,
  CINEMATIC_GENRE,
  FOLK_GENRE,
  RNB_GENRE,
};
export type { GenreDefinition, InstrumentPool } from './types';
