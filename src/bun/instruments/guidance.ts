import { HARMONIC_STYLES, RHYTHMIC_STYLES, GENRE_INSTRUMENTS } from './data';
import type { HarmonicStyle, RhythmicStyle, Genre } from './data';

function shuffle<T>(arr: readonly T[]): T[] {
  const result = [...arr];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j]!, result[i]!];
  }
  return result;
}

function pickRandom<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]!;
}

export function getHarmonicGuidance(style: HarmonicStyle): string {
  const s = HARMONIC_STYLES[style];
  const chars = shuffle(s.characteristics).slice(0, 3);
  const prog = pickRandom(s.progressions);

  return [
    `HARMONIC STYLE (${s.name}):`,
    s.description,
    `Chord: ${s.chordType}`,
    `Formula: ${s.formula}`,
    ...chars.map(c => `- ${c}`),
    `Suggested Progression: ${prog}`,
    `Examples: ${s.keyExamples}`,
  ].join('\n');
}

export function getRhythmicGuidance(style: RhythmicStyle): string {
  const s = RHYTHMIC_STYLES[style];
  const chars = shuffle(s.characteristics).slice(0, 3);
  
  return [
    `RHYTHMIC STYLE (${s.name}):`,
    s.description,
    `Common ratios: ${s.commonRatios}`,
    `Suggested elements: ${s.instruments}`,
    ...chars.map(c => `- ${c}`),
  ].join('\n');
}

export function getGenreInstruments(genre: Genre): string {
  const g = GENRE_INSTRUMENTS[genre];
  
  // Simple random selection: pick 4 or 5 instruments
  const count = 4 + Math.floor(Math.random() * 2);
  const instruments = shuffle(g.instruments).slice(0, count);

  return [
    `SUGGESTED INSTRUMENTS (${g.name}):`,
    g.description,
    ...instruments.map(i => `- ${i}`),
  ].join('\n');
}
