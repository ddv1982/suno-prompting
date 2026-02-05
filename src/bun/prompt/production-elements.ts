/**
 * Production Elements Registry
 *
 * Production elements based on professional prompt patterns.
 * These add recording character, space, and texture descriptors.
 *
 * @module prompt/production-elements
 *
 * @standards-exception
 * This file intentionally exceeds the 300-line guideline.
 * Reason: Pure data registry - contains static production element definitions, not logic.
 * Approved: 2026-01-12
 */

import { selectRandom } from '@shared/utils/random';

import type { ProductionDescriptor } from './deterministic/types';
import type { Era, SpatialHint } from '@shared/schemas/thematic-context';

/**
 * Reverb type descriptors for spatial audio processing.
 * Controls perceived room size and reverb character.
 *
 * Total: 15 reverb types
 *
 * @example
 * // Use in production descriptor
 * const reverb = REVERB_TYPES[5]; // 'Chamber Reverb'
 */
export const REVERB_TYPES = [
  'Long Hall Reverb',
  'Short Room Reverb',
  'Cathedral Reverb',
  'Plate Reverb',
  'Spring Reverb',
  'Chamber Reverb',
  'Studio Reverb',
  'Concert Hall Reverb',
  'Lounge Club Reverb',
  'Wide Stereo Reverb',
  'Distant Room Reverb',
  'Tight Dry Room',
  'Vintage Echo Chamber',
  'Convolution Hall',
  'Natural Space Reverb',
] as const;

export type ReverbType = (typeof REVERB_TYPES)[number];

export const HARMONY_STYLES = [
  'Stacked Harmonies',
  'Layered Harmonies',
  'Tight Three Part Harmonies',
  'Wide Harmony Spread',
  'Unison Doubles',
  'Octave Doubles',
  'Call And Response',
  'Gospel Style Harmonies',
  'Doo Wop Harmonies',
  'Close Harmony',
  'Open Voicings',
] as const;

export type HarmonyStyle = (typeof HARMONY_STYLES)[number];

/**
 * Recording texture descriptors for overall sonic character.
 * Controls the perceived quality, warmth, and polish of the production.
 *
 * Total: 17 texture types
 *
 * @example
 * // Use in production descriptor
 * const texture = RECORDING_TEXTURES[5]; // 'Analog Warmth'
 */
export const RECORDING_TEXTURES = [
  'Polished Production',
  'Raw Performance Texture',
  'Vintage Warmth',
  'Lo-Fi Dusty',
  'Crystal Clear',
  'Analog Warmth',
  'Tape Saturation',
  'Digital Precision',
  'Organic Feel',
  'Intimate Recording',
  'Live Room Sound',
  'Studio Polish',
  // Research-backed textures for Suno V5
  'Layered Depth',
  'Atmospheric Space',
  'Cinematic Width',
  'Dynamic Presence',
  'Rich Saturation',
] as const;

export type RecordingTexture = (typeof RECORDING_TEXTURES)[number];

/**
 * Stereo imaging descriptors for spatial width and positioning.
 * Controls the perceived width and stereo field of the mix.
 *
 * Total: 10 imaging types
 *
 * @example
 * // Use in production descriptor
 * const imaging = STEREO_IMAGING[0]; // 'Wide Stereo'
 */
export const STEREO_IMAGING = [
  'Wide Stereo',
  'Narrow Mono',
  'Centered Focus',
  'Panned Elements',
  'Spacious Mix',
  'Tight Centered Mix',
  'Immersive Surround Feel',
  'Binaural Width',
  'Mono-Compatible Stereo',
  'Mid-Side Enhanced',
] as const;

export type StereoImaging = (typeof STEREO_IMAGING)[number];

/**
 * Dynamic range descriptors for compression and loudness control.
 * Controls the perceived dynamics, compression, and loudness of the mix.
 *
 * Total: 12 dynamic types
 *
 * @example
 * // Use in production descriptor
 * const dynamic = DYNAMIC_DESCRIPTORS[2]; // 'Natural Dynamics'
 */
