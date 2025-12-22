// Data exports
export {
  HARMONIC_STYLES,
  RHYTHMIC_STYLES,
  AMBIENT_INSTRUMENT_POOLS,
} from '@bun/instruments/data';
export type { HarmonicStyle, RhythmicStyle } from '@bun/instruments/data';

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
export { detectHarmonic, detectRhythmic, detectAmbient } from '@bun/instruments/detection';

// Guidance exports
export { getHarmonicGuidance, getRhythmicGuidance, getAmbientInstruments } from '@bun/instruments/guidance';
export type { InstrumentSelectionOptions } from '@bun/instruments/guidance';
