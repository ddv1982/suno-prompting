/**
 * Base Genre Compatibility Matrix Data
 *
 * Compatibility scores for original genres (v1.0-v2.0).
 *
 * @module instruments/genres/compatibility/matrix-base
 */

import type { CompatibilityScore } from './types';

/**
 * Base genre compatibility entries.
 * Contains original genres from v1.0-v2.0.
 */
export const BASE_GENRE_COMPATIBILITY: Record<string, Record<string, CompatibilityScore>> = {
  // Electronic family - high compatibility within family
  electronic: {
    house: 0.9,
    trance: 0.85,
    trap: 0.75,
    synthwave: 0.8,
    lofi: 0.6,
    hyperpop: 0.7,
    drill: 0.65,
    melodictechno: 0.9,
    downtempo: 0.7,
    chillwave: 0.65,
    ambient: 0.55,
    disco: 0.6,
    funk: 0.5,
  },
  house: {
    electronic: 0.9,
    trance: 0.8,
    disco: 0.85,
    funk: 0.7,
    melodictechno: 0.85,
    trap: 0.6,
    downtempo: 0.65,
    lofi: 0.5,
  },
  trance: {
    electronic: 0.85,
    house: 0.8,
    melodictechno: 0.85,
    ambient: 0.6,
    synthwave: 0.7,
    cinematic: 0.55,
  },
  trap: {
    electronic: 0.75,
    house: 0.6,
    drill: 0.85,
    hyperpop: 0.65,
    rnb: 0.7,
  },
  synthwave: {
    electronic: 0.8,
    trance: 0.7,
    retro: 0.9,
    dreampop: 0.6,
    pop: 0.55,
    cinematic: 0.6,
  },
  melodictechno: {
    electronic: 0.9,
    house: 0.85,
    trance: 0.85,
    ambient: 0.65,
    downtempo: 0.7,
  },
  hyperpop: {
    electronic: 0.7,
    pop: 0.75,
    trap: 0.65,
    punk: 0.5,
  },
  drill: {
    trap: 0.85,
    electronic: 0.65,
    rnb: 0.55,
  },
  downtempo: {
    electronic: 0.7,
    house: 0.65,
    melodictechno: 0.7,
    ambient: 0.8,
    lofi: 0.75,
    chillwave: 0.85,
    jazz: 0.6,
    soul: 0.55,
  },

  // Rock family - compatibility within rock subgenres
  rock: {
    punk: 0.8,
    metal: 0.7,
    indie: 0.85,
    blues: 0.75,
    folk: 0.6,
    country: 0.55,
    pop: 0.6,
  },
  punk: {
    rock: 0.8,
    metal: 0.65,
    indie: 0.7,
    hyperpop: 0.5,
  },
  metal: {
    rock: 0.7,
    punk: 0.65,
    symphonic: 0.6,
    cinematic: 0.55,
  },
  indie: {
    rock: 0.85,
    folk: 0.75,
    dreampop: 0.8,
    lofi: 0.65,
    pop: 0.7,
    punk: 0.7,
    chillwave: 0.6,
  },

  // Jazz/Soul family - classic fusion-friendly genres
  jazz: {
    soul: 0.85,
    blues: 0.9,
    funk: 0.8,
    rnb: 0.75,
    lofi: 0.7,
    downtempo: 0.6,
    classical: 0.55,
    latin: 0.6,
  },
  soul: {
    jazz: 0.85,
    blues: 0.85,
    funk: 0.9,
    rnb: 0.9,
    disco: 0.7,
    pop: 0.6,
    downtempo: 0.55,
  },
  blues: {
    jazz: 0.9,
    soul: 0.85,
    rock: 0.75,
    funk: 0.7,
    country: 0.65,
    folk: 0.6,
  },
  funk: {
    soul: 0.9,
    jazz: 0.8,
    disco: 0.85,
    house: 0.7,
    blues: 0.7,
    rnb: 0.75,
    electronic: 0.5,
    pop: 0.55,
  },
  rnb: {
    soul: 0.9,
    funk: 0.75,
    jazz: 0.75,
    trap: 0.7,
    pop: 0.7,
    drill: 0.55,
    lofi: 0.6,
  },

  // Atmospheric family - ambient and dreamy styles
  ambient: {
    chillwave: 0.85,
    dreampop: 0.7,
    newage: 0.9,
    cinematic: 0.75,
    downtempo: 0.8,
    melodictechno: 0.65,
    trance: 0.6,
    lofi: 0.6,
    electronic: 0.55,
    classical: 0.55,
  },
  chillwave: {
    ambient: 0.85,
    downtempo: 0.85,
    dreampop: 0.8,
    lofi: 0.75,
    synthwave: 0.6,
    indie: 0.6,
    electronic: 0.65,
  },
  dreampop: {
    chillwave: 0.8,
    ambient: 0.7,
    indie: 0.8,
    synthwave: 0.6,
    lofi: 0.65,
    pop: 0.6,
    folk: 0.5,
  },
  lofi: {
    jazz: 0.7,
    chillwave: 0.75,
    downtempo: 0.75,
    indie: 0.65,
    rnb: 0.6,
    electronic: 0.6,
    ambient: 0.6,
    dreampop: 0.65,
    folk: 0.5,
  },
  newage: {
    ambient: 0.9,
    classical: 0.65,
    cinematic: 0.6,
  },

  // World/Latin family - rhythmic global styles
  latin: {
    jazz: 0.6,
    reggae: 0.55,
    afrobeat: 0.65,
    funk: 0.55,
    disco: 0.5,
    pop: 0.55,
  },
  reggae: {
    afrobeat: 0.7,
    latin: 0.55,
    funk: 0.5,
    soul: 0.5,
  },
  afrobeat: {
    reggae: 0.7,
    latin: 0.65,
    funk: 0.6,
    jazz: 0.55,
    soul: 0.55,
    disco: 0.5,
  },

  // Classical/Cinematic family - orchestral and epic styles
  classical: {
    symphonic: 0.95,
    cinematic: 0.85,
    ambient: 0.55,
    jazz: 0.55,
    newage: 0.65,
  },
  symphonic: {
    classical: 0.95,
    cinematic: 0.9,
    metal: 0.6,
  },
  cinematic: {
    classical: 0.85,
    symphonic: 0.9,
    ambient: 0.75,
    synthwave: 0.6,
    trance: 0.55,
    metal: 0.55,
    newage: 0.6,
  },

  // Pop/Commercial family
  pop: {
    rnb: 0.7,
    indie: 0.7,
    hyperpop: 0.75,
    disco: 0.65,
    rock: 0.6,
    soul: 0.6,
    dreampop: 0.6,
    synthwave: 0.55,
    latin: 0.55,
    funk: 0.55,
  },
  disco: {
    house: 0.85,
    funk: 0.85,
    soul: 0.7,
    pop: 0.65,
    electronic: 0.6,
    latin: 0.5,
    afrobeat: 0.5,
  },
  retro: {
    synthwave: 0.9,
    disco: 0.7,
    funk: 0.65,
    pop: 0.5,
  },

  // Folk/Country family - acoustic and traditional styles
  folk: {
    country: 0.8,
    indie: 0.75,
    blues: 0.6,
    rock: 0.6,
    dreampop: 0.5,
    lofi: 0.5,
  },
  country: {
    folk: 0.8,
    blues: 0.65,
    rock: 0.55,
  },

  // Video game - cross-compatible with many genres
  videogame: {
    electronic: 0.75,
    cinematic: 0.85,
    synthwave: 0.8,
    chillwave: 0.6,
    lofi: 0.7,
    ambient: 0.6,
    symphonic: 0.7,
    retro: 0.75,
  },
};