export const DYNAMIC_DESCRIPTORS = [
  'Dynamic Range',
  'Compressed Punch',
  'Natural Dynamics',
  'Limiting for Loudness',
  'Soft to Powerful Build',
  'Consistent Energy',
  'Breathing Room',
  'Vintage Compression Warmth',
  'Transparent Limiting',
  'Analog Compression Character',
  'Modern Mastering Loudness',
  'Uncompressed Raw Dynamics',
] as const;

// Genre-specific production suggestions
export const GENRE_PRODUCTION_STYLES: Record<
  string,
  {
    reverbs: readonly string[];
    textures: readonly string[];
    dynamics: readonly string[];
  }
> = {
  jazz: {
    reverbs: ['Long Hall Reverb', 'Lounge Club Reverb', 'Studio Reverb', 'Chamber Reverb'],
    textures: ['Analog Warmth', 'Intimate Recording', 'Live Room Sound', 'Organic Feel'],
    dynamics: ['Natural Dynamics', 'Breathing Room', 'Dynamic Range'],
  },
  pop: {
    reverbs: ['Plate Reverb', 'Short Room Reverb', 'Studio Reverb'],
    textures: ['Polished Production', 'Crystal Clear', 'Digital Precision'],
    dynamics: ['Compressed Punch', 'Consistent Energy', 'Limiting for Loudness'],
  },
  rock: {
    reverbs: ['Short Room Reverb', 'Plate Reverb', 'Live Room Sound'],
    textures: ['Raw Performance Texture', 'Analog Warmth', 'Live Room Sound'],
    dynamics: ['Dynamic Range', 'Compressed Punch', 'Natural Dynamics'],
  },
  electronic: {
    reverbs: ['Wide Stereo Reverb', 'Plate Reverb', 'Long Hall Reverb'],
    textures: ['Digital Precision', 'Crystal Clear', 'Polished Production'],
    dynamics: ['Compressed Punch', 'Consistent Energy', 'Limiting for Loudness'],
  },
  ambient: {
    reverbs: ['Long Hall Reverb', 'Cathedral Reverb', 'Wide Stereo Reverb'],
    textures: ['Organic Feel', 'Intimate Recording', 'Analog Warmth'],
    dynamics: ['Natural Dynamics', 'Breathing Room', 'Soft to Powerful Build'],
  },
  classical: {
    reverbs: ['Concert Hall Reverb', 'Cathedral Reverb', 'Chamber Reverb'],
    textures: ['Organic Feel', 'Live Room Sound', 'Crystal Clear'],
    dynamics: ['Dynamic Range', 'Natural Dynamics', 'Soft to Powerful Build'],
  },
  lofi: {
    reverbs: ['Short Room Reverb', 'Distant Room Reverb', 'Spring Reverb'],
    textures: ['Lo-Fi Dusty', 'Vintage Warmth', 'Tape Saturation', 'Analog Warmth'],
    dynamics: ['Natural Dynamics', 'Breathing Room'],
  },
  blues: {
    reverbs: ['Spring Reverb', 'Lounge Club Reverb', 'Short Room Reverb'],
    textures: ['Analog Warmth', 'Vintage Warmth', 'Raw Performance Texture'],
    dynamics: ['Natural Dynamics', 'Dynamic Range'],
  },
  rnb: {
    reverbs: ['Plate Reverb', 'Studio Reverb', 'Short Room Reverb'],
    textures: ['Polished Production', 'Analog Warmth', 'Intimate Recording'],
    dynamics: ['Compressed Punch', 'Natural Dynamics'],
  },
  soul: {
    reverbs: ['Plate Reverb', 'Chamber Reverb', 'Studio Reverb'],
    textures: ['Analog Warmth', 'Vintage Warmth', 'Live Room Sound'],
    dynamics: ['Dynamic Range', 'Natural Dynamics'],
  },
  country: {
    reverbs: ['Short Room Reverb', 'Spring Reverb', 'Studio Reverb'],
    textures: ['Organic Feel', 'Analog Warmth', 'Live Room Sound'],
    dynamics: ['Natural Dynamics', 'Dynamic Range'],
  },
  folk: {
    reverbs: ['Short Room Reverb', 'Chamber Reverb', 'Intimate Recording'],
    textures: ['Organic Feel', 'Intimate Recording', 'Analog Warmth'],
    dynamics: ['Natural Dynamics', 'Breathing Room'],
  },
  metal: {
    reverbs: ['Tight Dry Room', 'Short Room Reverb', 'Plate Reverb'],
    textures: ['Raw Performance Texture', 'Digital Precision', 'Polished Production'],
    dynamics: ['Compressed Punch', 'Limiting for Loudness', 'Consistent Energy'],
  },
  punk: {
    reverbs: ['Tight Dry Room', 'Short Room Reverb', 'Spring Reverb'],
    textures: ['Raw Performance Texture', 'Live Room Sound', 'Analog Warmth'],
    dynamics: ['Compressed Punch', 'Consistent Energy'],
  },
  synthwave: {
    reverbs: ['Long Hall Reverb', 'Plate Reverb', 'Wide Stereo Reverb'],
    textures: ['Analog Warmth', 'Vintage Warmth', 'Digital Precision'],
    dynamics: ['Compressed Punch', 'Consistent Energy'],
  },
  cinematic: {
    reverbs: ['Concert Hall Reverb', 'Cathedral Reverb', 'Long Hall Reverb'],
    textures: ['Polished Production', 'Crystal Clear', 'Organic Feel'],
    dynamics: ['Dynamic Range', 'Soft to Powerful Build'],
  },
  trap: {
    reverbs: ['Short Room Reverb', 'Plate Reverb', 'Wide Stereo Reverb'],
    textures: ['Digital Precision', 'Polished Production', 'Lo-Fi Dusty'],
    dynamics: ['Compressed Punch', 'Limiting for Loudness'],
  },
  latin: {
    reverbs: ['Plate Reverb', 'Short Room Reverb', 'Studio Reverb'],
    textures: ['Live Room Sound', 'Analog Warmth', 'Organic Feel'],
    dynamics: ['Natural Dynamics', 'Dynamic Range'],
  },
  retro: {
    reverbs: ['Spring Reverb', 'Plate Reverb', 'Chamber Reverb'],
    textures: ['Vintage Warmth', 'Analog Warmth', 'Tape Saturation'],
    dynamics: ['Natural Dynamics', 'Compressed Punch'],
  },
  videogame: {
    reverbs: ['Long Hall Reverb', 'Wide Stereo Reverb', 'Concert Hall Reverb'],
    textures: ['Digital Precision', 'Crystal Clear', 'Polished Production'],
    dynamics: ['Dynamic Range', 'Soft to Powerful Build'],
  },
  symphonic: {
    reverbs: ['Concert Hall Reverb', 'Cathedral Reverb', 'Long Hall Reverb'],
    textures: ['Polished Production', 'Live Room Sound', 'Crystal Clear'],
    dynamics: ['Dynamic Range', 'Soft to Powerful Build'],
  },
};

