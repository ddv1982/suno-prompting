export const CROSS_MODE_COMBINATIONS = {
  major_minor: {
    name: 'Major-Minor (Bittersweet)',
    modes: ['ionian', 'aeolian'] as const,
    keywords: ['bittersweet', 'major minor', 'borrowed chords', 'emotional major', 'happy sad'],
    description: 'Happy foundation with emotional depth from borrowed minor chords',
    borrowedChords: ['bVI', 'bVII', 'iv', 'bIII'],
    progressions: [
      'I - bVI - bVII - I',
      'I - IV - iv - I',
      'I - bVII - IV - I',
      'I - V - bVI - IV',
    ],
    emotionalArc: 'Joy → Melancholy → Resolution',
    famousExamples: ['Let It Be (Beatles)', 'Creep (Radiohead)', 'With Or Without You (U2)'],
    bestInstruments: ['piano', 'strings', 'acoustic guitar', 'choir'],
  },
  lydian_minor: {
    name: 'Lydian-Minor (Dreamlike Darkness)',
    modes: ['lydian', 'aeolian'] as const,
    keywords: ['lydian minor', 'dream dark', 'floating dark', 'cinematic tension', 'ethereal dark'],
    description: 'Ethereal Lydian brightness colliding with minor darkness',
    borrowedChords: ['bVI', 'iv', '#IV°'],
    progressions: [
      'Imaj7#11 - iv - bVI',
      'I - II - bVI - bVII',
      'Imaj7#11 - bVII - iv - I',
    ],
    emotionalArc: 'Wonder → Shadow → Mystery',
    famousExamples: ['Flying in a Blue Dream (Satriani)', 'Cinematic scores'],
    bestInstruments: ['synth pad', 'strings', 'piano', 'celesta'],
  },
  lydian_major: {
    name: 'Lydian-Major (Floating Resolution)',
    modes: ['lydian', 'ionian'] as const,
    keywords: ['lydian major', 'floating happy', 'bright uplifting', 'dreamy resolution'],
    description: 'Dreamy Lydian floating down to satisfying Major resolution',
    borrowedChords: ['II', '#IV°'],
    progressions: [
      'Imaj7#11 - IV - V - I',
      'I - II - IV - I',
      'Imaj7 - II/I - IV - V',
    ],
    emotionalArc: 'Wonder → Clarity → Joy',
    famousExamples: ['Steve Vai ballads', 'Modern film scores'],
    bestInstruments: ['piano', 'brass', 'strings', 'acoustic guitar'],
  },
  dorian_lydian: {
    name: 'Dorian-Lydian (Jazz Fusion)',
    modes: ['dorian', 'lydian'] as const,
    keywords: ['jazz fusion', 'dorian lydian', 'sophisticated groove', 'fusion'],
    description: 'Jazzy minor sophistication meeting bright Lydian colors',
    borrowedChords: ['IV7#11', 'II7'],
    progressions: [
      'i7 - IV7#11',
      'i - II7 - IV - bVII',
      'i7 - IV7 - Imaj7#11 - iv',
    ],
    emotionalArc: 'Groove → Float → Depth',
    famousExamples: ['Herbie Hancock', 'Weather Report', 'Snarky Puppy'],
    bestInstruments: ['Rhodes', 'saxophone', 'bass', 'vibraphone'],
  },
  harmonic_major: {
    name: 'Harmonic Minor-Major (Classical Drama)',
    modes: ['harmonic_minor', 'ionian'] as const,
    keywords: ['classical drama', 'dramatic resolution', 'gothic triumph', 'picardy'],
    description: 'Dark dramatic tension resolving to triumphant major',
    borrowedChords: ['V7', 'bVI', 'I (Picardy)'],
    progressions: [
      'i - V7 - bVI - V7 - I',
      'i - iv - V7 - I',
      'i - bVI - V7 - I',
    ],
    emotionalArc: 'Tension → Drama → Triumph',
    famousExamples: ['Mozart symphonies', 'Tchaikovsky', 'Gothic film scores'],
    bestInstruments: ['strings', 'organ', 'choir', 'brass', 'piano'],
  },
  phrygian_major: {
    name: 'Phrygian-Major (Spanish Triumph)',
    modes: ['phrygian', 'ionian'] as const,
    keywords: ['spanish triumph', 'flamenco resolution', 'exotic bright'],
    description: 'Exotic Phrygian tension resolving to bright major triumph',
    borrowedChords: ['bII', 'V', 'I'],
    progressions: [
      'i - bII - V - I',
      'i - bII - bVII - I',
      'i - iv - bII - I',
    ],
    emotionalArc: 'Tension → Exotic → Liberation',
    famousExamples: ['Flamenco finales', 'Spanish classical'],
    bestInstruments: ['flamenco guitar', 'strings', 'brass', 'percussion'],
  },
} as const;

