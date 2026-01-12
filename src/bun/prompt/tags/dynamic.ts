/**
 * Dynamic range and compression descriptors
 * @module prompt/tags/dynamic
 */

/**
 * Dynamic range and compression descriptors.
 * Controls perceived loudness and dynamics.
 * 
 * Total tags: 15 across 4 categories
 * 
 * @example
 * // Access specific category
 * DYNAMIC_RANGE_TAGS.compression // ['natural dynamics', 'compressed punch', ...]
 */
export const DYNAMIC_RANGE_TAGS = {
  /** Compression style (5 tags) */
  compression: [
    'natural dynamics',
    'compressed punch',
    'brickwall limiting',
    'vintage compression',
    'gentle compression',
  ],
  
  /** Dynamic contrast (4 tags) */
  contrast: [
    'high dynamic contrast',
    'consistent energy',
    'dynamic breathing room',
    'controlled peaks',
  ],
  
  /** Loudness (3 tags) */
  loudness: [
    'modern loudness',
    'vintage dynamic range',
    'mastered for streaming',
  ],
  
  /** Transients (3 tags) */
  transients: [
    'punchy transients',
    'soft transients',
    'transient emphasis',
  ],
} as const;

/**
 * Select dynamic range tags for compression and loudness.
 * 
 * Flattens all DYNAMIC_RANGE_TAGS categories, shuffles deterministically,
 * and returns up to `count` tags.
 * 
 * @param count - Maximum number of tags to return
 * @param rng - Random number generator function (0.0-1.0) for deterministic selection
 * @returns Array of dynamic range tags
 * 
 * @example
 * selectDynamicTags(1, seedRng(42)) // ['natural dynamics']
 */
export function selectDynamicTags(count: number, rng: () => number = Math.random): string[] {
  const allTags: string[] = [];
  for (const category of Object.values(DYNAMIC_RANGE_TAGS)) {
    allTags.push(...category);
  }
  
  const shuffled = [...allTags].sort(() => rng() - 0.5);
  return shuffled.slice(0, count);
}
