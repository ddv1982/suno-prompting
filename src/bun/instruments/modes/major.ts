export const MAJOR_MODES = {
  ionian: {
    name: 'Ionian (Major)',
    keywords: ['major', 'happy', 'bright', 'uplifting', 'joyful', 'cheerful', 'positive'],
    description: 'Bright, happy, and resolved - the foundational Western scale',
    chordType: 'Maj7',
    formula: '1 - 2 - 3 - 4 - 5 - 6 - 7',
    characteristics: [
      'The most familiar and "resolved" sound in Western music',
      'Conveys joy, clarity, and satisfaction',
      'Perfect for uplifting, celebratory moments',
      'Foundation for pop, classical, and folk music',
      'Creates a sense of home and resolution',
    ],
    progressions: ['I - IV - V - I', 'I - vi - IV - V', 'I - V - vi - IV'],
    keyExamples: 'C Major = C-D-E-F-G-A-B, G Major = G-A-B-C-D-E-F#',
    bestInstruments: ['piano', 'acoustic guitar', 'brass', 'strings', 'choir'],
  },
  mixolydian: {
    name: 'Mixolydian',
    keywords: ['mixolydian', 'b7', 'bluesy', 'rock', 'driving', 'groovy'],
    description: 'Major with a bluesy, relaxed edge - rock and blues favorite',
    chordType: '7',
    formula: '1 - 2 - 3 - 4 - 5 - 6 - b7',
    characteristics: [
      'The b7 adds a bluesy, unresolved quality to major',
      'Sounds relaxed yet driving - perfect for rock grooves',
      'Common in blues, rock, and folk music',
      'Creates forward momentum without tension',
      'The "Sweet Home Alabama" sound',
    ],
    progressions: ['I - bVII - IV', 'I - IV - bVII - IV', 'I7 - IV7'],
    keyExamples: 'G Mixolydian = G-A-B-C-D-E-F, C Mixolydian = C-D-E-F-G-A-Bb',
    bestInstruments: ['electric guitar', 'Hammond organ', 'bass', 'drums', 'harmonica'],
  },
} as const;

export type MajorMode = keyof typeof MAJOR_MODES;
