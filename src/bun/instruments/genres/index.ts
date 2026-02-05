import { AFROBEAT_GENRE } from '@bun/instruments/genres/afrobeat';
import { AFROCUBAN_GENRE } from '@bun/instruments/genres/afrocuban';
import { AMBIENT_GENRE } from '@bun/instruments/genres/ambient';
import { BALKAN_GENRE } from '@bun/instruments/genres/balkan';
import { BLUEGRASS_GENRE } from '@bun/instruments/genres/bluegrass';
import { BLUES_GENRE } from '@bun/instruments/genres/blues';
import { BOSSANOVA_GENRE } from '@bun/instruments/genres/bossanova';
import { BREAKBEAT_GENRE } from '@bun/instruments/genres/breakbeat';
import { CELTIC_GENRE } from '@bun/instruments/genres/celtic';
import { CHILLWAVE_GENRE } from '@bun/instruments/genres/chillwave';
import { CINEMATIC_GENRE } from '@bun/instruments/genres/cinematic';
import { CLASSICAL_GENRE } from '@bun/instruments/genres/classical';
import { COUNTRY_GENRE } from '@bun/instruments/genres/country';
import { DANCEHALL_GENRE } from '@bun/instruments/genres/dancehall';
import { DARKSYNTH_GENRE } from '@bun/instruments/genres/darksynth';
import { DISCO_GENRE } from '@bun/instruments/genres/disco';
import { DOWNTEMPO_GENRE } from '@bun/instruments/genres/downtempo';
import { DREAMPOP_GENRE } from '@bun/instruments/genres/dreampop';
import { DRILL_GENRE } from '@bun/instruments/genres/drill';
import { DRUMANDBASS_GENRE } from '@bun/instruments/genres/drumandbass';
import { DUBSTEP_GENRE } from '@bun/instruments/genres/dubstep';
import { ELECTRONIC_GENRE } from '@bun/instruments/genres/electronic';
import { EMO_GENRE } from '@bun/instruments/genres/emo';
import { FOLK_GENRE } from '@bun/instruments/genres/folk';
import { FUNK_GENRE } from '@bun/instruments/genres/funk';
import { GOSPEL_GENRE } from '@bun/instruments/genres/gospel';
import { GRUNGE_GENRE } from '@bun/instruments/genres/grunge';
import { HARDSTYLE_GENRE } from '@bun/instruments/genres/hardstyle';
import { HOUSE_GENRE } from '@bun/instruments/genres/house';
import { HYPERPOP_GENRE } from '@bun/instruments/genres/hyperpop';
import { IDM_GENRE } from '@bun/instruments/genres/idm';
import { INDIE_GENRE } from '@bun/instruments/genres/indie';
import { JAZZ_GENRE } from '@bun/instruments/genres/jazz';
import { JUNGLE_GENRE } from '@bun/instruments/genres/jungle';
import { LATIN_GENRE } from '@bun/instruments/genres/latin';
import { LOFI_GENRE } from '@bun/instruments/genres/lofi';
import { MATHROCK_GENRE } from '@bun/instruments/genres/mathrock';
import { MELODICTECHNO_GENRE } from '@bun/instruments/genres/melodictechno';
import { METAL_GENRE } from '@bun/instruments/genres/metal';
import { MIDDLEEASTERN_GENRE } from '@bun/instruments/genres/middleeastern';
import { NEWAGE_GENRE } from '@bun/instruments/genres/newage';
import { OUTRUN_GENRE } from '@bun/instruments/genres/outrun';
import { POP_GENRE } from '@bun/instruments/genres/pop';
import { POSTPUNK_GENRE } from '@bun/instruments/genres/postpunk';
import { PUNK_GENRE } from '@bun/instruments/genres/punk';
import { REGGAE_GENRE } from '@bun/instruments/genres/reggae';
import { RETRO_GENRE } from '@bun/instruments/genres/retro';
import { RNB_GENRE } from '@bun/instruments/genres/rnb';
import { ROCK_GENRE } from '@bun/instruments/genres/rock';
import { SHOEGAZE_GENRE } from '@bun/instruments/genres/shoegaze';
import { SKA_GENRE } from '@bun/instruments/genres/ska';
import { SOUL_GENRE } from '@bun/instruments/genres/soul';
import { STONERROCK_GENRE } from '@bun/instruments/genres/stonerrock';
import { SYMPHONIC_GENRE } from '@bun/instruments/genres/symphonic';
import { SYNTHPOP_GENRE } from '@bun/instruments/genres/synthpop';
import { SYNTHWAVE_GENRE } from '@bun/instruments/genres/synthwave';
import { TRANCE_GENRE } from '@bun/instruments/genres/trance';
import { TRAP_GENRE } from '@bun/instruments/genres/trap';
import { UKGARAGE_GENRE } from '@bun/instruments/genres/ukgarage';
import { VIDEOGAME_GENRE } from '@bun/instruments/genres/videogame';

