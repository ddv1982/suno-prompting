export {
  HARMONIC_STYLES,
  LYDIAN_MODES,
  MAJOR_MODES,
  MINOR_MODES,
  CROSS_MODE_COMBINATIONS,
  WITHIN_MODE_COMBINATIONS,
  ALL_COMBINATIONS,
} from '@bun/instruments/modes';
export type { HarmonicStyle, CombinationType } from '@bun/instruments/modes';

export { GENRE_REGISTRY, AMBIENT_GENRE } from '@bun/instruments/genres';
export type { GenreType, GenreDefinition, InstrumentPool } from '@bun/instruments/genres';

export { RHYTHMIC_STYLES } from '@bun/instruments/data';
export type { RhythmicStyle } from '@bun/instruments/data';

// Registry exports
export {
  INSTRUMENT_REGISTRY,
  CANONICAL_SET,
  ALIAS_TO_CANONICAL,
  isValidInstrument,
  toCanonical,
  getCategory,
  getInstrumentsByCategory,
} from '@bun/instruments/registry';
export type { InstrumentCategory, InstrumentEntry } from '@bun/instruments/registry';

// Extraction exports
export { extractInstruments, normalizeToken, matchInstrument } from '@bun/instruments/extraction';
export type { ExtractionResult } from '@bun/instruments/extraction';

// Detection exports
export { detectHarmonic, detectRhythmic, detectAmbient, detectGenre, detectCombination } from '@bun/instruments/detection';

// Guidance exports
export { getHarmonicGuidance, getRhythmicGuidance, getCombinationGuidance, getGenreInstruments, getAmbientInstruments, buildGuidanceFromSelection } from '@bun/instruments/guidance';
export type { InstrumentSelectionOptions, ModeSelectionInput } from '@bun/instruments/guidance';

// Selection exports
export { selectModes, selectModesWithLLM } from '@bun/instruments/selection';
export type { ModeSelection } from '@bun/instruments/selection';
