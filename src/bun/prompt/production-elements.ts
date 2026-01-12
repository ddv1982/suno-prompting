// Production elements based on professional prompt patterns
// These add recording character, space, and texture descriptors

import type { ProductionDescriptor } from './deterministic/types';

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

export type ReverbType = typeof REVERB_TYPES[number];

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

export type HarmonyStyle = typeof HARMONY_STYLES[number];

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

export type RecordingTexture = typeof RECORDING_TEXTURES[number];

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

export type StereoImaging = typeof STEREO_IMAGING[number];

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
export const GENRE_PRODUCTION_STYLES: Record<string, {
  reverbs: readonly string[];
  textures: readonly string[];
  dynamics: readonly string[];
}> = {
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
 * Build production descriptor string (legacy blended format).
 * 
 * Now internally uses multi-dimensional selection for 30,600 combinations
 * compared to 204 from the previous implementation. This refactor maintains
 * backward compatibility by returning the same comma-separated string format
 * while leveraging the improved variety from buildProductionDescriptorMulti().
 * 
 * @param rng - Seeded random number generator for deterministic selection
 * @returns Blended production descriptor string
 * 
 * @example
 * const desc = buildProductionDescriptor(seedRng(42));
 * // Returns: "plate reverb, raw performance texture, tight centered mix, natural dynamics"
 * 
 * @deprecated Consider using buildProductionDescriptorMulti() for structured data
 *   which provides better access to individual production dimensions and enables
 *   more flexible composition of production descriptors in prompts.
 * 
 * @since v1.0.0
 */
export function buildProductionDescriptor(
  rng: () => number = Math.random
): string {
  const multi = buildProductionDescriptorMulti(rng);
  // Blend all 4 dimensions into a comma-separated string
  return `${multi.reverb}, ${multi.texture}, ${multi.stereo}, ${multi.dynamic}`;
}

/**
 * Helper function to select a single random item from an array.
 * 
 * @param items - Array to select from
 * @param rng - Random number generator for deterministic selection
 * @returns Single selected item
 */
function selectRandom<T>(items: readonly T[], rng: () => number): T {
  const idx = Math.floor(rng() * items.length);
  return items[idx] as T;
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
