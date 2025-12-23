import { LYDIAN_MODES, LYDIAN_DIATONIC } from '@bun/instruments/modes/lydian';
import { MAJOR_MODES } from '@bun/instruments/modes/major';
import { MINOR_MODES } from '@bun/instruments/modes/minor';

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
} from '@bun/instruments/modes/lydianChords';
export type { LydianScaleChords, ExtendedChord } from '@bun/instruments/modes/lydianChords';

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
} from '@bun/instruments/modes/scaleChords';
export type { Note, NoteFlatVariant, AnyNote, ChordQuality, ScaleChord, ScaleDefinition } from '@bun/instruments/modes/scaleChords';

export {
  MODE_PALETTES,
  EXCLUSION_RULES,
  selectInstrumentsForMode,
  getModePalette,
} from '@bun/instruments/modes/palettes';
export type { ModePalette, PoolConfig } from '@bun/instruments/modes/palettes';

export {
  CROSS_MODE_COMBINATIONS,
  WITHIN_MODE_COMBINATIONS,
  ALL_COMBINATIONS,
} from '@bun/instruments/modes/combinations';
export type { CombinationType, CrossModeCombination, WithinModeCombination } from '@bun/instruments/modes/combinations';
