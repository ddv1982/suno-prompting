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

export {
  GENRE_REGISTRY,
  AMBIENT_GENRE,
  JAZZ_GENRE,
  ELECTRONIC_GENRE,
  ROCK_GENRE,
  POP_GENRE,
  CLASSICAL_GENRE,
  LOFI_GENRE,
  SYNTHWAVE_GENRE,
  CINEMATIC_GENRE,
  FOLK_GENRE,
  RNB_GENRE,
  VIDEOGAME_GENRE,
  MULTI_GENRE_COMBINATIONS,
  isMultiGenre,
} from '@bun/instruments/genres';
export type { GenreType, GenreDefinition, InstrumentPool, MultiGenreCombination } from '@bun/instruments/genres';

export {
  RHYTHMIC_STYLES,
  POLYRHYTHMS,
  ALL_POLYRHYTHM_COMBINATIONS,
  TIME_SIGNATURES,
  TIME_SIGNATURE_JOURNEYS,
} from '@bun/instruments/datasets';
export type {
  RhythmicStyle,
  PolyrhythmType,
  PolyrhythmCombinationType,
  TimeSignatureType,
  TimeSignatureJourneyType,
} from '@bun/instruments/datasets';

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
export { detectHarmonic, detectRhythmic, detectAmbient, detectGenre, detectCombination, detectPolyrhythmCombination, detectTimeSignature, detectTimeSignatureJourney } from '@bun/instruments/detection';

// Guidance exports
export { getHarmonicGuidance, getRhythmicGuidance, getCombinationGuidance, getPolyrhythmCombinationGuidance, getTimeSignatureGuidance, getTimeSignatureJourneyGuidance, getGenreInstruments, getAmbientInstruments, selectInstrumentsForGenre, buildGuidanceFromSelection, getMultiGenreNuanceGuidance } from '@bun/instruments/guidance';
export type { InstrumentSelectionOptions, ModeSelectionInput } from '@bun/instruments/guidance';

// Selection exports
export { selectModes } from '@bun/instruments/selection';
export type { ModeSelection } from '@bun/instruments/selection';
