import type { CreativityLevel } from '@shared/types';

/**
 * Maps a slider value (0-100) to a creativity level.
 * Uses 5 equal 20% ranges for clean slider positions at 0, 25, 50, 75, 100.
 * 
 * Ranges:
 * - 0-20: 'low' (single genres only)
 * - 21-40: 'safe' (registry multi-genre)
 * - 41-60: 'normal' (balanced)
 * - 61-80: 'adventurous' (unusual combos)
 * - 81-100: 'high' (experimental/invent new)
 */
export function getCreativityLevel(value: number): CreativityLevel {
  if (value <= 20) return 'low';
  if (value <= 40) return 'safe';
  if (value <= 60) return 'normal';
  if (value <= 80) return 'adventurous';
  return 'high';
}
