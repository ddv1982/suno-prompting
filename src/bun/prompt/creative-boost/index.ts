/**
 * Creative Boost Deterministic Templates
 *
 * Provides genre pools and fusion rules for each creativity level,
 * enabling fully deterministic generation without LLM calls.
 *
 * @module prompt/creative-boost
 */

// Main builder
export { buildDeterministicCreativeBoost, mapSliderToLevel } from './builder';

// Constants
export {
  ADVENTUROUS_TRIPLE_PROBABILITY,
  NORMAL_BLEND_PROBABILITY,
  NORMAL_SUFFIX_PROBABILITY,
  SAFE_MULTI_GENRE_PROBABILITY,
} from './constants';

// Pools
export { CREATIVE_TITLE_WORDS, CREATIVITY_POOLS, HIGH_BASE_GENRES, HIGH_FUSION_GENRES, MOOD_POOLS } from './pools';

// Selection functions
export {
  generateDeterministicCreativeBoostTitle,
  getInstrumentsForGenre,
  getSunoStylesForMoodCategory,
  selectGenreForLevel,
  selectMoodForLevel,
} from './selection';

// Types
export type { BuildCreativeBoostOptions, CreativityLevel, CreativityPool, MoodCategory } from './types';

// Legacy helper (for backward compatibility)
import { CREATIVITY_POOLS } from './pools';

import type { CreativityPool } from './types';
import type { CreativityLevel } from '@shared/types';


export function getCreativityPool(level: CreativityLevel): CreativityPool {
  return CREATIVITY_POOLS[level];
}
