/**
 * Creative Boost Constants
 *
 * Probability thresholds and configuration constants.
 *
 * @module prompt/creative-boost/constants
 */

import type { MoodIntensity } from '@bun/mood/types';
import type { CreativityLevel } from '@shared/types';

/**
 * Map creativity level to mood intensity.
 *
 * Low/Safe → mild: Subtle, understated expression
 * Normal → moderate: Standard, balanced expression
 * Adventurous/High → intense: Strong, powerful expression
 */
export const CREATIVITY_TO_INTENSITY: Record<CreativityLevel, MoodIntensity> = {
  low: 'mild',
  safe: 'mild',
  normal: 'moderate',
  adventurous: 'intense',
  high: 'intense',
};

/**
 * Probability of blending two genres at "normal" creativity level.
 * Set to 40% to favor single genres while still providing variety.
 * Higher values would make blends too common; lower values too rare.
 */
export const NORMAL_BLEND_PROBABILITY = 0.4;

/**
 * Probability of using three genres instead of two at "adventurous" level.
 * Set to 30% to keep triple-genre fusions relatively rare and special.
 * Most adventurous outputs will be interesting dual-genre blends.
 */
export const ADVENTUROUS_TRIPLE_PROBABILITY = 0.3;

/**
 * Probability of using multi-genre combinations from registry at "safe" level.
 * Set to 70% to strongly prefer established combinations over single genres.
 */
export const SAFE_MULTI_GENRE_PROBABILITY = 0.7;

/**
 * Probability of adding suffix to "normal" level titles.
 * Set to 30% to occasionally add variety without overdoing it.
 */
export const NORMAL_SUFFIX_PROBABILITY = 0.3;
