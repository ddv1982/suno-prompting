import {
  NOTES,
  type Note,
  type ScaleDefinition,
  type ScaleChord,
  type ChordQuality,
  buildScaleChords,
  getScaleNotes,
  formatChordName,
  formatChordWithNotes,
  getTriadNotes,
  getSeventhChordNotes,
} from '@bun/instruments/modes/scale-chords';

export const LYDIAN_SCALE: ScaleDefinition = {
  name: 'Lydian',
  intervals: [0, 2, 4, 6, 7, 9, 11], // W-W-W-H-W-W-H
  triadQualities: ['maj', 'maj', 'min', 'dim', 'maj', 'min', 'min'],
  seventhQualities: ['maj7', 'dom7', 'min7', 'm7b5', 'maj7', 'min7', 'min7'],
};

export interface LydianScaleChords {
  root: Note;
  scaleNotes: Note[];
  triads: ScaleChord[];
  sevenths: ScaleChord[];
  extended: ExtendedChord[];
}

export interface ExtendedChord {
  degree: number;
  root: Note;
  name: string;
  quality: ChordQuality;
  notes: Note[];
}

function buildExtendedChords(scaleNotes: Note[]): ExtendedChord[] {
  const extended: ExtendedChord[] = [];

  scaleNotes.forEach((root, degree) => {
    const extendedQualities: ChordQuality[] = ['sus2', 'sus4', '6', 'add9', '5'];

    extendedQualities.forEach(quality => {
      let notes: Note[];
      if (['sus2', 'sus4', '5'].includes(quality)) {
        notes = getTriadNotes(root, quality);
      } else {
        notes = getSeventhChordNotes(root, quality);
      }

      extended.push({
        degree,
        root,
        name: formatChordName(root, quality),
        quality,
        notes,
      });
    });
  });

  return extended;
}

export function getLydianChords(root: Note): LydianScaleChords {
  const scaleNotes = getScaleNotes(root, LYDIAN_SCALE.intervals);
  const triads = buildScaleChords(root, LYDIAN_SCALE, 'triads');
  const sevenths = buildScaleChords(root, LYDIAN_SCALE, 'sevenths');
  const extended = buildExtendedChords(scaleNotes);

  return {
    root: scaleNotes[0] ?? root,
    scaleNotes,
    triads,
    sevenths,
    extended,
  };
}

export function getAllLydianChords(): Map<Note, LydianScaleChords> {
  const allChords = new Map<Note, LydianScaleChords>();

  for (const note of NOTES) {
    allChords.set(note, getLydianChords(note));
  }

  return allChords;
}

export function formatLydianChordSummary(chords: LydianScaleChords): string {
  const lines: string[] = [];

  lines.push(`${chords.root} Lydian Scale: ${chords.scaleNotes.join(' - ')}`);
  lines.push('');
  lines.push('Triads:');
  chords.triads.forEach(chord => {
    lines.push(`  ${formatChordWithNotes(chord)}`);
  });

  lines.push('');
  lines.push('Seventh Chords:');
  chords.sevenths.forEach(chord => {
    lines.push(`  ${formatChordWithNotes(chord)}`);
  });

  return lines.join('\n');
}

export const LYDIAN_CHORD_DESCRIPTIONS = {
  I: { role: 'Tonic', character: 'Bright, stable home base with dreamy #11 available' },
  II: { role: 'Subdominant', character: 'Major II creates floating, unresolved beauty (signature Lydian sound)' },
  iii: { role: 'Mediant', character: 'Minor color, softer emotional moment' },
  'iv°': { role: 'Subdominant', character: 'Diminished - tension and instability' },
  V: { role: 'Dominant', character: 'Strong resolution tendency back to I' },
  vi: { role: 'Submediant', character: 'Relative minor - melancholic contrast' },
  vii: { role: 'Leading tone', character: 'Minor - gentle pre-resolution' },
} as const;

export const LYDIAN_PROGRESSION_TEMPLATES = [
  { name: 'Classic Lydian Float', chords: ['I', 'II'], description: 'The quintessential Lydian sound' },
  { name: 'Dream Resolution', chords: ['Imaj7', 'II', 'vii', 'I'], description: 'Floating then landing' },
  { name: 'Cinematic Wonder', chords: ['Imaj7#11', 'II/I', 'V', 'I'], description: 'Film score staple' },
  { name: 'Lydian Cycle', chords: ['I', 'II', 'iii', 'II'], description: 'Circular dreamy motion' },
  { name: 'Modal Jazz', chords: ['Imaj7', 'II7', 'Imaj7'], description: 'Jazz fusion approach' },
] as const;
