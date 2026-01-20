/**
 * Recording descriptor selection with conflict prevention
 * @module prompt/tags/recording-context/descriptors
 */

import {
  MAX_RECORDING_DESCRIPTORS,
  RECORDING_CHARACTER,
  RECORDING_ENVIRONMENT,
  RECORDING_PRODUCTION_QUALITY,
  RECORDING_TECHNIQUE,
} from './categories';
import { getPreferredEnvironment, getPreferredTechnique } from './genre-helpers';
import { selectFromSubcategory, selectRandomKey } from './helpers';

/**
 * Select recording descriptors with conflict prevention.
 * 
 * Structured selection ensures no conflicting tags (e.g., "professional" + "demo",
 * "analog" + "digital", "concert hall" + "bedroom").
 * 
 * Strategy:
 * 1. Pick ONE production quality (professional/demo/raw)
 * 2. Pick ONE environment (studio/live/home/rehearsal/outdoor) - genre-aware
 * 3. Pick ONE technique (analog/digital/hybrid) - genre-aware
 * 4. Optionally add characteristics (intimate/spacious/vintage/modern)
 * 
 * @param rng - Random number generator for deterministic selection
 * @param count - Number of descriptors to return (1-4)
 * @param genre - Optional genre for genre-aware selection
 * @returns Array of compatible recording descriptors
 * 
 * @example
 * // Basic usage
 * selectRecordingDescriptors(Math.random, 2)
 * // ["professional mastering polish", "studio session warmth"]
 * 
 * @example
 * // Genre-aware (electronic gets digital)
 * selectRecordingDescriptors(Math.random, 3, 'electronic')
 * // ["professional mastering polish", "studio session warmth", "digital production clarity"]
 * 
 * @example
 * // Genre-aware (jazz gets analog + live)
 * selectRecordingDescriptors(Math.random, 3, 'jazz')
 * // ["raw performance energy", "live venue capture", "warm analog console"]
 */
export function selectRecordingDescriptors(
  rng: () => number = Math.random,
  count = 3,
  genre?: string
): string[] {
  const selected: string[] = [];
  const clampedCount = Math.max(1, Math.min(MAX_RECORDING_DESCRIPTORS, count));
  
  // 1. Pick ONE production quality
  const qualityKey = selectRandomKey(RECORDING_PRODUCTION_QUALITY, rng);
  const quality = selectFromSubcategory(RECORDING_PRODUCTION_QUALITY, qualityKey, rng);
  selected.push(quality);
  
  if (clampedCount >= 2) {
    // 2. Pick ONE environment (genre-aware)
    const preferredEnv = getPreferredEnvironment(genre);
    const envKey = preferredEnv ?? selectRandomKey(RECORDING_ENVIRONMENT, rng);
    const environment = selectFromSubcategory(RECORDING_ENVIRONMENT, envKey, rng);
    selected.push(environment);
  }
  
  if (clampedCount >= 3) {
    // 3. Pick ONE technique (genre-aware)
    const preferredTech = getPreferredTechnique(genre);
    const techKey = preferredTech ?? selectRandomKey(RECORDING_TECHNIQUE, rng);
    const technique = selectFromSubcategory(RECORDING_TECHNIQUE, techKey, rng);
    selected.push(technique);
  }
  
  if (clampedCount >= 4) {
    // 4. Optionally add character
    const charKey = selectRandomKey(RECORDING_CHARACTER, rng);
    const character = selectFromSubcategory(RECORDING_CHARACTER, charKey, rng);
    selected.push(character);
  }
  
  return selected;
}
