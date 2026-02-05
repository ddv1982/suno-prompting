export const NOTES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'] as const;
export const NOTES_FLAT = [
  'C',
  'Db',
  'D',
  'Eb',
  'E',
  'F',
  'Gb',
  'G',
  'Ab',
  'A',
  'Bb',
  'B',
] as const;

export type Note = (typeof NOTES)[number];
export type NoteFlatVariant = (typeof NOTES_FLAT)[number];
export type AnyNote = Note | NoteFlatVariant;

export const ENHARMONIC_MAP: Record<string, Note> = {
  Db: 'C#',
  Eb: 'D#',
  Gb: 'F#',
  Ab: 'G#',
  Bb: 'A#',
};

export type ChordQuality =
  | 'maj'
  | 'min'
  | 'dim'
  | 'aug'
  | 'maj7'
  | 'min7'
  | 'dom7'
  | 'm7b5'
  | 'dim7'
  | 'sus2'
  | 'sus4'
  | 'add9'
  | '6'
  | 'min6'
  | '7sus4'
  | '5';

export type RomanNumeral = 'I' | 'II' | 'III' | 'IV' | 'V' | 'VI' | 'VII';
export type RomanNumeralLower = 'i' | 'ii' | 'iii' | 'iv' | 'v' | 'vi' | 'vii';

export interface ScaleChord {
  degree: number;
  roman: string;
  quality: ChordQuality;
  notes: string[];
}

export interface ScaleDefinition {
  name: string;
  intervals: number[];
  triadQualities: ChordQuality[];
  seventhQualities: ChordQuality[];
}

export function normalizeNote(note: string): Note {
  if (ENHARMONIC_MAP[note]) {
    return ENHARMONIC_MAP[note];
  }
  return note as Note;
}

export function getNoteIndex(note: string): number {
  const normalized = normalizeNote(note);
  return NOTES.indexOf(normalized);
}

export function transposeNote(note: string, semitones: number): Note {
  const index = getNoteIndex(note);
  const newIndex = (index + semitones + 12) % 12;
  return NOTES[newIndex] ?? 'C';
}

export function getScaleNotes(root: string, intervals: number[]): Note[] {
  const rootIndex = getNoteIndex(root);
  return intervals.map((interval) => NOTES[(rootIndex + interval) % 12] ?? 'C');
}

export function formatChordName(root: string, quality: ChordQuality): string {
  const suffixes: Record<ChordQuality, string> = {
    maj: '',
    min: 'm',
    dim: 'dim',
    aug: 'aug',
    maj7: 'maj7',
    min7: 'm7',
    dom7: '7',
    m7b5: 'm7b5',
    dim7: 'dim7',
    sus2: 'sus2',
    sus4: 'sus4',
    add9: 'add9',
    '6': '6',
    min6: 'm6',
    '7sus4': '7sus4',
    '5': '5',
  };
  return `${root}${suffixes[quality]}`;
}

export function getRomanNumeral(degree: number, quality: ChordQuality): string {
  const numerals = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII'] as const;
  const base = numerals[degree] ?? 'I';

  const isMinor = ['min', 'min7', 'm7b5', 'dim', 'dim7', 'min6'].includes(quality);
  const roman = isMinor ? base.toLowerCase() : base;

  if (quality === 'dim' || quality === 'dim7') return `${roman}°`;
  if (quality === 'm7b5') return `${roman}ø`;
  if (quality === 'aug') return `${roman}+`;

  return roman;
}

export function getTriadNotes(root: string, quality: ChordQuality): Note[] {
  const rootNote = normalizeNote(root);
  const rootIndex = getNoteIndex(rootNote);

  const intervals: Record<string, number[]> = {
    maj: [0, 4, 7],
    min: [0, 3, 7],
    dim: [0, 3, 6],
    aug: [0, 4, 8],
    sus2: [0, 2, 7],
    sus4: [0, 5, 7],
    '5': [0, 7],
  };

  const pattern = intervals[quality] ?? intervals.maj ?? [0, 4, 7];
  return pattern.map((i) => NOTES[(rootIndex + i) % 12] ?? 'C');
}

export function getSeventhChordNotes(root: string, quality: ChordQuality): Note[] {
  const rootNote = normalizeNote(root);
  const rootIndex = getNoteIndex(rootNote);

  const intervals: Record<string, number[]> = {
    maj7: [0, 4, 7, 11],
    min7: [0, 3, 7, 10],
    dom7: [0, 4, 7, 10],
    m7b5: [0, 3, 6, 10],
    dim7: [0, 3, 6, 9],
    '6': [0, 4, 7, 9],
    min6: [0, 3, 7, 9],
    add9: [0, 4, 7, 14 % 12],
    '7sus4': [0, 5, 7, 10],
  };

  const pattern = intervals[quality] ?? intervals.maj7 ?? [0, 4, 7, 11];
  return pattern.map((i) => NOTES[(rootIndex + i) % 12] ?? 'C');
}

export function buildScaleChords(
  root: string,
  scale: ScaleDefinition,
  type: 'triads' | 'sevenths'
): ScaleChord[] {
  const scaleNotes = getScaleNotes(root, scale.intervals);
  const qualities = type === 'triads' ? scale.triadQualities : scale.seventhQualities;

  return scaleNotes.map((note, degree) => {
    const quality = qualities[degree] ?? 'maj';
    const notes =
      type === 'triads' ? getTriadNotes(note, quality) : getSeventhChordNotes(note, quality);

    return {
      degree,
      roman: getRomanNumeral(degree, quality),
      quality,
      notes,
    };
  });
}

export function formatChordWithNotes(chord: ScaleChord): string {
  const name = formatChordName(chord.notes[0] ?? 'C', chord.quality);
  return `${chord.roman}: ${name} (${chord.notes.join('-')})`;
}
