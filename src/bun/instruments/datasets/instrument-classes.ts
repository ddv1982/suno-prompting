import { GENRE_REGISTRY } from '@bun/instruments/genres';
import { toCanonical } from '@bun/instruments/registry';

export type InstrumentClass = 'foundational' | 'multigenre' | 'orchestralColor' | 'genre';

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

// Cross-genre in the broad sense, but should be treated as an optional flavor layer.
// (We keep it separate from “multi-genre wildcards” so non-orchestral genres don't
// constantly drift into cinematic instrumentation.)
export const ORCHESTRAL_COLOR_INSTRUMENTS = [
  'celesta',
  'glockenspiel',
  'harp',
  'violin',
  'cello',
  'french horn',
  'timpani',
  'taiko drums',
  'choir',
  'wordless choir',
  // Woodwinds
  'piccolo',
  'english horn',
  'bass clarinet',
  'contrabassoon',
  // Brass
  'tuba',
  'bass trombone',
  // Voice
  'solo soprano',
  // Percussion
  'suspended cymbal',
  'crash cymbal',
  'tam tam',
  'mark tree',
  'orchestral bass drum',
] as const;

// Override lists to curate multi-genre “wildcards” for modern Suno prompts.
// These should be instruments that are broadly usable without pulling the song
// into orchestral/cinematic territory.
export const MULTIGENRE_FORCE_INCLUDE = [
  '808',
  'Clavinet',
  'Hammond organ',
  'Rhodes',
  'Wurlitzer',
  'electric piano',
  'vibraphone',
  'bells',
  'guitar',
  'acoustic guitar',
  // Added from multi-genre audit (2024-12-30)
  'muted trumpet',
  'mellotron',
  'marimba',
  'pedal steel',
  'finger snaps',
  'synth choir',
] as const;

export const MULTIGENRE_FORCE_EXCLUDE = [
  'felt piano',
  'jazz brushes',
  'trumpet',
  'flute',
  'clarinet',
] as const;

const FOUNDATIONAL_SET = new Set<string>(FOUNDATIONAL_INSTRUMENTS.map(i => i.toLowerCase()));
const ORCHESTRAL_COLOR_SET = new Set<string>(ORCHESTRAL_COLOR_INSTRUMENTS.map(i => i.toLowerCase()));
const MULTIGENRE_FORCE_EXCLUDE_SET = new Set<string>(
  MULTIGENRE_FORCE_EXCLUDE.map(i => i.toLowerCase())
);

export function isFoundationalInstrument(instrument: string): boolean {
  return FOUNDATIONAL_SET.has(instrument.toLowerCase());
}

export function isOrchestralColorInstrument(instrument: string): boolean {
  return ORCHESTRAL_COLOR_SET.has(instrument.toLowerCase());
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

  const computed = [...genresByInstrument.entries()]
    .filter(
      ([instrumentLower, genres]) =>
        genres.size >= threshold &&
        !isFoundationalInstrument(instrumentLower) &&
        !isOrchestralColorInstrument(instrumentLower)
    )
    .map(([instrumentLower]) => canonicalByLower.get(instrumentLower) ?? instrumentLower);

  const combined = new Map<string, string>();
  for (const instrument of computed) {
    combined.set(instrument.toLowerCase(), instrument);
  }

  for (const instrument of MULTIGENRE_FORCE_INCLUDE) {
    const canonical = toCanonical(instrument) ?? instrument;
    combined.set(canonical.toLowerCase(), canonical);
  }

  // Apply excludes + never allow foundational/orchestral-color to land in multi-genre.
  for (const key of [...combined.keys()]) {
    if (MULTIGENRE_FORCE_EXCLUDE_SET.has(key)) combined.delete(key);
    if (FOUNDATIONAL_SET.has(key)) combined.delete(key);
    if (ORCHESTRAL_COLOR_SET.has(key)) combined.delete(key);
  }

  return [...combined.values()].sort();
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
  if (isOrchestralColorInstrument(key)) return 'orchestralColor';
  if (isMultiGenreInstrument(key)) return 'multigenre';
  return 'genre';
}
