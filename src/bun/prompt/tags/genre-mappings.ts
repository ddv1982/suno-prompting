/**
 * Genre-specific mappings for electronic ratio
 * @module prompt/tags/genre-mappings
 */

/**
 * Electronic vs. organic tag weighting per genre.
 * Controls the ratio of electronic clarity tags vs. realism tags.
 * 
 * Values:
 * - 1.0: 100% electronic tags (edm, techno)
 * - 0.5-0.8: Hybrid genres (synthwave, electronic rock)
 * - 0.0: 100% realism tags (folk, classical)
 * 
 * @example
 * // Check electronic ratio for synthwave
 * GENRE_ELECTRONIC_RATIO.synthwave // 0.8
 */
export const GENRE_ELECTRONIC_RATIO: Record<string, number> = {
  // Pure electronic
  edm: 1.0,
  techno: 1.0,
  house: 1.0,
  trance: 1.0,
  dubstep: 1.0,
  dnb: 1.0,
  'drum and bass': 1.0,
  trap: 0.9,
  
  // Hybrid electronic/organic
  synthwave: 0.8,
  'electronic rock': 0.6,
  'future bass': 0.85,
  electropop: 0.75,
  indietronica: 0.60,
  
  // Minimal electronic (samples/synth pads)
  hiphop: 0.30,
  lofi: 0.35,
  ambient: 0.30,
  
  // Pure organic
  folk: 0.0,
  country: 0.0,
  classical: 0.0,
  jazz: 0.0,
  blues: 0.0,
  rock: 0.0,
  metal: 0.0,
  punk: 0.0,
  
  // Default
  default: 0.0,
} as const;