export const GENRE_REGISTRY = {
  // Original genres
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

  // New electronic subgenres
  dubstep: DUBSTEP_GENRE,
  drumandbass: DRUMANDBASS_GENRE,
  idm: IDM_GENRE,
  breakbeat: BREAKBEAT_GENRE,
  jungle: JUNGLE_GENRE,
  hardstyle: HARDSTYLE_GENRE,
  ukgarage: UKGARAGE_GENRE,

  // New rock/alt subgenres
  shoegaze: SHOEGAZE_GENRE,
  postpunk: POSTPUNK_GENRE,
  emo: EMO_GENRE,
  grunge: GRUNGE_GENRE,
  stonerrock: STONERROCK_GENRE,
  mathrock: MATHROCK_GENRE,

  // New synth subgenres
  darksynth: DARKSYNTH_GENRE,
  outrun: OUTRUN_GENRE,
  synthpop: SYNTHPOP_GENRE,

  // New world genres
  celtic: CELTIC_GENRE,
  balkan: BALKAN_GENRE,
  middleeastern: MIDDLEEASTERN_GENRE,
  afrocuban: AFROCUBAN_GENRE,
  bossanova: BOSSANOVA_GENRE,

  // New other genres
  gospel: GOSPEL_GENRE,
  bluegrass: BLUEGRASS_GENRE,
  ska: SKA_GENRE,
  dancehall: DANCEHALL_GENRE,
} as const;

export type GenreType = keyof typeof GENRE_REGISTRY;

export {
  // Original genres
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
  // New electronic subgenres
  DUBSTEP_GENRE,
  DRUMANDBASS_GENRE,
  IDM_GENRE,
  BREAKBEAT_GENRE,
  JUNGLE_GENRE,
  HARDSTYLE_GENRE,
  UKGARAGE_GENRE,
  // New rock/alt subgenres
  SHOEGAZE_GENRE,
  POSTPUNK_GENRE,
  EMO_GENRE,
  GRUNGE_GENRE,
  STONERROCK_GENRE,
  MATHROCK_GENRE,
  // New synth subgenres
  DARKSYNTH_GENRE,
  OUTRUN_GENRE,
  SYNTHPOP_GENRE,
  // New world genres
  CELTIC_GENRE,
  BALKAN_GENRE,
  MIDDLEEASTERN_GENRE,
  AFROCUBAN_GENRE,
  BOSSANOVA_GENRE,
  // New other genres
  GOSPEL_GENRE,
  BLUEGRASS_GENRE,
  SKA_GENRE,
  DANCEHALL_GENRE,
};
export type { GenreDefinition, InstrumentPool } from '@bun/instruments/genres/types';
export {
  MULTI_GENRE_COMBINATIONS,
  isMultiGenre,
  type MultiGenreCombination,
} from '@bun/instruments/genres/combinations';

// Note: Genre mappings are NOT re-exported here to avoid circular dependencies.
// Import directly from '@bun/instruments/genres/mappings' instead.
