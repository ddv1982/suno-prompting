/**
 * Mood Intensity Scaling Service
 *
 * Functions for selecting moods with intensity variants.
 * Applies mild/moderate/intense scaling based on mood category.
 *
 * @module mood/services/intensity
 */

import { MOOD_CATEGORIES } from '@bun/mood/categories';
import { MOOD_INTENSITY_MAP, getIntensityVariant } from '@bun/mood/intensity';

import type { IntensifiedMood, MoodCategory, MoodIntensity } from '@bun/mood/types';

/**
 * Select a mood from a category with intensity scaling applied.
 *
 * Randomly selects a base mood from the category, then applies
 * intensity scaling if a variant mapping exists.
 *
 * @param category - Mood category to select from
 * @param intensity - Desired intensity level (mild/moderate/intense)
 * @param rng - Random number generator (defaults to Math.random)
 * @returns IntensifiedMood object with category, mood, and intensity
 *
 * @example
 * selectMoodWithIntensity('emotional', 'mild');
 * // { category: 'emotional', mood: 'wistful', intensity: 'mild' }
 *
 * @example
 * selectMoodWithIntensity('energetic', 'intense');
 * // { category: 'energetic', mood: 'explosive', intensity: 'intense' }
 */
export function selectMoodWithIntensity(
  category: MoodCategory,
  intensity: MoodIntensity = 'moderate',
  rng: () => number = Math.random,
): IntensifiedMood {
  const definition = MOOD_CATEGORIES[category];

  // Get moods for this category
  const moods = definition?.moods ?? [];
  if (moods.length === 0) {
    // Fallback for unknown category
    return {
      category,
      mood: 'neutral',
      intensity,
    };
  }

  // Select random base mood
  const index = Math.floor(rng() * moods.length);
  const baseMood = moods[index] ?? 'neutral';

  // Apply intensity scaling
  const intensifiedMood = getIntensityVariant(baseMood, intensity);

  return {
    category,
    mood: intensifiedMood,
    intensity,
  };
}

/**
 * Check if a mood has intensity variants defined.
 *
 * @param mood - The mood word to check
 * @returns True if intensity variants exist for this mood
 */
export function moodHasIntensityVariants(mood: string): boolean {
  return mood.toLowerCase() in MOOD_INTENSITY_MAP;
}
