import { HARMONIC_STYLES, RHYTHMIC_STYLES, AMBIENT_KEYWORDS } from './data';
import type { HarmonicStyle, RhythmicStyle } from './data';

const HARMONIC_PRIORITY: HarmonicStyle[] = ['lydian_dominant', 'lydian_augmented', 'lydian_sharp_two', 'lydian'];
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

export function detectAmbient(description: string): boolean {
  const lower = description.toLowerCase();
  return AMBIENT_KEYWORDS.some(kw => lower.includes(kw));
}
