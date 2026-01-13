/**
 * Genre-Specific Tag Category Weights
 *
 * Tailored weights for each genre based on musical characteristics.
 * These weights control the probability of including specific tag categories
 * in deterministic prompt generation.
 *
 * Weight ranges and their meanings:
 * - **vocal**: Importance of vocal-related tags (0.0 = instrumental, 1.0 = vocal-focused)
 * - **spatial**: Importance of spatial/reverb tags (0.0 = dry/intimate, 1.0 = expansive)
 * - **harmonic**: Importance of harmonic complexity tags
 * - **dynamic**: Importance of dynamic range tags
 * - **temporal**: Importance of timing/groove tags
 *
 * Design rationale by genre family:
 * - **Jazz & Blues**: High vocal (70-90%) for jazz standards, moderate spatial for club feel
 * - **Electronic**: High spatial (60-80%) for wide mixes, lower vocal for instrumental focus
 * - **Rock/Metal**: Balanced, dynamic-forward for impact and power
 * - **Pop**: Vocal-forward (75%) with balanced production
 * - **Ambient/Atmospheric**: High spatial (75-85%), low vocal for atmospheric focus
 * - **Classical/Orchestral**: High harmonic and spatial for complex compositions
 * - **Folk/Acoustic**: Vocal-forward (70-80%), intimate spatial for acoustic character
 * - **World Music**: Varies by tradition, often rhythmic/temporal focused
 * - **Hip-hop**: Vocal-forward (70%), dynamic for punch
 *
 * @module prompt/deterministic/weights
 */

import { DEFAULT_TAG_WEIGHTS } from './types';

import type { TagCategoryWeights } from './types';
import type { GenreType } from '@bun/instruments/genres';

/**
 * Genre-specific tag weights for all 60 supported genres.
 *
 * Each genre has tailored probabilities for tag category inclusion based on
 * the genre's musical characteristics and production conventions.
 *
 * @example
 * ```typescript
 * const jazzWeights = GENRE_TAG_WEIGHTS['jazz'];
 * // { vocal: 0.8, spatial: 0.4, harmonic: 0.5, dynamic: 0.3, temporal: 0.3 }
 * ```
 */
