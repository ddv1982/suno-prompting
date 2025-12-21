// Harmonic style definitions
export const HARMONIC_STYLES = {
  lydian_dominant: {
    name: 'Lydian Dominant',
    keywords: ['dominant', '7#11', 'jazzy', 'fusion', 'funk'],
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
  },
  lydian_augmented: {
    name: 'Lydian Augmented',
    keywords: ['augmented', '#5', 'mysterious', 'alien', 'space'],
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
  },
  lydian_sharp_two: {
    name: 'Lydian #2',
    keywords: ['#2', 'sharp 2', 'exotic', 'enchanted', 'magic'],
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
  },
  lydian: {
    name: 'Pure Lydian',
    keywords: ['lydian', '#11', 'sharp 11', 'maj7#11'],
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
  },
} as const;

export type HarmonicStyle = keyof typeof HARMONIC_STYLES;

// Rhythmic style definitions
export const RHYTHMIC_STYLES = {
  polyrhythm: {
    name: 'Polyrhythm',
    keywords: ['polyrhythm', 'poly rhythm', 'poly-rhythm', 'cross rhythm', 'cross-rhythm', '2:3', '3:4', '4:3', '5:4', '7:4', 'interlocking rhythm'],
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

// Genre instrument definitions
export const AMBIENT_KEYWORDS = ['ambient', 'atmospheric', 'soundscape'] as const;

// Pool-based ambient instrument system (Suno-only terms).
// Output is always 2–4 tags.
export const AMBIENT_INSTRUMENT_POOLS = {
  harmonicAnchor: {
    pick: { min: 1, max: 1 },
    instruments: ['prepared piano', 'felt piano', 'harmonium', 'celesta', 'strings', 'guitar', 'acoustic guitar', 'fretless guitar'] as const,
  },
  padOrSynth: {
    pick: { min: 1, max: 1 },
    instruments: ['synth pad', 'analog synth pads', 'analog synth', 'digital synth', 'FM synth', 'Moog synth', 'synth', 'crystalline synth pads'] as const,
  },
  rare: {
    pick: { min: 0, max: 1 },
    chanceToInclude: 0.25,
    instruments: ['taiko drums', 'steel pan', 'Hammond organ'] as const,
  },
  color: {
    pick: { min: 0, max: 1 },
    instruments: [
      'electric piano',
      'Rhodes',
      'Wurlitzer',
      'cello',
      'vibraphone',
      'bowed vibraphone',
      'marimba',
      'kalimba',
      'glockenspiel',
      'bells',
      'glass bells',
      'singing bowls',
      'choir',
      'wordless choir',
      'clarinet',
      'shakuhachi',
      'duduk',
      'breathy EWI',
    ] as const,
  },
  movement: {
    pick: { min: 0, max: 1 },
    instruments: ['percussion', 'toms', 'shaker', 'frame drum', 'handpan', 'sub-bass'] as const,
  },
} as const;

export type AmbientPoolName = keyof typeof AMBIENT_INSTRUMENT_POOLS;

export const AMBIENT_POOL_ORDER = ['harmonicAnchor', 'padOrSynth', 'rare', 'color', 'movement'] as const satisfies readonly AmbientPoolName[];

export const AMBIENT_MAX_TAGS = 4;

export const AMBIENT_GUIDANCE_DESCRIPTION = 'Ambient: warm, intimate, emotional soundscapes with gentle movement';

export const AMBIENT_INSTRUMENTS_HEADER = 'SUGGESTED INSTRUMENTS (Suno tags):';

export type SunoInstrumentToken =
  (typeof AMBIENT_INSTRUMENT_POOLS)[keyof typeof AMBIENT_INSTRUMENT_POOLS]['instruments'][number];

// Exclusion rules: instruments containing these substrings should not appear together
export const AMBIENT_EXCLUSION_RULES: readonly [string, string][] = [
  ['acoustic piano', 'Rhodes'],
  ['Rhodes', 'Wurlitzer'],
  ['bells', 'singing bowls'],
];
