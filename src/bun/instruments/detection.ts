import { HARMONIC_STYLES, ALL_COMBINATIONS } from '@bun/instruments/modes';
import type { HarmonicStyle, CombinationType } from '@bun/instruments/modes';
import { GENRE_REGISTRY } from '@bun/instruments/genres';
import type { GenreType } from '@bun/instruments/genres';
import { RHYTHMIC_STYLES } from '@bun/instruments/data';
import type { RhythmicStyle } from '@bun/instruments/data';

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
  return detectFromKeywords(description, HARMONIC_STYLES, HARMONIC_PRIORITY);
}

export function detectRhythmic(description: string): RhythmicStyle | null {
  return detectFromKeywords(description, RHYTHMIC_STYLES, RHYTHMIC_PRIORITY);
}

export function detectGenre(description: string): GenreType | null {
  const lower = description.toLowerCase();
  for (const [key, genre] of Object.entries(GENRE_REGISTRY)) {
    if (genre.keywords.some(kw => lower.includes(kw))) {
      return key as GenreType;
    }
  }
  return null;
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
  return detectFromKeywords(description, ALL_COMBINATIONS, COMBINATION_PRIORITY);
}
