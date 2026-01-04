import { describe, expect, test } from 'bun:test';

import {
  NOTES,
  LYDIAN_SCALE,
  normalizeNote,
  getNoteIndex,
  transposeNote,
  getScaleNotes,
  formatChordName,
  getRomanNumeral,
  getTriadNotes,
  getSeventhChordNotes,
  getLydianChords,
  getAllLydianChords,
  formatLydianChordSummary,
  LYDIAN_DIATONIC,
} from '@bun/instruments/modes';

describe('scaleChords utilities', () => {
  describe('normalizeNote', () => {
    test('returns sharp notes unchanged', () => {
      expect(normalizeNote('C')).toBe('C');
      expect(normalizeNote('C#')).toBe('C#');
      expect(normalizeNote('F#')).toBe('F#');
    });

    test('converts flats to sharps', () => {
      expect(normalizeNote('Db')).toBe('C#');
      expect(normalizeNote('Eb')).toBe('D#');
      expect(normalizeNote('Gb')).toBe('F#');
      expect(normalizeNote('Ab')).toBe('G#');
      expect(normalizeNote('Bb')).toBe('A#');
    });
  });

  describe('getNoteIndex', () => {
    test('returns correct index for each note', () => {
      expect(getNoteIndex('C')).toBe(0);
      expect(getNoteIndex('E')).toBe(4);
      expect(getNoteIndex('G')).toBe(7);
      expect(getNoteIndex('B')).toBe(11);
    });

    test('handles flats', () => {
      expect(getNoteIndex('Bb')).toBe(10);
      expect(getNoteIndex('Eb')).toBe(3);
    });
  });

  describe('transposeNote', () => {
    test('transposes up correctly', () => {
      expect(transposeNote('C', 4)).toBe('E');
      expect(transposeNote('C', 7)).toBe('G');
      expect(transposeNote('G', 5)).toBe('C');
    });

    test('wraps around octave', () => {
      expect(transposeNote('B', 1)).toBe('C');
      expect(transposeNote('A', 4)).toBe('C#');
    });

    test('handles negative semitones', () => {
      expect(transposeNote('C', -1)).toBe('B');
      expect(transposeNote('E', -4)).toBe('C');
    });
  });

  describe('getScaleNotes', () => {
    test('returns C Lydian scale notes', () => {
      const notes = getScaleNotes('C', LYDIAN_SCALE.intervals);
      expect(notes).toEqual(['C', 'D', 'E', 'F#', 'G', 'A', 'B']);
    });

    test('returns G Lydian scale notes', () => {
      const notes = getScaleNotes('G', LYDIAN_SCALE.intervals);
      expect(notes).toEqual(['G', 'A', 'B', 'C#', 'D', 'E', 'F#']);
    });

    test('returns F Lydian scale notes', () => {
      const notes = getScaleNotes('F', LYDIAN_SCALE.intervals);
      expect(notes).toEqual(['F', 'G', 'A', 'B', 'C', 'D', 'E']);
    });
  });

  describe('formatChordName', () => {
    test('formats triads correctly', () => {
      expect(formatChordName('C', 'maj')).toBe('C');
      expect(formatChordName('D', 'min')).toBe('Dm');
      expect(formatChordName('F#', 'dim')).toBe('F#dim');
    });

    test('formats seventh chords correctly', () => {
      expect(formatChordName('C', 'maj7')).toBe('Cmaj7');
      expect(formatChordName('D', 'dom7')).toBe('D7');
      expect(formatChordName('E', 'min7')).toBe('Em7');
      expect(formatChordName('F#', 'm7b5')).toBe('F#m7b5');
    });

    test('formats extended chords correctly', () => {
      expect(formatChordName('C', 'sus2')).toBe('Csus2');
      expect(formatChordName('G', 'add9')).toBe('Gadd9');
      expect(formatChordName('A', '6')).toBe('A6');
    });
  });

  describe('getRomanNumeral', () => {
    test('returns uppercase for major chords', () => {
      expect(getRomanNumeral(0, 'maj')).toBe('I');
      expect(getRomanNumeral(1, 'maj')).toBe('II');
      expect(getRomanNumeral(4, 'maj')).toBe('V');
    });

    test('returns lowercase for minor chords', () => {
      expect(getRomanNumeral(2, 'min')).toBe('iii');
      expect(getRomanNumeral(5, 'min')).toBe('vi');
      expect(getRomanNumeral(6, 'min')).toBe('vii');
    });

    test('adds degree symbol for diminished', () => {
      expect(getRomanNumeral(3, 'dim')).toBe('iv°');
    });

    test('adds half-diminished symbol for m7b5', () => {
      expect(getRomanNumeral(3, 'm7b5')).toBe('ivø');
    });
  });

  describe('getTriadNotes', () => {
    test('returns major triad notes', () => {
      expect(getTriadNotes('C', 'maj')).toEqual(['C', 'E', 'G']);
      expect(getTriadNotes('G', 'maj')).toEqual(['G', 'B', 'D']);
    });

    test('returns minor triad notes', () => {
      expect(getTriadNotes('A', 'min')).toEqual(['A', 'C', 'E']);
      expect(getTriadNotes('E', 'min')).toEqual(['E', 'G', 'B']);
    });

    test('returns diminished triad notes', () => {
      expect(getTriadNotes('F#', 'dim')).toEqual(['F#', 'A', 'C']);
    });
  });

  describe('getSeventhChordNotes', () => {
    test('returns maj7 notes', () => {
      expect(getSeventhChordNotes('C', 'maj7')).toEqual(['C', 'E', 'G', 'B']);
    });

    test('returns dom7 notes', () => {
      expect(getSeventhChordNotes('D', 'dom7')).toEqual(['D', 'F#', 'A', 'C']);
    });

    test('returns min7 notes', () => {
      expect(getSeventhChordNotes('E', 'min7')).toEqual(['E', 'G', 'B', 'D']);
    });

    test('returns m7b5 notes', () => {
      expect(getSeventhChordNotes('F#', 'm7b5')).toEqual(['F#', 'A', 'C', 'E']);
    });
  });
});

