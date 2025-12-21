import { HARMONIC_STYLES, RHYTHMIC_STYLES, GENRE_INSTRUMENTS } from './data';
import type { HarmonicStyle, RhythmicStyle, Genre } from './data';

const HARMONIC_PRIORITY: HarmonicStyle[] = ['lydian_dominant', 'lydian_augmented', 'lydian_sharp_two', 'lydian'];
const RHYTHMIC_PRIORITY: RhythmicStyle[] = ['polyrhythm'];
const GENRE_PRIORITY: Genre[] = ['ambient'];

export function detectHarmonic(description: string): HarmonicStyle | null {
  const lower = description.toLowerCase();
  for (const style of HARMONIC_PRIORITY) {
    if (HARMONIC_STYLES[style].keywords.some(kw => lower.includes(kw))) {
      return style;
    }
  }
  return null;
}

export function detectRhythmic(description: string): RhythmicStyle | null {
  const lower = description.toLowerCase();
  for (const style of RHYTHMIC_PRIORITY) {
    if (RHYTHMIC_STYLES[style].keywords.some(kw => lower.includes(kw))) {
      return style;
    }
  }
  return null;
}

export function detectGenre(description: string): Genre | null {
  const lower = description.toLowerCase();
  for (const genre of GENRE_PRIORITY) {
    if (GENRE_INSTRUMENTS[genre].keywords.some(kw => lower.includes(kw))) {
      return genre;
    }
  }
  return null;
}
