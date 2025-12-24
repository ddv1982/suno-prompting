import { AMBIENT_GENRE } from '@bun/instruments/genres/ambient';
import { JAZZ_GENRE } from '@bun/instruments/genres/jazz';
import { ELECTRONIC_GENRE } from '@bun/instruments/genres/electronic';
import { ROCK_GENRE } from '@bun/instruments/genres/rock';
import { POP_GENRE } from '@bun/instruments/genres/pop';
import { CLASSICAL_GENRE } from '@bun/instruments/genres/classical';
import { LOFI_GENRE } from '@bun/instruments/genres/lofi';
import { SYNTHWAVE_GENRE } from '@bun/instruments/genres/synthwave';
import { CINEMATIC_GENRE } from '@bun/instruments/genres/cinematic';
import { FOLK_GENRE } from '@bun/instruments/genres/folk';
import { RNB_GENRE } from '@bun/instruments/genres/rnb';
import { VIDEOGAME_GENRE } from '@bun/instruments/genres/videogame';
import { COUNTRY_GENRE } from '@bun/instruments/genres/country';
import { SOUL_GENRE } from '@bun/instruments/genres/soul';
import { BLUES_GENRE } from '@bun/instruments/genres/blues';
import { PUNK_GENRE } from '@bun/instruments/genres/punk';
import { LATIN_GENRE } from '@bun/instruments/genres/latin';
import { METAL_GENRE } from '@bun/instruments/genres/metal';
import { TRAP_GENRE } from '@bun/instruments/genres/trap';
import { RETRO_GENRE } from '@bun/instruments/genres/retro';
import { SYMPHONIC_GENRE } from '@bun/instruments/genres/symphonic';

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
  videogame: VIDEOGAME_GENRE,
  country: COUNTRY_GENRE,
  soul: SOUL_GENRE,
  blues: BLUES_GENRE,
  punk: PUNK_GENRE,
  latin: LATIN_GENRE,
  metal: METAL_GENRE,
  trap: TRAP_GENRE,
  retro: RETRO_GENRE,
  symphonic: SYMPHONIC_GENRE,
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
  VIDEOGAME_GENRE,
  COUNTRY_GENRE,
  SOUL_GENRE,
  BLUES_GENRE,
  PUNK_GENRE,
  LATIN_GENRE,
  METAL_GENRE,
  TRAP_GENRE,
  RETRO_GENRE,
  SYMPHONIC_GENRE,
};
export type { GenreDefinition, InstrumentPool } from '@bun/instruments/genres/types';
