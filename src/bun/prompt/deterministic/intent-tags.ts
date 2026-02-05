/**
 * Intent-to-tag mappings for deterministic style generation.
 *
 * Maps listening intents to characteristic production tags that optimize
 * the generated music for specific use cases. These tags enhance style
 * prompts with intent-appropriate sonic characteristics.
 *
 * @module prompt/deterministic/intent-tags
 * @see spec.md Section 4.4 for intent classification requirements
 */

import type { Intent } from '@shared/schemas/thematic-context';

/**
 * Intent-specific production tags that define characteristic sonic qualities.
 *
 * Each intent maps to 2-3 production descriptors that capture the
 * aesthetic and functional requirements of that listening purpose.
 *
 * Tag selection rationale per intent:
 * - `background`: Optimized for non-intrusive listening (studying, working)
 * - `focal`: Optimized for active, engaged listening
 * - `cinematic`: Optimized for film/video soundtrack applications
 * - `dancefloor`: Optimized for club/party environments
 * - `emotional`: Optimized for personal, intimate listening experiences
 */
const INTENT_PRODUCTION_TAGS: Record<Intent, readonly string[]> = {
  background: ['subtle', 'ambient', 'non-intrusive'],
  focal: ['detailed', 'engaging', 'dynamic'],
  cinematic: ['dramatic', 'evolving', 'layered'],
  dancefloor: ['punchy', 'rhythmic', 'driving'],
  emotional: ['expressive', 'dynamic', 'intimate'],
} as const;

/**
 * Get production tags associated with a specific listening intent.
 *
 * Returns an array of 2-3 production tags that characterize the sonic
 * qualities appropriate for the specified listening intent. These tags
 * can be added to style prompts to optimize for specific use cases.
 *
 * @param intent - The listening intent to get tags for
 * @returns Array of production tags (2-3 tags, lowercase)
 *
 * @example
 * ```typescript
 * getIntentTags('background');
 * // ['subtle', 'ambient', 'non-intrusive']
 *
 * getIntentTags('cinematic');
 * // ['dramatic', 'evolving', 'layered']
 *
 * getIntentTags('dancefloor');
 * // ['punchy', 'rhythmic', 'driving']
 * ```
 */
export function getIntentTags(intent: Intent): readonly string[] {
  return INTENT_PRODUCTION_TAGS[intent];
}

/**
 * Get a limited number of production tags for an intent.
 *
 * Useful when tag budget is limited and only the most characteristic
 * tags should be selected. Returns the first N tags from the intent's
 * production tag list.
 *
 * @param intent - The listening intent to get tags for
 * @param limit - Maximum number of tags to return (default: 1)
 * @returns Array of production tags, limited to specified count
 *
 * @example
 * ```typescript
 * getIntentTagsLimited('cinematic', 1);
 * // ['dramatic']
 *
 * getIntentTagsLimited('dancefloor', 2);
 * // ['punchy', 'rhythmic']
 * ```
 */
export function getIntentTagsLimited(intent: Intent, limit = 1): readonly string[] {
  return INTENT_PRODUCTION_TAGS[intent].slice(0, limit);
}
