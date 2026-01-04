import { RHYTHMIC_STYLES } from '@bun/instruments/datasets/rhythm';
import { GENRE_REGISTRY } from '@bun/instruments/genres';
import { HARMONIC_STYLES, ALL_COMBINATIONS } from '@bun/instruments/modes';
import { ALL_POLYRHYTHM_COMBINATIONS, TIME_SIGNATURES, TIME_SIGNATURE_JOURNEYS } from '@bun/instruments/rhythms';

import type { RhythmicStyle } from '@bun/instruments/datasets/rhythm';
import type { GenreType } from '@bun/instruments/genres';
import type { HarmonicStyle, CombinationType } from '@bun/instruments/modes';
import type { PolyrhythmCombinationType, TimeSignatureType, TimeSignatureJourneyType } from '@bun/instruments/rhythms';

// Memoization cache for detection functions
// Uses a simple LRU-like approach with max size to prevent memory leaks
const CACHE_MAX_SIZE = 100;
const detectionCache = new Map<string, unknown>();

function memoize<T>(cacheKey: string, compute: () => T): T {
  if (detectionCache.has(cacheKey)) {
    return detectionCache.get(cacheKey) as T;
  }
  
  const result = compute();
  
  // Simple cache eviction: clear half when full
  if (detectionCache.size >= CACHE_MAX_SIZE) {
    const keysToDelete = Array.from(detectionCache.keys()).slice(0, CACHE_MAX_SIZE / 2);
    for (const key of keysToDelete) {
      detectionCache.delete(key);
    }
  }
  
  detectionCache.set(cacheKey, result);
  return result;
}

const HARMONIC_PRIORITY: HarmonicStyle[] = [
  'lydian_dominant', 'lydian_augmented', 'lydian_sharp_two',
  'harmonic_minor', 'melodic_minor',
  'phrygian', 'locrian',
  'dorian', 'mixolydian',
  'lydian', 'aeolian', 'ionian',
];
const RHYTHMIC_PRIORITY: RhythmicStyle[] = ['polyrhythm'];

function detectFromKeywords<K extends string>(
  description: string,
  data: Record<K, { keywords: readonly string[] }>,
  priority: readonly K[]
): K | null {
  const lower = description.toLowerCase();
  for (const key of priority) {
    if (data[key].keywords.some(kw => lower.includes(kw))) {
      return key;
    }
  }
  return null;
}

export function detectHarmonic(description: string): HarmonicStyle | null {
  return memoize(`harmonic:${description}`, () => 
    detectFromKeywords(description, HARMONIC_STYLES, HARMONIC_PRIORITY)
  );
}

export function detectRhythmic(description: string): RhythmicStyle | null {
  return memoize(`rhythmic:${description}`, () =>
    detectFromKeywords(description, RHYTHMIC_STYLES, RHYTHMIC_PRIORITY)
  );
}

export const GENRE_PRIORITY: GenreType[] = [
  'videogame', 'synthwave', 'lofi', 'cinematic',
  'jazz', 'classical', 'folk', 'rnb',
  'country', 'soul', 'blues', 'punk', 'latin', 'symphonic', 'metal', 'trap', 'retro',
  'disco', 'funk', 'reggae', 'afrobeat', 'house', 'trance',
  'downtempo', 'dreampop', 'chillwave', 'newage',
  'hyperpop', 'drill', 'melodictechno', 'indie',
  'electronic', 'rock', 'pop',
  'ambient',
];

export function detectGenre(description: string): GenreType | null {
  return memoize(`genre:${description}`, () => {
    const lower = description.toLowerCase();
    for (const key of GENRE_PRIORITY) {
      const genre = GENRE_REGISTRY[key];
      // Match against name (case-insensitive)
      if (lower.includes(genre.name.toLowerCase())) {
        return key;
      }
      // Match against keywords
      if (genre.keywords.some(kw => lower.includes(kw))) {
        return key;
      }
    }
    return null;
  });
}

export function detectAmbient(description: string): boolean {
  return detectGenre(description) === 'ambient';
}

const COMBINATION_PRIORITY: CombinationType[] = [
  'major_minor', 'lydian_minor', 'lydian_major', 'dorian_lydian',
  'harmonic_major', 'phrygian_major',
  'minor_journey', 'lydian_exploration', 'major_modes', 'dark_modes',
];

export function detectCombination(description: string): CombinationType | null {
  return memoize(`combination:${description}`, () =>
    detectFromKeywords(description, ALL_COMBINATIONS, COMBINATION_PRIORITY)
  );
}

const POLYRHYTHM_COMBINATION_PRIORITY: PolyrhythmCombinationType[] = [
  'complexity_build', 'triplet_exploration', 'odd_journey', 'tension_arc',
  'groove_to_drive', 'tension_release', 'afrobeat_journey', 'complex_simple',
];

export function detectPolyrhythmCombination(description: string): PolyrhythmCombinationType | null {
  return memoize(`polyrhythm:${description}`, () =>
    detectFromKeywords(description, ALL_POLYRHYTHM_COMBINATIONS, POLYRHYTHM_COMBINATION_PRIORITY)
  );
}

const TIME_SIGNATURE_PRIORITY: TimeSignatureType[] = [
  'time_13_8', 'time_11_8', 'time_15_8',
  'time_9_8', 'time_7_8', 'time_7_4',
  'time_5_8', 'time_5_4',
  'time_6_8', 'time_3_4', 'time_4_4',
];

export function detectTimeSignature(description: string): TimeSignatureType | null {
  return memoize(`timesig:${description}`, () =>
    detectFromKeywords(description, TIME_SIGNATURES, TIME_SIGNATURE_PRIORITY)
  );
}

const TIME_SIGNATURE_JOURNEY_PRIORITY: TimeSignatureJourneyType[] = [
  'prog_odyssey', 'balkan_fusion', 'jazz_exploration',
  'math_rock_descent', 'celtic_journey', 'metal_complexity', 'gentle_odd',
];

export function detectTimeSignatureJourney(description: string): TimeSignatureJourneyType | null {
  return memoize(`journey:${description}`, () =>
    detectFromKeywords(description, TIME_SIGNATURE_JOURNEYS, TIME_SIGNATURE_JOURNEY_PRIORITY)
  );
}
