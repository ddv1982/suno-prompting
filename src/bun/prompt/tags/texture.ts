/**
 * Recording texture descriptors
 * @module prompt/tags/texture
 */

/**
 * Recording texture descriptors for overall sonic character.
 * Expanded from existing recording context concepts.
 * 
 * Total tags: 21 across 5 categories
 * 
 * @example
 * // Access specific category
 * TEXTURE_DESCRIPTORS.polish // ['polished production', 'raw texture', ...]
 */
export const TEXTURE_DESCRIPTORS = {
  /** Polish level (4 tags) */
  polish: [
    'polished production',
    'raw texture',
    'demo quality',
    'professional sheen',
  ],
  
  /** Analog/digital character (5 tags) */
  character: [
    'analog warmth',
    'digital precision',
    'tape saturation',
    'crystal clear',
    'vintage warmth',
  ],
  
  /** Fidelity (4 tags) */
  fidelity: [
    'lo-fi dusty',
    'hi-fi clarity',
    'mid-fi character',
    'bootleg quality',
  ],
  
  /** Organic/synthetic (4 tags) */
  nature: [
    'organic feel',
    'synthetic sheen',
    'acoustic authenticity',
    'electronic polish',
  ],
  
  /** Space and depth (4 tags) */
  space: [
    'layered depth',
    'flat 2d mix',
    'atmospheric space',
    'intimate close-up',
  ],
} as const;

/**
 * Select texture descriptor tags for sonic character.
 * 
 * Flattens all TEXTURE_DESCRIPTORS categories, shuffles deterministically,
 * and returns up to `count` tags.
 * 
 * @param count - Maximum number of tags to return
 * @param rng - Random number generator function (0.0-1.0) for deterministic selection
 * @returns Array of texture descriptor tags
 * 
 * @example
 * selectTextureTags(1, seedRng(42)) // ['polished production']
 */
export function selectTextureTags(count: number, rng: () => number = Math.random): string[] {
  const allTags: string[] = [];
  for (const category of Object.values(TEXTURE_DESCRIPTORS)) {
    allTags.push(...category);
  }
  
  const shuffled = [...allTags].sort(() => rng() - 0.5);
  return shuffled.slice(0, count);
}