// Default production style for unknown genres
export const DEFAULT_PRODUCTION_STYLE = {
  reverbs: ['Studio Reverb', 'Plate Reverb'],
  textures: ['Polished Production', 'Analog Warmth'],
  dynamics: ['Natural Dynamics'],
};

// Get production suggestions for a genre
export function getProductionSuggestionsForGenre(
  genre: string,
  rng: () => number = Math.random
): { reverb: string; texture: string; dynamic: string } {
  const style = GENRE_PRODUCTION_STYLES[genre.toLowerCase()] ?? DEFAULT_PRODUCTION_STYLE;

  const reverbIdx = Math.floor(rng() * style.reverbs.length);
  const textureIdx = Math.floor(rng() * style.textures.length);
  const dynamicIdx = Math.floor(rng() * style.dynamics.length);

  return {
    reverb: style.reverbs[reverbIdx] ?? 'Studio Reverb',
    texture: style.textures[textureIdx] ?? 'Polished Production',
    dynamic: style.dynamics[dynamicIdx] ?? 'Natural Dynamics',
  };
}

/**
 * Build multi-dimensional production descriptor for Suno V5 (new in v2).
 *
 * Selects one tag from each production dimension independently for maximum variety.
 * This multi-dimensional approach enables 30,600 unique combinations
 * (15 reverb × 17 texture × 10 stereo × 12 dynamic) compared to 204 combinations
 * from the legacy blended string approach.
 *
 * Each dimension is selected independently using the provided RNG, ensuring
 * deterministic output when a seeded RNG is used. All tags are returned in
 * lowercase for consistency with Suno V5 requirements.
 *
 * @param rng - Seeded random number generator for deterministic selection
 * @returns ProductionDescriptor with one selection from each dimension
 *
 * @example
 * // Deterministic selection with seeded RNG
 * const rng = seedRng(12345);
 * const production = buildProductionDescriptorMulti(rng);
 * // Returns: {
 * //   reverb: 'plate reverb',
 * //   texture: 'warm character',
 * //   stereo: 'wide stereo',
 * //   dynamic: 'punchy mix'
 * // }
 *
 * @example
 * // Random selection with default RNG
 * const production = buildProductionDescriptorMulti();
 * // Returns: { reverb: '...', texture: '...', stereo: '...', dynamic: '...' }
 *
 * @since v2.0.0
 */
