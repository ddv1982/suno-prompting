/**
 * Temporal and timing descriptors
 * @module prompt/tags/temporal
 */

/**
 * Temporal and timing descriptors for rhythmic feel.
 * Influences perceived timing and groove.
 * 
 * Total tags: 12 across 3 categories
 * 
 * @example
 * // Access specific category
 * TEMPORAL_EFFECT_TAGS.timing // ['swing feel', 'straight time', ...]
 */
export const TEMPORAL_EFFECT_TAGS = {
  /** Timing feel (4 tags) */
  timing: [
    'swing feel',
    'straight time',
    'rushed timing',
    'laid-back groove',
  ],
  
  /** Micro-timing (4 tags) */
  microTiming: [
    'human timing drift',
    'quantized precision',
    'micro-rubato',
    'tight timing',
  ],
  
  /** Groove (4 tags) */
  groove: [
    'groove pocket',
    'stiff quantization',
    'loose feel',
    'locked groove',
  ],
} as const;

/**
 * Select temporal effect tags for timing and groove.
 * 
 * Flattens all TEMPORAL_EFFECT_TAGS categories, shuffles deterministically,
 * and returns up to `count` tags.
 * 
 * @param count - Maximum number of tags to return
 * @param rng - Random number generator function (0.0-1.0) for deterministic selection
 * @returns Array of temporal effect tags
 * 
 * @example
 * selectTemporalTags(1, seedRng(42)) // ['swing feel']
 */
export function selectTemporalTags(count: number, rng: () => number = Math.random): string[] {
  const allTags: string[] = [];
  for (const category of Object.values(TEMPORAL_EFFECT_TAGS)) {
    allTags.push(...category);
  }
  
  const shuffled = [...allTags].sort(() => rng() - 0.5);
  return shuffled.slice(0, count);
}