export const WITHIN_MODE_COMBINATIONS = {
  minor_journey: {
    name: 'Minor Scale Journey',
    modes: ['aeolian', 'harmonic_minor', 'melodic_minor'] as const,
    keywords: ['minor journey', 'minor exploration', 'evolving minor', 'minor scales'],
    description: 'Natural minor → Harmonic tension → Melodic sophistication',
    progressions: [
      'i - iv - V7 - i',
      'i - bVI - V7 - i(maj7)',
      'i - iv - V7 - i - i(maj7)',
    ],
    emotionalArc: 'Sadness → Drama → Resolution',
    famousExamples: ['Classical minor key works', 'Jazz ballads'],
    bestInstruments: ['piano', 'strings', 'cello', 'violin'],
  },
  lydian_exploration: {
    name: 'Lydian Exploration',
    modes: ['lydian', 'lydian_dominant', 'lydian_augmented'] as const,
    keywords: ['lydian exploration', 'lydian journey', 'all lydian', 'lydian modes'],
    description: 'Pure dream → Funky mystery → Cosmic strangeness',
    progressions: [
      'Imaj7#11 - IV7#11 - Imaj7#5',
      'I - II7 - Imaj7#5#11',
      'Imaj7#11 - II7 - Imaj7#5 - IV',
    ],
    emotionalArc: 'Dream → Groove → Otherworldly',
    famousExamples: ['Joe Satriani', 'Steve Vai', 'Film scores'],
    bestInstruments: ['synth pad', 'Rhodes', 'strings', 'glass bells'],
  },
  major_modes: {
    name: 'Major Mode Spectrum',
    modes: ['lydian', 'ionian', 'mixolydian'] as const,
    keywords: ['major modes', 'bright to bluesy', 'major exploration', 'major journey'],
    description: 'Floating → Resolved → Driving bluesy',
    progressions: [
      'Imaj7#11 - IV - V - I7',
      'I - II - IV - bVII',
      'Imaj7#11 - IV - I - bVII',
    ],
    emotionalArc: 'Wonder → Joy → Groove',
    famousExamples: ['Classic rock', 'Pop ballads'],
    bestInstruments: ['piano', 'guitar', 'Hammond organ', 'brass'],
  },
  dark_modes: {
    name: 'Dark Mode Descent',
    modes: ['aeolian', 'phrygian', 'locrian'] as const,
    keywords: ['dark modes', 'descending darkness', 'dark journey', 'darker and darker'],
    description: 'Sad → Exotic tension → Unstable dread',
    progressions: [
      'i - bII - i°',
      'i - bVI - bII - i°',
      'i - iv - bII - i°',
    ],
    emotionalArc: 'Melancholy → Danger → Dread',
    famousExamples: ['Horror scores', 'Metal progressions'],
    bestInstruments: ['strings', 'distorted synth', 'prepared piano', 'bass'],
  },
} as const;

export const ALL_COMBINATIONS = {
  ...CROSS_MODE_COMBINATIONS,
  ...WITHIN_MODE_COMBINATIONS,
} as const;

export type CrossModeCombination = keyof typeof CROSS_MODE_COMBINATIONS;
export type WithinModeCombination = keyof typeof WITHIN_MODE_COMBINATIONS;
export type CombinationType = keyof typeof ALL_COMBINATIONS;
