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
export const GENRE_INSTRUMENTS = {
  ambient: {
    name: 'Ambient',
    keywords: ['ambient', 'atmospheric', 'soundscape'],
    description: 'Warm, intimate, emotional soundscapes with gentle movement',
    instruments: [
      'Soft-pedal acoustic piano - slow, sustained, intimate',
      'Fender Rhodes - warm, electric piano tone',
      'Nord Stage-style keys (synth + pad blends)',
      'Analog synth pads (Prophet / OB / Juno-ish) - slow attack, long release',
      'Breathy wind synths / EWI-like leads - expressive, floating',
      'Bowed vibraphone',
      'Marimba with long, atmospheric decay',
      'Glassy bells, not melodies',
      'Ethnic rattles, shakers, and gourds - subtle rhythmic layers',
      'Textural synth layers',
      'Looped tape textures / tape-hiss-saturated soundscapes',
      'Briefcase modular synth (Synthi AKS-style)',
      'Early digital FM synths (DX7-style) - glassy, cold, but evolving',
      'Synclavier-style digital textures - crystalline, evolving',
      'Sound-on-sound tape delays (Echoplex-style)',
      'VCS 3-style patchboard synth textures',
      'Generative melodic loops with differing lengths',
      'Ethereal electric guitar - processed with lush chorus and deep reverb',
      'Muted trumpet with deep atmospheric reverb',
      'Pulsing string ensembles - slow, rhythmic swells',
      'Wavetable synth textures - complex, evolving, and metallic',
      'Warm analog leads - smooth, singing quality',
      'Early digital pads (Triton-style) - lush, orchestral-like',
      'Ambient guitar loops - layered, rhythmic, and melodic',
      'Hybrid electronic-acoustic grooves - subtle, pulsing foundations',
    ],
  },
} as const;

export type Genre = keyof typeof GENRE_INSTRUMENTS;
