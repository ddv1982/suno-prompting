import { GENRE_REGISTRY, type GenreType } from '@bun/instruments/genres';
import { parseGenreComponents } from '@bun/prompt/genre-parser';
import { randomIntInclusive, type Rng } from '@shared/utils/random';

/**
 * Regex pattern for max mode BPM format: bpm: "value"
 */
const MAX_MODE_BPM_REGEX = /^bpm:\s*"[^"]*"/im;

/**
 * Regex pattern for normal mode BPM format: BPM: value
 */
const NORMAL_MODE_BPM_REGEX = /^BPM:.*$/m;

/**
 * Spread (in BPM) for narrowed union when genres don't overlap.
 * The range will be midpoint ± (NARROW_RANGE_SPREAD / 2).
 */
const NARROW_RANGE_SPREAD = 60;

/**
 * Result type for blended BPM range calculations.
 */
export interface BpmRangeResult {
  /** Minimum BPM of the blended range */
  readonly min: number;
  /** Maximum BPM of the blended range */
  readonly max: number;
  /** True if the range is an intersection of overlapping genres, false if it's a narrowed union */
  readonly isIntersection: boolean;
}

/**
 * Get blended BPM range from multiple genre components.
 * Calculates intersection for overlapping ranges or narrowed union for non-overlapping.
 */
export function getBlendedBpmRange(genre: string): BpmRangeResult | null {
  const components = parseGenreComponents(genre);
  if (components.length === 0) return null;

  // Collect BPM ranges from all genres
  const ranges: { min: number; max: number }[] = [];

  for (const g of components) {
    const def = GENRE_REGISTRY[g];
    if (def?.bpm) {
      ranges.push({ min: def.bpm.min, max: def.bpm.max });
    }
  }

  if (ranges.length === 0) return null;
  const firstRange = ranges[0];
  if (ranges.length === 1 && firstRange) {
    return { min: firstRange.min, max: firstRange.max, isIntersection: true };
  }

  // Calculate intersection
  const intersectMin = Math.max(...ranges.map((r) => r.min));
  const intersectMax = Math.min(...ranges.map((r) => r.max));

  // If valid intersection exists
  if (intersectMin <= intersectMax) {
    return { min: intersectMin, max: intersectMax, isIntersection: true };
  }

  // No intersection - use expanded range (union)
  const unionMin = Math.min(...ranges.map((r) => r.min));
  const unionMax = Math.max(...ranges.map((r) => r.max));

  // Narrow the union to a reasonable range around the midpoint
  const midpoint = (unionMin + unionMax) / 2;

  return {
    min: Math.max(unionMin, Math.floor(midpoint - NARROW_RANGE_SPREAD / 2)),
    max: Math.min(unionMax, Math.ceil(midpoint + NARROW_RANGE_SPREAD / 2)),
    isIntersection: false,
  };
}

/**
 * Format BPM range for output.
 */
export function formatBpmRange(result: BpmRangeResult): string {
  return `between ${result.min} and ${result.max}`;
}

/**
 * Get a random BPM within the blended range.
 * Uses new multi-genre blending but returns single value for backward compatibility.
 */
export function getRandomBpmFromRange(
  genre: string,
  rng: Rng = Math.random
): number | null {
  const range = getBlendedBpmRange(genre);
  if (!range) return null;

  return randomIntInclusive(range.min, range.max, rng);
}

/**
 * Inject BPM as range string into prompt.
 * Replaces existing BPM line with range format.
 */
export function injectBpmRange(prompt: string, genre: string): string {
  const range = getBlendedBpmRange(genre);
  if (!range) return prompt;

  const rangeStr = formatBpmRange(range);

  if (MAX_MODE_BPM_REGEX.test(prompt)) {
    return prompt.replace(MAX_MODE_BPM_REGEX, `bpm: "${rangeStr}"`);
  }

  if (NORMAL_MODE_BPM_REGEX.test(prompt)) {
    return prompt.replace(NORMAL_MODE_BPM_REGEX, `BPM: ${rangeStr}`);
  }

  return prompt;
}

// ========================================
// Backward-compatible functions (existing API)
// ========================================

export function getRandomBpmForGenre(genre: string, rng: Rng = Math.random): number | null {
  // Handle multi-genre: "jazz fusion" → "jazz", "jazz, rock" → "jazz"
  const firstGenre = genre.split(',')[0]?.trim().toLowerCase() || '';
  const baseGenre = firstGenre.split(' ')[0] || firstGenre;

  const genreDef = GENRE_REGISTRY[baseGenre as GenreType];
  if (!genreDef?.bpm) return null;

  const { min, max } = genreDef.bpm;
  return randomIntInclusive(min, max, rng);
}

export function injectBpm(prompt: string, genre: string): string {
  const bpm = getRandomBpmForGenre(genre);
  if (!bpm) return prompt;

  if (MAX_MODE_BPM_REGEX.test(prompt)) {
    return prompt.replace(MAX_MODE_BPM_REGEX, `bpm: "${bpm}"`);
  }

  if (NORMAL_MODE_BPM_REGEX.test(prompt)) {
    return prompt.replace(NORMAL_MODE_BPM_REGEX, `BPM: ${bpm}`);
  }

  return prompt;
}
