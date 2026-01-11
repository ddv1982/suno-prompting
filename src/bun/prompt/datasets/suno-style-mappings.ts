/**
 * Suno V5 Style to Genre Mappings
 *
 * Maps common Suno V5 style keywords to registry genres for enrichment.
 * Used by the enrichment service to extract genres from style strings.
 *
 * @module prompt/datasets/suno-style-mappings
 */

import type { GenreType } from '@bun/instruments/genres';

/**
 * Map of Suno V5 style keywords to registry genres.
 *
 * Categories:
 * - Direct matches: Keywords that match registry genre names exactly
 * - Style-specific: Suno style keywords mapped to closest registry genre
 *
 * @example
 * SUNO_STYLE_GENRE_MAP['jazz'] // → 'jazz' (direct match)
 * SUNO_STYLE_GENRE_MAP['shoegaze'] // → 'dreampop' (style-specific)
 */
export const SUNO_STYLE_GENRE_MAP = {
  // ============================================
  // Direct matches to registry genres
  // ============================================
  jazz: 'jazz',
  rock: 'rock',
  pop: 'pop',
  blues: 'blues',
  folk: 'folk',
  country: 'country',
  metal: 'metal',
  punk: 'punk',
  soul: 'soul',
  funk: 'funk',
  disco: 'disco',
  reggae: 'reggae',
  house: 'house',
  trance: 'trance',
  ambient: 'ambient',
  classical: 'classical',
  lofi: 'lofi',
  synthwave: 'synthwave',
  cinematic: 'cinematic',
  symphonic: 'symphonic',
  trap: 'trap',
  latin: 'latin',
  afrobeat: 'afrobeat',
  indie: 'indie',
  drill: 'drill',
  hyperpop: 'hyperpop',
  downtempo: 'downtempo',
  chillwave: 'chillwave',

  // ============================================
  // Dreampop / Shoegaze family
  // ============================================
  shoegaze: 'dreampop',
  dreamy: 'dreampop',
  dreampop: 'dreampop',

  // ============================================
  // Lo-Fi / Hip-Hop family
  // ============================================
  'lo-fi': 'lofi',
  'hip-hop': 'trap',
  hiphop: 'trap',

  // ============================================
  // R&B family
  // ============================================
  'r&b': 'rnb',
  rnb: 'rnb',

  // ============================================
  // Electronic family
  // ============================================
  techno: 'electronic',
  edm: 'electronic',
  electronic: 'electronic',
  electro: 'electronic',
  dubstep: 'electronic',
  dnb: 'electronic',
  drum: 'electronic',
  bass: 'electronic',
  breakbeat: 'electronic',
  minimal: 'electronic',
  experimental: 'electronic',
  industrial: 'electronic',
  noise: 'electronic',
  glitch: 'electronic',
  idm: 'electronic',
  future: 'electronic',
  modern: 'electronic',
  futuristic: 'electronic',

  // ============================================
  // Rock family
  // ============================================
  grunge: 'rock',
  alternative: 'rock',
  progressive: 'rock',
  prog: 'rock',
  psychedelic: 'rock',
  emo: 'rock',
  post: 'rock',
  math: 'rock',
  stoner: 'rock',

  // ============================================
  // Jazz family
  // ============================================
  bossa: 'jazz',
  bossanova: 'jazz',
  swing: 'jazz',
  bebop: 'jazz',
  fusion: 'jazz',

  // ============================================
  // Latin family
  // ============================================
  salsa: 'latin',
  samba: 'latin',
  reggaeton: 'latin',
  bachata: 'latin',

  // ============================================
  // Classical family
  // ============================================
  opera: 'classical',
  neoclassical: 'classical',
  baroque: 'classical',
  romantic: 'classical',
  contemporary: 'classical',

  // ============================================
  // Symphonic / Orchestral family
  // ============================================
  orchestral: 'symphonic',
  orchestra: 'symphonic',

  // ============================================
  // Cinematic family
  // ============================================
  epic: 'cinematic',
  trailer: 'cinematic',

  // ============================================
  // Video Game family
  // ============================================
  game: 'videogame',
  videogame: 'videogame',
  chiptune: 'videogame',
  '8bit': 'videogame',
  '8-bit': 'videogame',

  // ============================================
  // Retro family
  // ============================================
  retro: 'retro',
  vintage: 'retro',
  oldies: 'retro',
  surf: 'retro',

  // ============================================
  // Soul / Gospel family
  // ============================================
  motown: 'soul',
  gospel: 'soul',

  // ============================================
  // New Age / Meditation family
  // ============================================
  newage: 'newage',
  'new age': 'newage',
  meditation: 'newage',

  // ============================================
  // Chill family
  // ============================================
  chill: 'chillwave',
  chillout: 'downtempo',

  // ============================================
  // Folk / Acoustic family
  // ============================================
  acoustic: 'folk',
  singer: 'folk',
  songwriter: 'folk',

  // ============================================
  // Metal family
  // ============================================
  hardcore: 'metal',
  thrash: 'metal',
  death: 'metal',
  black: 'metal',
  doom: 'metal',
  screamo: 'metal',
  sludge: 'metal',
  power: 'metal',
  speed: 'metal',

  // ============================================
  // Reggae / Dub family
  // ============================================
  dub: 'reggae',
  dancehall: 'reggae',
  ska: 'reggae',

  // ============================================
  // House family
  // ============================================
  garage: 'house',
  deep: 'house',
  techhouse: 'house',
  'tech house': 'house',
  tropical: 'house',

  // ============================================
  // Melodic Techno
  // ============================================
  melodic: 'melodictechno',

  // ============================================
  // Synthwave family
  // ============================================
  wave: 'synthwave',
  vapor: 'synthwave',
  vaporwave: 'synthwave',
  outrun: 'synthwave',
  cyberpunk: 'synthwave',
  neon: 'synthwave',

  // ============================================
  // Afrobeat / World family
  // ============================================
  afro: 'afrobeat',
  world: 'afrobeat',
  tribal: 'afrobeat',

  // ============================================
  // Drill / Grime family
  // ============================================
  uk: 'drill',
  grime: 'drill',

  // ============================================
  // Trap family
  // ============================================
  phonk: 'trap',
  cloud: 'trap',
  mumble: 'trap',
} as const satisfies Record<string, GenreType>;

/**
 * Type for valid Suno style keywords that can be mapped to genres.
 */
export type SunoStyleKeyword = keyof typeof SUNO_STYLE_GENRE_MAP;

/**
 * Check if a word is a known Suno style keyword.
 */
export function isSunoStyleKeyword(word: string): word is SunoStyleKeyword {
  return word in SUNO_STYLE_GENRE_MAP;
}