describe('Lydian chord generation', () => {
  describe('getLydianChords', () => {
    test('returns correct C Lydian triads', () => {
      const chords = getLydianChords('C');

      expect(chords.root).toBe('C');
      expect(chords.scaleNotes).toEqual(['C', 'D', 'E', 'F#', 'G', 'A', 'B']);

      expect(chords.triads[0]!.roman).toBe('I');
      expect(chords.triads[0]!.quality).toBe('maj');

      expect(chords.triads[1]!.roman).toBe('II');
      expect(chords.triads[1]!.quality).toBe('maj');

      expect(chords.triads[2]!.roman).toBe('iii');
      expect(chords.triads[2]!.quality).toBe('min');

      expect(chords.triads[3]!.roman).toBe('iv°');
      expect(chords.triads[3]!.quality).toBe('dim');

      expect(chords.triads[4]!.roman).toBe('V');
      expect(chords.triads[4]!.quality).toBe('maj');

      expect(chords.triads[5]!.roman).toBe('vi');
      expect(chords.triads[5]!.quality).toBe('min');

      expect(chords.triads[6]!.roman).toBe('vii');
      expect(chords.triads[6]!.quality).toBe('min');
    });

    test('returns correct C Lydian seventh chords', () => {
      const chords = getLydianChords('C');

      expect(chords.sevenths[0]!.quality).toBe('maj7');
      expect(chords.sevenths[1]!.quality).toBe('dom7');
      expect(chords.sevenths[2]!.quality).toBe('min7');
      expect(chords.sevenths[3]!.quality).toBe('m7b5');
      expect(chords.sevenths[4]!.quality).toBe('maj7');
      expect(chords.sevenths[5]!.quality).toBe('min7');
      expect(chords.sevenths[6]!.quality).toBe('min7');
    });

    test('includes extended chords', () => {
      const chords = getLydianChords('C');
      expect(chords.extended.length).toBeGreaterThan(0);

      const sus2Chords = chords.extended.filter(c => c.quality === 'sus2');
      expect(sus2Chords.length).toBe(7);
    });

    test('works for all 12 root notes', () => {
      for (const note of NOTES) {
        const chords = getLydianChords(note);
        expect(chords.root).toBe(note);
        expect(chords.triads.length).toBe(7);
        expect(chords.sevenths.length).toBe(7);
        expect(chords.scaleNotes.length).toBe(7);
      }
    });

    test('G Lydian has correct #4', () => {
      const chords = getLydianChords('G');
      expect(chords.scaleNotes[3]).toBe('C#');
    });

    test('F Lydian has natural B (no #4 needed from F)', () => {
      const chords = getLydianChords('F');
      expect(chords.scaleNotes[3]).toBe('B');
    });
  });

  describe('getAllLydianChords', () => {
    test('returns map with all 12 keys', () => {
      const allChords = getAllLydianChords();
      expect(allChords.size).toBe(12);

      for (const note of NOTES) {
        expect(allChords.has(note)).toBe(true);
      }
    });
  });

  describe('formatLydianChordSummary', () => {
    test('includes scale notes in header', () => {
      const chords = getLydianChords('C');
      const summary = formatLydianChordSummary(chords);
      expect(summary).toContain('C Lydian Scale');
      expect(summary).toContain('C - D - E - F# - G - A - B');
    });

    test('includes triads section', () => {
      const chords = getLydianChords('C');
      const summary = formatLydianChordSummary(chords);
      expect(summary).toContain('Triads:');
      expect(summary).toContain('I:');
      expect(summary).toContain('II:');
    });

    test('includes sevenths section', () => {
      const chords = getLydianChords('C');
      const summary = formatLydianChordSummary(chords);
      expect(summary).toContain('Seventh Chords:');
      expect(summary).toContain('Cmaj7');
      expect(summary).toContain('D7');
    });
  });

  describe('LYDIAN_DIATONIC constant', () => {
    test('has correct scale formula', () => {
      expect(LYDIAN_DIATONIC.scale).toContain('W-W-W-H-W-W-H');
    });

    test('has 7 triads', () => {
      expect(LYDIAN_DIATONIC.triads.length).toBe(7);
    });

    test('has 7 seventh chords', () => {
      expect(LYDIAN_DIATONIC.sevenths.length).toBe(7);
    });

    test('describes signature sound', () => {
      expect(LYDIAN_DIATONIC.signatureSound).toContain('II major');
    });
  });
});