export function buildProductionDescriptorMulti(
  rng: () => number = Math.random
): ProductionDescriptor {
  // Select 1 from each dimension independently
  const reverb = selectRandom(REVERB_TYPES, rng).toLowerCase();
  const texture = selectRandom(RECORDING_TEXTURES, rng).toLowerCase();
  const stereo = selectRandom(STEREO_IMAGING, rng).toLowerCase();
  const dynamic = selectRandom(DYNAMIC_DESCRIPTORS, rng).toLowerCase();

  return { reverb, texture, stereo, dynamic };
}

// ============================================
// Spatial Hint Reverb Selection
// ============================================

/**
 * Space-to-reverb mapping for spatial hint integration.
 *
 * Maps perceived space sizes to appropriate reverb types for
 * authentic spatial character in the mix.
 */
const SPACE_REVERBS: Record<string, readonly string[]> = {
  intimate: ['Tight Dry Room', 'Short Room Reverb', 'Studio Reverb'],
  room: ['Short Room Reverb', 'Chamber Reverb', 'Studio Reverb'],
  hall: ['Long Hall Reverb', 'Concert Hall Reverb', 'Plate Reverb'],
  vast: ['Cathedral Reverb', 'Concert Hall Reverb', 'Wide Stereo Reverb'],
};

/**
 * Select reverb type biased by spatial hint.
 *
 * When a spatial hint is provided, selects from a pool of reverb types
 * appropriate for the indicated space size. Falls back to random selection
 * from the full reverb pool when no hint is provided.
 *
 * @param rng - Seeded random number generator
 * @param spatialHint - Optional spatial hint from thematic context
 * @returns Selected reverb type in lowercase
 *
 * @example
 * // With 'intimate' space - selects from dry/room reverbs
 * selectReverbWithSpatialHint(rng, { space: 'intimate' })
 * // Returns: 'tight dry room'
 *
 * @example
 * // With 'vast' space - selects from cathedral/hall reverbs
 * selectReverbWithSpatialHint(rng, { space: 'vast' })
 * // Returns: 'cathedral reverb'
 *
 * @example
 * // Without hint - random selection from all reverbs
 * selectReverbWithSpatialHint(rng)
 * // Returns: any reverb from REVERB_TYPES
 */
export function selectReverbWithSpatialHint(rng: () => number, spatialHint?: SpatialHint): string {
  // Fall back to random selection when no spatial hint
  if (!spatialHint?.space && !spatialHint?.reverb) {
    return selectRandom(REVERB_TYPES, rng).toLowerCase();
  }

  // Use space-based reverb pool if space is provided
  if (spatialHint.space) {
    const candidates = SPACE_REVERBS[spatialHint.space] ?? REVERB_TYPES;
    return selectRandom(candidates, rng).toLowerCase();
  }

  // Fall back to random if only reverb hint is provided (no space)
  return selectRandom(REVERB_TYPES, rng).toLowerCase();
}

