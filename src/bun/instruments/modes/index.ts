import { LYDIAN_MODES, LYDIAN_DIATONIC } from './lydian';
import { MAJOR_MODES } from './major';
import { MINOR_MODES } from './minor';

export const HARMONIC_STYLES = {
  ...LYDIAN_MODES,
  ...MAJOR_MODES,
  ...MINOR_MODES,
} as const;

export type HarmonicStyle = keyof typeof HARMONIC_STYLES;

export { LYDIAN_MODES, LYDIAN_DIATONIC, MAJOR_MODES, MINOR_MODES };

export {
  LYDIAN_SCALE,
  getLydianChords,
  getAllLydianChords,
  formatLydianChordSummary,
  LYDIAN_CHORD_DESCRIPTIONS,
  LYDIAN_PROGRESSION_TEMPLATES,
} from './lydianChords';
export type { LydianScaleChords, ExtendedChord } from './lydianChords';

export {
  NOTES,
  NOTES_FLAT,
  normalizeNote,
  getNoteIndex,
  transposeNote,
  getScaleNotes,
  formatChordName,
  getRomanNumeral,
  getTriadNotes,
  getSeventhChordNotes,
  buildScaleChords,
  formatChordWithNotes,
} from './scaleChords';
export type { Note, NoteFlatVariant, AnyNote, ChordQuality, ScaleChord, ScaleDefinition } from './scaleChords';

export {
  MODE_PALETTES,
  EXCLUSION_RULES,
  selectInstrumentsForMode,
  getModePalette,
} from './palettes';
export type { ModePalette, PoolConfig } from './palettes';

export {
  CROSS_MODE_COMBINATIONS,
  WITHIN_MODE_COMBINATIONS,
  ALL_COMBINATIONS,
} from './combinations';
export type { CombinationType, CrossModeCombination, WithinModeCombination } from './combinations';
