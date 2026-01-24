/**
 * Era-to-production-tag mappings for deterministic style generation.
 *
 * Maps production eras to characteristic production tags that define
 * the sonic qualities of recordings from that period. These tags
 * enhance style prompts with era-appropriate production characteristics.
 *
 * @module prompt/deterministic/era-tags
 * @see spec.md Section 4.1 for era tag mapping requirements
 */

import type { Era } from '@shared/schemas/thematic-context';

/**
 * Era-specific production tags that define characteristic sonic qualities.
 *
 * Each era maps to 3-5 production descriptors that capture the
 * recording techniques, equipment, and aesthetic preferences of that period.
 */
const ERA_PRODUCTION_TAGS: Record<Era, readonly string[]> = {
  '50s-60s': [
    'mono recording',
    'tube warmth',
    'vintage reverb',
    'lo-fi crackle',
    'warm distortion',
  ],
  '70s': [
    'analog warmth',
    'tape saturation',
    'wide stereo',
    'warm bass',
    'natural room sound',
  ],
  '80s': [
    'gated reverb',
    'digital clarity',
    'synth pads',
    'bright highs',
    'punchy drums',
  ],
  '90s': [
    'compressed drums',
    'lo-fi aesthetic',
    'raw energy',
    'grunge texture',
    'distorted guitars',
  ],
  '2000s': [
    'polished production',
    'digital precision',
    'loud mastering',
    'layered vocals',
    'clean mix',
  ],
  modern: [
    'hybrid analog-digital',
    'pristine clarity',
    'dynamic range',
    'spatial audio',
    'crisp transients',
  ],
} as const;

/**
 * Get production tags associated with a specific production era.
 *
 * Returns an array of 3-5 production tags that characterize the sonic
 * qualities of recordings from the specified era. These tags can be
 * added to style prompts to achieve era-authentic production characteristics.
 *
 * @param era - The production era to get tags for
 * @returns Array of production tags (3-5 tags, lowercase)
 *
 * @example
 * ```typescript
 * getEraProductionTags('70s');
 * // ['analog warmth', 'tape saturation', 'wide stereo', 'warm bass', 'natural room sound']
 *
 * getEraProductionTags('80s');
 * // ['gated reverb', 'digital clarity', 'synth pads', 'bright highs', 'punchy drums']
 * ```
 */
export function getEraProductionTags(era: Era): readonly string[] {
  return ERA_PRODUCTION_TAGS[era];
}

/**
 * Get a limited number of production tags for an era.
 *
 * Useful when tag budget is limited and only the most characteristic
 * tags should be selected. Returns the first N tags from the era's
 * production tag list.
 *
 * @param era - The production era to get tags for
 * @param limit - Maximum number of tags to return (default: 2)
 * @returns Array of production tags, limited to specified count
 *
 * @example
 * ```typescript
 * getEraProductionTagsLimited('70s', 2);
 * // ['analog warmth', 'tape saturation']
 * ```
 */
export function getEraProductionTagsLimited(era: Era, limit = 2): readonly string[] {
  return ERA_PRODUCTION_TAGS[era].slice(0, limit);
}