describe('Lydian chord correctness (matching website)', () => {
  test('C Lydian triads match website exactly', () => {
    const chords = getLydianChords('C');

    expect(chords.triads[0]!.notes).toEqual(['C', 'E', 'G']);
    expect(chords.triads[1]!.notes).toEqual(['D', 'F#', 'A']);
    expect(chords.triads[2]!.notes).toEqual(['E', 'G', 'B']);
    expect(chords.triads[3]!.notes).toEqual(['F#', 'A', 'C']);
    expect(chords.triads[4]!.notes).toEqual(['G', 'B', 'D']);
    expect(chords.triads[5]!.notes).toEqual(['A', 'C', 'E']);
    expect(chords.triads[6]!.notes).toEqual(['B', 'D', 'F#']);
  });

  test('C Lydian seventh chords match website exactly', () => {
    const chords = getLydianChords('C');

    expect(chords.sevenths[0]!.notes).toEqual(['C', 'E', 'G', 'B']);
    expect(chords.sevenths[1]!.notes).toEqual(['D', 'F#', 'A', 'C']);
    expect(chords.sevenths[2]!.notes).toEqual(['E', 'G', 'B', 'D']);
    expect(chords.sevenths[3]!.notes).toEqual(['F#', 'A', 'C', 'E']);
    expect(chords.sevenths[4]!.notes).toEqual(['G', 'B', 'D', 'F#']);
    expect(chords.sevenths[5]!.notes).toEqual(['A', 'C', 'E', 'G']);
    expect(chords.sevenths[6]!.notes).toEqual(['B', 'D', 'F#', 'A']);
  });

  test('C Lydian chord qualities match website', () => {
    const chords = getLydianChords('C');

    expect(chords.triads.map(t => t.quality)).toEqual([
      'maj',
      'maj',
      'min',
      'dim',
      'maj',
      'min',
      'min',
    ]);

    expect(chords.sevenths.map(s => s.quality)).toEqual([
      'maj7',
      'dom7',
      'min7',
      'm7b5',
      'maj7',
      'min7',
      'min7',
    ]);
  });
});
