/**
 * Harmonic and frequency descriptors
 * @module prompt/tags/harmonic
 */

import { selectRandomN } from '@shared/utils/random';

/**
 * Harmonic and frequency descriptors for tonal character.
 * Based on Suno V5 harmonic enhancement capabilities.
 * 
 * Total tags: 17 across 4 categories
 * 
 * @example
 * // Access specific category
 * HARMONIC_DESCRIPTORS.stacking // ['stacked harmonies', 'tight harmonies', ...]
 */
export const HARMONIC_DESCRIPTORS = {
  /** Harmony stacking (5 tags) */
  stacking: [
    'stacked harmonies',
    'tight harmonies',
    'wide harmony spread',
    'octave doubles',
    'unison harmonies',
  ],
  
  /** Harmonic richness (4 tags) */
  richness: [
    'harmonic richness',
    'overtone emphasis',
    'fundamental focus',
    'harmonic saturation',
  ],
  
  /** Frequency balance (4 tags) */
  balance: [
    'balanced frequency spectrum',
    'warm low mids',
    'bright high end',
    'scooped midrange',
  ],
  
  /** Tonal character (4 tags) */
  character: [
    'tonal warmth',
    'harmonic clarity',
    'vintage harmonic distortion',
    'clean harmonic structure',
  ],
} as const;

/**
 * Select harmonic descriptor tags for tonal character.
 * 
 * Flattens all HARMONIC_DESCRIPTORS categories, shuffles deterministically,
 * and returns up to `count` tags.
 * 
 * @param count - Maximum number of tags to return
 * @param rng - Random number generator function (0.0-1.0) for deterministic selection
 * @returns Array of harmonic descriptor tags
 * 
 * @example
 * selectHarmonicTags(1, seedRng(42)) // ['harmonic richness']
 */
export function selectHarmonicTags(count: number, rng: () => number = Math.random): string[] {
  const allTags: string[] = [];
  for (const category of Object.values(HARMONIC_DESCRIPTORS)) {
    allTags.push(...category);
  }
  
  return selectRandomN(allTags, Math.min(count, allTags.length), rng);
}