export const GENRE_TAG_WEIGHTS = {
  // ============================================
  // Jazz & Blues family - vocal-forward, moderate spatial
  // ============================================
  jazz: { vocal: 0.8, spatial: 0.4, harmonic: 0.5, dynamic: 0.3, temporal: 0.3 },
  blues: { vocal: 0.75, spatial: 0.35, harmonic: 0.4, dynamic: 0.35, temporal: 0.3 },
  soul: { vocal: 0.85, spatial: 0.4, harmonic: 0.45, dynamic: 0.4, temporal: 0.3 },
  rnb: { vocal: 0.85, spatial: 0.5, harmonic: 0.4, dynamic: 0.45, temporal: 0.35 },
  gospel: { vocal: 0.9, spatial: 0.5, harmonic: 0.5, dynamic: 0.5, temporal: 0.25 },

  // ============================================
  // Electronic family - spatial-forward, lower vocal
  // ============================================
  electronic: { vocal: 0.4, spatial: 0.7, harmonic: 0.3, dynamic: 0.5, temporal: 0.4 },
  house: { vocal: 0.45, spatial: 0.65, harmonic: 0.3, dynamic: 0.55, temporal: 0.5 },
  trance: { vocal: 0.3, spatial: 0.8, harmonic: 0.35, dynamic: 0.4, temporal: 0.35 },
  dubstep: { vocal: 0.25, spatial: 0.7, harmonic: 0.2, dynamic: 0.65, temporal: 0.45 },
  drumandbass: { vocal: 0.3, spatial: 0.6, harmonic: 0.25, dynamic: 0.6, temporal: 0.55 },
  melodictechno: { vocal: 0.35, spatial: 0.75, harmonic: 0.4, dynamic: 0.45, temporal: 0.4 },
  idm: { vocal: 0.2, spatial: 0.65, harmonic: 0.5, dynamic: 0.45, temporal: 0.5 },
  breakbeat: { vocal: 0.35, spatial: 0.55, harmonic: 0.25, dynamic: 0.55, temporal: 0.5 },
  jungle: { vocal: 0.3, spatial: 0.55, harmonic: 0.2, dynamic: 0.55, temporal: 0.55 },
  hardstyle: { vocal: 0.3, spatial: 0.7, harmonic: 0.2, dynamic: 0.7, temporal: 0.4 },
  ukgarage: { vocal: 0.5, spatial: 0.55, harmonic: 0.3, dynamic: 0.5, temporal: 0.45 },

  // ============================================
  // Rock family - balanced, dynamic-forward
  // ============================================
  rock: { vocal: 0.6, spatial: 0.45, harmonic: 0.35, dynamic: 0.55, temporal: 0.35 },
  metal: { vocal: 0.45, spatial: 0.35, harmonic: 0.3, dynamic: 0.7, temporal: 0.35 },
  punk: { vocal: 0.6, spatial: 0.3, harmonic: 0.2, dynamic: 0.6, temporal: 0.3 },
  grunge: { vocal: 0.55, spatial: 0.4, harmonic: 0.3, dynamic: 0.55, temporal: 0.3 },
  indie: { vocal: 0.65, spatial: 0.5, harmonic: 0.4, dynamic: 0.4, temporal: 0.35 },
  emo: { vocal: 0.7, spatial: 0.45, harmonic: 0.35, dynamic: 0.45, temporal: 0.3 },
  postpunk: { vocal: 0.55, spatial: 0.55, harmonic: 0.35, dynamic: 0.4, temporal: 0.35 },
  shoegaze: { vocal: 0.4, spatial: 0.85, harmonic: 0.45, dynamic: 0.35, temporal: 0.3 },
  stonerrock: { vocal: 0.5, spatial: 0.5, harmonic: 0.35, dynamic: 0.5, temporal: 0.35 },
  mathrock: { vocal: 0.35, spatial: 0.45, harmonic: 0.6, dynamic: 0.45, temporal: 0.55 },

  // ============================================
  // Pop family - vocal-forward, balanced production
  // ============================================
  pop: { vocal: 0.75, spatial: 0.55, harmonic: 0.4, dynamic: 0.5, temporal: 0.35 },
  disco: { vocal: 0.65, spatial: 0.55, harmonic: 0.4, dynamic: 0.5, temporal: 0.45 },
  funk: { vocal: 0.6, spatial: 0.45, harmonic: 0.4, dynamic: 0.5, temporal: 0.5 },
  hyperpop: { vocal: 0.7, spatial: 0.7, harmonic: 0.35, dynamic: 0.6, temporal: 0.4 },

  // ============================================
  // Ambient/Atmospheric family - spatial-forward, low vocal
  // ============================================
  ambient: { vocal: 0.15, spatial: 0.85, harmonic: 0.5, dynamic: 0.25, temporal: 0.2 },
  dreampop: { vocal: 0.5, spatial: 0.8, harmonic: 0.45, dynamic: 0.3, temporal: 0.25 },
  chillwave: { vocal: 0.45, spatial: 0.75, harmonic: 0.4, dynamic: 0.3, temporal: 0.3 },
  newage: { vocal: 0.2, spatial: 0.8, harmonic: 0.55, dynamic: 0.25, temporal: 0.2 },
  downtempo: { vocal: 0.4, spatial: 0.65, harmonic: 0.4, dynamic: 0.35, temporal: 0.35 },

  // ============================================
  // Synth family - balanced spatial and harmonic
  // ============================================
  synthwave: { vocal: 0.45, spatial: 0.7, harmonic: 0.45, dynamic: 0.45, temporal: 0.35 },
  darksynth: { vocal: 0.35, spatial: 0.7, harmonic: 0.4, dynamic: 0.55, temporal: 0.35 },
  outrun: { vocal: 0.4, spatial: 0.7, harmonic: 0.45, dynamic: 0.45, temporal: 0.35 },
  synthpop: { vocal: 0.7, spatial: 0.6, harmonic: 0.4, dynamic: 0.45, temporal: 0.35 },

  // ============================================
  // Classical/Orchestral family - high harmonic, high spatial
  // ============================================
  classical: { vocal: 0.3, spatial: 0.75, harmonic: 0.7, dynamic: 0.55, temporal: 0.3 },
  symphonic: { vocal: 0.25, spatial: 0.8, harmonic: 0.65, dynamic: 0.6, temporal: 0.3 },
  cinematic: { vocal: 0.3, spatial: 0.85, harmonic: 0.6, dynamic: 0.65, temporal: 0.35 },

  // ============================================
  // Folk/Acoustic family - vocal-forward, intimate spatial
  // ============================================
  folk: { vocal: 0.75, spatial: 0.35, harmonic: 0.45, dynamic: 0.3, temporal: 0.25 },
  country: { vocal: 0.8, spatial: 0.4, harmonic: 0.4, dynamic: 0.35, temporal: 0.3 },
  bluegrass: { vocal: 0.7, spatial: 0.35, harmonic: 0.5, dynamic: 0.35, temporal: 0.35 },
  celtic: { vocal: 0.6, spatial: 0.45, harmonic: 0.5, dynamic: 0.35, temporal: 0.35 },

  // ============================================
  // World music family - varies by tradition
  // ============================================
  latin: { vocal: 0.65, spatial: 0.45, harmonic: 0.4, dynamic: 0.45, temporal: 0.5 },
  reggae: { vocal: 0.7, spatial: 0.5, harmonic: 0.35, dynamic: 0.4, temporal: 0.45 },
  afrobeat: { vocal: 0.55, spatial: 0.5, harmonic: 0.4, dynamic: 0.5, temporal: 0.55 },
  bossanova: { vocal: 0.65, spatial: 0.5, harmonic: 0.55, dynamic: 0.3, temporal: 0.35 },
  balkan: { vocal: 0.6, spatial: 0.4, harmonic: 0.5, dynamic: 0.45, temporal: 0.45 },
  middleeastern: { vocal: 0.6, spatial: 0.5, harmonic: 0.55, dynamic: 0.4, temporal: 0.4 },
  afrocuban: { vocal: 0.6, spatial: 0.45, harmonic: 0.45, dynamic: 0.45, temporal: 0.55 },
  ska: { vocal: 0.65, spatial: 0.4, harmonic: 0.35, dynamic: 0.45, temporal: 0.45 },
  dancehall: { vocal: 0.75, spatial: 0.5, harmonic: 0.3, dynamic: 0.5, temporal: 0.45 },

  // ============================================
  // Hip-hop family - vocal-forward, dynamic
  // ============================================
  trap: { vocal: 0.7, spatial: 0.55, harmonic: 0.25, dynamic: 0.6, temporal: 0.45 },
  drill: { vocal: 0.7, spatial: 0.5, harmonic: 0.2, dynamic: 0.6, temporal: 0.45 },
  lofi: { vocal: 0.45, spatial: 0.55, harmonic: 0.4, dynamic: 0.3, temporal: 0.35 },

  // ============================================
  // Other
  // ============================================
  retro: { vocal: 0.6, spatial: 0.5, harmonic: 0.4, dynamic: 0.4, temporal: 0.35 },
  videogame: { vocal: 0.2, spatial: 0.7, harmonic: 0.55, dynamic: 0.5, temporal: 0.4 },
} as const satisfies Record<GenreType, TagCategoryWeights>;

/**
 * Get tag weights for a specific genre.
 *
 * Returns genre-specific weights if defined, otherwise returns default weights.
 * This function is the primary interface for accessing genre weights in the
 * tag assembly process.
 *
 * @param genre - The genre to get weights for
 * @returns Tag category weights for the specified genre
 *
 * @example
 * ```typescript
 * const weights = getTagWeightsForGenre('jazz');
 * // { vocal: 0.8, spatial: 0.4, harmonic: 0.5, dynamic: 0.3, temporal: 0.3 }
 *
 * // Unknown genres fall back to defaults
 * const defaultWeights = getTagWeightsForGenre('unknown' as GenreType);
 * // Returns DEFAULT_TAG_WEIGHTS
 * ```
 */
export function getTagWeightsForGenre(genre: GenreType): TagCategoryWeights {
  return GENRE_TAG_WEIGHTS[genre] ?? DEFAULT_TAG_WEIGHTS;
}
