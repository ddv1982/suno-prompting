import { AFROBEAT_GENRE } from '@bun/instruments/genres/afrobeat';
import { AMBIENT_GENRE } from '@bun/instruments/genres/ambient';
import { BLUES_GENRE } from '@bun/instruments/genres/blues';
import { CHILLWAVE_GENRE } from '@bun/instruments/genres/chillwave';
import { CINEMATIC_GENRE } from '@bun/instruments/genres/cinematic';
import { CLASSICAL_GENRE } from '@bun/instruments/genres/classical';
import { COUNTRY_GENRE } from '@bun/instruments/genres/country';
import { DISCO_GENRE } from '@bun/instruments/genres/disco';
import { DOWNTEMPO_GENRE } from '@bun/instruments/genres/downtempo';
import { DREAMPOP_GENRE } from '@bun/instruments/genres/dreampop';
import { DRILL_GENRE } from '@bun/instruments/genres/drill';
import { ELECTRONIC_GENRE } from '@bun/instruments/genres/electronic';
import { FOLK_GENRE } from '@bun/instruments/genres/folk';
import { FUNK_GENRE } from '@bun/instruments/genres/funk';
import { HOUSE_GENRE } from '@bun/instruments/genres/house';
import { HYPERPOP_GENRE } from '@bun/instruments/genres/hyperpop';
import { INDIE_GENRE } from '@bun/instruments/genres/indie';
import { JAZZ_GENRE } from '@bun/instruments/genres/jazz';
import { LATIN_GENRE } from '@bun/instruments/genres/latin';
import { LOFI_GENRE } from '@bun/instruments/genres/lofi';
import { MELODICTECHNO_GENRE } from '@bun/instruments/genres/melodictechno';
import { METAL_GENRE } from '@bun/instruments/genres/metal';
import { NEWAGE_GENRE } from '@bun/instruments/genres/newage';
import { POP_GENRE } from '@bun/instruments/genres/pop';
import { PUNK_GENRE } from '@bun/instruments/genres/punk';
import { REGGAE_GENRE } from '@bun/instruments/genres/reggae';
import { RETRO_GENRE } from '@bun/instruments/genres/retro';
import { RNB_GENRE } from '@bun/instruments/genres/rnb';
import { ROCK_GENRE } from '@bun/instruments/genres/rock';
import { SOUL_GENRE } from '@bun/instruments/genres/soul';
import { SYMPHONIC_GENRE } from '@bun/instruments/genres/symphonic';
import { SYNTHWAVE_GENRE } from '@bun/instruments/genres/synthwave';
import { TRANCE_GENRE } from '@bun/instruments/genres/trance';
import { TRAP_GENRE } from '@bun/instruments/genres/trap';
import { VIDEOGAME_GENRE } from '@bun/instruments/genres/videogame';

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
  disco: DISCO_GENRE,
  funk: FUNK_GENRE,
  reggae: REGGAE_GENRE,
  afrobeat: AFROBEAT_GENRE,
  house: HOUSE_GENRE,
  trance: TRANCE_GENRE,
  downtempo: DOWNTEMPO_GENRE,
  dreampop: DREAMPOP_GENRE,
  chillwave: CHILLWAVE_GENRE,
  newage: NEWAGE_GENRE,
  hyperpop: HYPERPOP_GENRE,
  drill: DRILL_GENRE,
  melodictechno: MELODICTECHNO_GENRE,
  indie: INDIE_GENRE,
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
  DISCO_GENRE,
  FUNK_GENRE,
  REGGAE_GENRE,
  AFROBEAT_GENRE,
  HOUSE_GENRE,
  TRANCE_GENRE,
  DOWNTEMPO_GENRE,
  DREAMPOP_GENRE,
  CHILLWAVE_GENRE,
  NEWAGE_GENRE,
  HYPERPOP_GENRE,
  DRILL_GENRE,
  MELODICTECHNO_GENRE,
  INDIE_GENRE,
};
export type { GenreDefinition, InstrumentPool } from '@bun/instruments/genres/types';
export { MULTI_GENRE_COMBINATIONS, isMultiGenre, type MultiGenreCombination } from '@bun/instruments/genres/combinations';

// Note: Genre mappings are NOT re-exported here to avoid circular dependencies.
// Import directly from '@bun/instruments/genres/mappings' instead.
