import { GENRE_REGISTRY } from '@bun/instruments/genres';
import { toCanonical } from '@bun/instruments/registry';

export type InstrumentClass = 'foundational' | 'multigenre' | 'genre';

// Keep this list intentionally small and broadly applicable.
// It can be expanded as we learn what reliably anchors prompts.
export const FOUNDATIONAL_INSTRUMENTS = [
  'drums',
  'kick drum',
  'hi-hat',
  'snare drum',
  'bass',
  'sub-bass',
  'strings',
  'synth pad',
  'synth',
  'analog synth',
  'digital synth',
  'FM synth',
  'arpeggiator',
  'percussion',
] as const;

const FOUNDATIONAL_SET = new Set<string>(FOUNDATIONAL_INSTRUMENTS.map(i => i.toLowerCase()));

export function isFoundationalInstrument(instrument: string): boolean {
  return FOUNDATIONAL_SET.has(instrument.toLowerCase());
}

export type InstrumentToGenresIndex = {
  readonly genresByInstrument: Map<string, Set<string>>;
  readonly canonicalByLower: Map<string, string>;
};

export function buildInstrumentToGenresIndex(): InstrumentToGenresIndex {
  const genresByInstrument = new Map<string, Set<string>>();
  const canonicalByLower = new Map<string, string>();
  for (const genre of Object.values(GENRE_REGISTRY)) {
    for (const pool of Object.values(genre.pools)) {
      for (const instrument of pool.instruments) {
        const canonical = toCanonical(instrument) ?? instrument;
        const key = canonical.toLowerCase();
        if (!canonicalByLower.has(key)) canonicalByLower.set(key, canonical);
        const set = genresByInstrument.get(key) ?? new Set<string>();
        set.add(genre.name);
        genresByInstrument.set(key, set);
      }
    }
  }
  return { genresByInstrument, canonicalByLower };
}

export function computeMultiGenreInstruments(threshold = 3): string[] {
  const { genresByInstrument, canonicalByLower } = buildInstrumentToGenresIndex();
  return [...genresByInstrument.entries()]
    .filter(([instrumentLower, genres]) => genres.size >= threshold && !isFoundationalInstrument(instrumentLower))
    .map(([instrumentLower]) => canonicalByLower.get(instrumentLower) ?? instrumentLower)
    .sort();
}

export const MULTIGENRE_THRESHOLD = 3 as const;
export const MULTIGENRE_INSTRUMENTS = computeMultiGenreInstruments(MULTIGENRE_THRESHOLD);

const MULTIGENRE_SET = new Set<string>(MULTIGENRE_INSTRUMENTS.map(i => i.toLowerCase()));

export function isMultiGenreInstrument(instrument: string): boolean {
  return MULTIGENRE_SET.has(instrument.toLowerCase());
}

export function getInstrumentClass(instrument: string): InstrumentClass {
  const key = instrument.toLowerCase();
  if (isFoundationalInstrument(key)) return 'foundational';
  if (isMultiGenreInstrument(key)) return 'multigenre';
  return 'genre';
}
