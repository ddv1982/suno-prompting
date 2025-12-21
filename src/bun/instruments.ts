export const HARMONIC_STYLES = {
  lydian: {
    description: 'Bright, ethereal, modern harmonic color',
    chordType: 'Maj7#11 (major 7th with raised 11th)',
    formula: '1 - 3 - 5 - 7 - #11',
    characteristics: [
      'The #11 (raised 4th) creates floating, unresolved beauty',
      'Dreamy, weightless quality - sounds like possibility and wonder',
      'Use on I or IV chords for modern jazz/ambient feel',
      'Avoid natural 4th - always raise to #4/#11 for true Lydian color',
      'Creates brightness without tension needing resolution',
    ],
    keyExamples: 'CMaj7#11 = C-E-G-B-F#, GMaj7#11 = G-B-D-F#-C#, DMaj7#11 = D-F#-A-C#-G#',
  },
} as const;

export type HarmonicStyle = keyof typeof HARMONIC_STYLES;

export function detectHarmonic(description: string): HarmonicStyle | null {
  const lower = description.toLowerCase();
  
  if (lower.includes('lydian') || lower.includes('#11') || lower.includes('sharp 11') || lower.includes('maj7#11')) {
    return 'lydian';
  }
  
  return null;
}

export function getHarmonicGuidance(style: HarmonicStyle): string {
  const { description, chordType, formula, characteristics, keyExamples } = HARMONIC_STYLES[style];
  return `HARMONIC STYLE (Lydian):
${description}
Chord: ${chordType}
Formula: ${formula}
${characteristics.map(c => `- ${c}`).join('\n')}
Examples: ${keyExamples}`;
}

export const RHYTHMIC_STYLES = {
  polyrhythm: {
    description: 'Interlocking, hypnotic rhythmic complexity',
    characteristics: [
      'Layer conflicting rhythmic divisions simultaneously',
      'Creates hypnotic, trance-like quality',
      'African-influenced interlocking patterns',
      'Organic, alive feel - rhythms shift and interweave',
      'Use cross-rhythms between percussion, bass, and melodic elements',
    ],
    commonRatios: '2:3 (hemiola/swing), 3:4 (tension/limping), 4:3 (Afrobeat drive), 5:4 (complex shifting), 7:4 (constantly evolving)',
    instruments: 'Layered percussion, polyrhythmic bass lines, interlocking synth arpeggios, cross-rhythm hi-hats',
  },
} as const;

export type RhythmicStyle = keyof typeof RHYTHMIC_STYLES;

export function detectRhythmic(description: string): RhythmicStyle | null {
  const lower = description.toLowerCase();
  
  if (lower.includes('polyrhythm') || lower.includes('poly rhythm') || lower.includes('poly-rhythm') ||
      lower.includes('cross rhythm') || lower.includes('cross-rhythm') ||
      lower.includes('2:3') || lower.includes('3:4') || lower.includes('4:3') ||
      lower.includes('5:4') || lower.includes('7:4') || lower.includes('interlocking rhythm')) {
    return 'polyrhythm';
  }
  
  return null;
}

export function getRhythmicGuidance(style: RhythmicStyle): string {
  const { description, characteristics, commonRatios, instruments } = RHYTHMIC_STYLES[style];
  return `RHYTHMIC STYLE (Polyrhythm):
${description}
${characteristics.map(c => `- ${c}`).join('\n')}
Common ratios: ${commonRatios}
Suggested elements: ${instruments}`;
}

export const GENRE_INSTRUMENTS = {
  ambient: {
    description: 'Warm, intimate, emotional soundscapes with gentle movement',
    instruments: [
      'Felt piano / soft grand piano',
      'Fender Rhodes - warm, electric piano tone',
      'Nord Stage-style keys (piano + pad blends)',
      'Analog synth pads (Prophet / OB / Juno-ish) - slow attack, long release',
      'Breathy wind synths / EWI-like leads - expressive, floating',
      'Bowed vibraphone / soft mallet metals',
      'Glassy bells (very restrained) - light particles, not melodies',
      'Textural synth layers - noise beds, filtered air, evolving harmonic clouds',
    ],
  },
} as const;

export type Genre = keyof typeof GENRE_INSTRUMENTS;

export function detectGenre(description: string): Genre | null {
  const lower = description.toLowerCase();
  
  if (lower.includes('ambient') || lower.includes('atmospheric') || lower.includes('soundscape')) {
    return 'ambient';
  }
  
  return null;
}

export function getGenreInstruments(genre: Genre): string {
  const { description, instruments } = GENRE_INSTRUMENTS[genre];
  return `SUGGESTED INSTRUMENTS (${genre}):
${description}
- ${instruments.join('\n- ')}`;
}