/**
 * Build production descriptor with optional spatial hint for reverb selection.
 *
 * Extends buildProductionDescriptorMulti with spatial-aware reverb selection.
 * When a spatial hint is provided, the reverb is selected to match the
 * indicated space size for more authentic spatial character.
 *
 * @param rng - Seeded random number generator
 * @param spatialHint - Optional spatial hint from thematic context
 * @returns ProductionDescriptor with spatial-appropriate reverb
 *
 * @example
 * // With 'hall' space hint
 * buildProductionDescriptorWithSpatialHint(rng, { space: 'hall' })
 * // Returns: { reverb: 'concert hall reverb', ... }
 */
export function buildProductionDescriptorWithSpatialHint(
  rng: () => number,
  spatialHint?: SpatialHint
): ProductionDescriptor {
  const reverb = selectReverbWithSpatialHint(rng, spatialHint);
  const texture = selectRandom(RECORDING_TEXTURES, rng).toLowerCase();
  const stereo = selectRandom(STEREO_IMAGING, rng).toLowerCase();
  const dynamic = selectRandom(DYNAMIC_DESCRIPTORS, rng).toLowerCase();

  return { reverb, texture, stereo, dynamic };
}

/**
 * Probability of using era-biased texture selection when era is provided.
 * The remaining probability uses the full texture pool for variety.
 */
const ERA_TEXTURE_BIAS_CHANCE = 0.7;

/**
 * Era-specific texture biases for period-appropriate production character.
 * Maps each era to a set of textures that authentically represent its sonic qualities.
 *
 * @since v2.1.0
 */
export const ERA_TEXTURE_BIASES: Record<Era, readonly string[]> = {
  '50s-60s': ['Vintage Warmth', 'Lo-Fi Dusty', 'Analog Warmth'],
  '70s': ['Analog Warmth', 'Tape Saturation', 'Live Room Sound'],
  '80s': ['Digital Precision', 'Crystal Clear', 'Polished Production'],
  '90s': ['Raw Performance Texture', 'Lo-Fi Dusty', 'Live Room Sound'],
  '2000s': ['Polished Production', 'Digital Precision', 'Studio Polish'],
  modern: ['Crystal Clear', 'Dynamic Presence', 'Rich Saturation'],
};

/**
 * Build production descriptor with optional era-biased texture selection.
 *
 * When an era is provided, there is an ERA_TEXTURE_BIAS_CHANCE (70%) probability
 * to select a texture from the era-appropriate pool, giving the production an
 * authentic period character. The remaining probability uses the full texture
 * pool for variety.
 *
 * @param rng - Seeded random number generator for deterministic selection
 * @param era - Optional era for texture bias (e.g., '80s', 'modern')
 * @returns ProductionDescriptor with era-appropriate texture when era is set
 *
 * @example
 * // With '80s era - high chance of digital/polished texture
 * const rng = seedRng(42);
 * const production = buildProductionDescriptorWithEra(rng, '80s');
 * // Returns: { reverb: '...', texture: 'digital precision', ... }
 *
 * @example
 * // Without era - uses full texture pool
 * const production = buildProductionDescriptorWithEra(rng);
 * // Returns: { reverb: '...', texture: '...', ... }
 *
 * @since v2.1.0
 */
export function buildProductionDescriptorWithEra(
  rng: () => number,
  era?: Era
): ProductionDescriptor {
  const reverb = selectRandom(REVERB_TYPES, rng).toLowerCase();
  const stereo = selectRandom(STEREO_IMAGING, rng).toLowerCase();
  const dynamic = selectRandom(DYNAMIC_DESCRIPTORS, rng).toLowerCase();

  // Bias texture toward era-appropriate options
  let texture: string;
  if (era && rng() < ERA_TEXTURE_BIAS_CHANCE) {
    const biasedTextures = ERA_TEXTURE_BIASES[era];
    texture =
      biasedTextures.length > 0
        ? selectRandom(biasedTextures, rng).toLowerCase()
        : selectRandom(RECORDING_TEXTURES, rng).toLowerCase();
  } else {
    texture = selectRandom(RECORDING_TEXTURES, rng).toLowerCase();
  }

  return { reverb, texture, stereo, dynamic };
}
