export const LYDIAN_DIATONIC = {
  scale: 'W-W-W-H-W-W-H (1-2-3-#4-5-6-7)',
  triads: ['I (maj)', 'II (maj)', 'iii (min)', 'iv° (dim)', 'V (maj)', 'vi (min)', 'vii (min)'],
  sevenths: ['Imaj7', 'II7', 'iii7', 'ivø7', 'Vmaj7', 'vi7', 'vii7'],
  signatureSound: 'The II major chord (e.g., D in C Lydian) - creates the characteristic floating quality',
} as const;

export const LYDIAN_MODES = {
  lydian_dominant: {
    name: 'Lydian Dominant',
    keywords: ['dominant', '7#11', 'fusion', 'simpsons'],
    description: 'Sophisticated, jazzy, slightly bluesy brightness',
    chordType: '7#11',
    formula: '1 - 3 - 5 - b7 - #11',
    characteristics: [
      'The b7 mixed with #11 creates "playful mystery"',
      'Acoustic scale feel - common in jazz fusion and funk',
      'Less "angelic" than pure Lydian, more "mischievous"',
      'Works perfectly on a IV7 chord in a major key',
      'Classic "Simpsons" or "The Jetson" style harmonic humor',
    ],
    progressions: ['I7 - II7', 'IV7#11 - I', 'V7 - IV7#11 - I'],
    keyExamples: 'C7#11 = C-E-G-Bb-F#, G7#11 = G-B-D-F-C#',
    bestInstruments: ['Rhodes', 'Clavinet', 'bass', 'brass', 'Hammond organ'],
  },
  lydian_augmented: {
    name: 'Lydian Augmented',
    keywords: ['augmented', '#5', 'alien', 'space', 'supernatural'],
    description: 'Mystical, otherworldly, and deeply mysterious',
    chordType: 'Maj7#5#11',
    formula: '1 - 3 - #5 - 7 - #11',
    characteristics: [
      'The #5 adds a sense of "alien" or "supernatural" beauty',
      'Highly unstable but beautiful - never quite lands',
      'Evokes deep space, underwater kingdoms, or ancient magic',
      'Very dense harmonic structure',
    ],
    progressions: ['Imaj7#5 - II7', 'Imaj7#5 - bVImaj7', 'Imaj7#5 - VI/I'],
    keyExamples: 'Cmaj7#5#11 = C-E-G#-B-F#, Gmaj7#5#11 = G-B-D#-F#-C#',
    bestInstruments: ['synth pad', 'strings', 'glass bells', 'choir', 'celesta'],
  },
  lydian_sharp_two: {
    name: 'Lydian #2',
    keywords: ['#2', 'sharp 2', 'enchanted'],
    description: 'Exotic, enchanted, and "Middle Eastern-bright"',
    chordType: 'Maj7#2#11',
    formula: '1 - #2 - 3 - 5 - 7 - #11',
    characteristics: [
      'The #2 creates a unique melodic leap (augmented second)',
      'Sounds like an enchanted forest or desert oasis at night',
      'Combines major brightness with minor-ish melodic tension',
      'Extremely evocative for cinematic storytelling',
    ],
    progressions: ['I - #II (C - D#)', 'I - vi#2', 'Imaj7 - bII/I'],
    keyExamples: 'C Lydian #2 = C-D#-E-G-B-F#, G Lydian #2 = G-A#-B-D-F#-C#',
    bestInstruments: ['strings', 'duduk', 'harp', 'piano', 'oboe'],
  },
  lydian: {
    name: 'Pure Lydian',
    keywords: ['lydian', '#11', 'sharp 11', 'maj7#11', 'dreamy', 'floating', 'cinematic'],
    description: 'Bright, ethereal, modern harmonic color',
    chordType: 'Maj7#11',
    formula: '1 - 3 - 5 - 7 - #11',
    characteristics: [
      'The #11 creates floating, unresolved beauty',
      'Dreamy, weightless quality - sounds like possibility',
      'Avoid natural 4th - always use #4/#11',
      'Cinematic, wide-open soundscapes',
      'Evokes wonder and high-altitude feeling',
      'Purest form of "major" brightness',
    ],
    progressions: ['I - II (C - D)', 'I - vii (C - Bm)', 'Imaj7 - II/I (Cmaj7 - D/C)'],
    keyExamples: 'CMaj7#11 = C-E-G-B-F#, GMaj7#11 = G-B-D-F#-C#',
    bestInstruments: ['strings', 'piano', 'synth pad', 'brass', 'vibraphone'],
  },
} as const;

export type LydianMode = keyof typeof LYDIAN_MODES;
