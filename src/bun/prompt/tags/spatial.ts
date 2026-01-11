/**
 * Spatial audio and reverb descriptors
 * @module prompt/tags/spatial
 */

/**
 * Spatial audio and reverb descriptors for stereo imaging.
 * Controls perceived space and depth in the mix.
 * 
 * Total tags: 22 across 5 categories
 * 
 * @example
 * // Access specific category
 * SPATIAL_AUDIO_TAGS.width // ['wide stereo field', 'narrow mono image', ...]
 */
export const SPATIAL_AUDIO_TAGS = {
  /** Stereo width (5 tags) */
  width: [
    'wide stereo field',
    'narrow mono image',
    'centered focus',
    'immersive soundstage',
    'mono-compatible mix',
  ],
  
  /** Reverb depth (5 tags) */
  depth: [
    'deep reverb space',
    'shallow room sound',
    'intimate dry space',
    'cavernous reverb',
    'tight ambience',
  ],
  
  /** Early reflections (4 tags) */
  reflections: [
    'early reflections emphasized',
    'smooth reverb tail',
    'diffuse reflections',
    'clear early reflections',
  ],
  
  /** Spatial positioning (4 tags) */
  positioning: [
    'center-focused elements',
    'wide panning',
    'binaural spacing',
    'left-right separation',
  ],
  
  /** Ambience (4 tags) */
  ambience: [
    'room ambience present',
    'atmospheric space',
    'dead room character',
    'environmental reverb',
  ],
} as const;

/**
 * Select spatial audio tags for stereo imaging and reverb.
 * 
 * Flattens all SPATIAL_AUDIO_TAGS categories, shuffles deterministically,
 * and returns up to `count` tags.
 * 
 * @param count - Maximum number of tags to return
 * @param rng - Random number generator function (0.0-1.0) for deterministic selection
 * @returns Array of spatial audio tags
 * 
 * @example
 * selectSpatialTags(1, seedRng(42)) // ['wide stereo field']
 */
export function selectSpatialTags(count: number, rng: () => number = Math.random): string[] {
  const allTags: string[] = [];
  for (const category of Object.values(SPATIAL_AUDIO_TAGS)) {
    allTags.push(...category);
  }
  
  const shuffled = [...allTags].sort(() => rng() - 0.5);
  return shuffled.slice(0, count);
}
