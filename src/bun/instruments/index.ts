// Data exports
export {
  HARMONIC_STYLES,
  RHYTHMIC_STYLES,
  AMBIENT_INSTRUMENT_POOLS,
} from './data';
export type { HarmonicStyle, RhythmicStyle } from './data';

// Detection exports
export { detectHarmonic, detectRhythmic, detectAmbient } from './detection';

// Guidance exports
export { getHarmonicGuidance, getRhythmicGuidance, getAmbientInstruments } from './guidance';
