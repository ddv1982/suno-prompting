// Production elements based on professional prompt patterns
// These add recording character, space, and texture descriptors

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
] as const;

export type RecordingTexture = typeof RECORDING_TEXTURES[number];

export const STEREO_IMAGING = [
  'Wide Stereo',
  'Narrow Mono',
  'Centered Focus',
  'Panned Elements',
  'Spacious Mix',
  'Tight Centered Mix',
  'Immersive Surround Feel',
] as const;

export type StereoImaging = typeof STEREO_IMAGING[number];

export const DYNAMIC_DESCRIPTORS = [
  'Dynamic Range',
  'Compressed Punch',
  'Natural Dynamics',
  'Limiting for Loudness',
  'Soft to Powerful Build',
  'Consistent Energy',
  'Breathing Room',
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
const DEFAULT_PRODUCTION_STYLE = {
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

// Build production descriptor string
export function buildProductionDescriptor(
  genre: string,
  rng: () => number = Math.random
): string {
  const { reverb, texture } = getProductionSuggestionsForGenre(genre, rng);
  return `${texture}, ${reverb}`;
}
