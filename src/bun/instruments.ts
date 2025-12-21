// --- Utilities ---
function pickRandom<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]!;
}

function shuffle<T>(arr: readonly T[]): T[] {
  const result = [...arr];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j]!, result[i]!];
  }
  return result;
}

// --- Harmonic Styles ---
const HARMONIC_STYLES = {
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

const HARMONIC_PRIORITY: HarmonicStyle[] = ['lydian_dominant', 'lydian_augmented', 'lydian_sharp_two', 'lydian'];

export function detectHarmonic(description: string): HarmonicStyle | null {
  const lower = description.toLowerCase();
  for (const style of HARMONIC_PRIORITY) {
    if (HARMONIC_STYLES[style].keywords.some(kw => lower.includes(kw))) {
      return style;
    }
  }
  return null;
}

export function getHarmonicGuidance(style: HarmonicStyle): string {
  const s = HARMONIC_STYLES[style];
  const chars = shuffle(s.characteristics).slice(0, 3);
  const prog = pickRandom(s.progressions);

  return [
    `HARMONIC STYLE (${s.name}):`,
    s.description,
    `Chord: ${s.chordType}`,
    `Formula: ${s.formula}`,
    ...chars.map(c => `- ${c}`),
    `Suggested Progression: ${prog}`,
    `Examples: ${s.keyExamples}`,
  ].join('\n');
}

// --- Rhythmic Styles ---
const RHYTHMIC_STYLES = {
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

const RHYTHMIC_PRIORITY: RhythmicStyle[] = ['polyrhythm'];

export function detectRhythmic(description: string): RhythmicStyle | null {
  const lower = description.toLowerCase();
  for (const style of RHYTHMIC_PRIORITY) {
    if (RHYTHMIC_STYLES[style].keywords.some(kw => lower.includes(kw))) {
      return style;
    }
  }
  return null;
}

export function getRhythmicGuidance(style: RhythmicStyle): string {
  const s = RHYTHMIC_STYLES[style];
  const chars = shuffle(s.characteristics).slice(0, 3);
  return [
    `RHYTHMIC STYLE (${s.name}):`,
    s.description,
    `Common ratios: ${s.commonRatios}`,
    `Suggested elements: ${s.instruments}`,
    ...chars.map(c => `- ${c}`),
  ].join('\n');
}

// --- Genre Instruments ---
const GENRE_INSTRUMENTS = {
  ambient: {
    name: 'Ambient',
    keywords: ['ambient', 'atmospheric', 'soundscape'],
    description: 'Warm, intimate, emotional soundscapes with gentle movement',
    instruments: [
      'Felt piano / soft grand piano',
      'Fender Rhodes - warm, electric piano tone',
      'Nord Stage-style keys (piano + pad blends)',
      'Analog synth pads (Prophet / OB / Juno-ish) - slow attack, long release',
      'Breathy wind synths / EWI-like leads - expressive, floating',
      'Bowed vibraphone',
      'Glassy bells, not melodies',
      'Textural synth layers',
      'Looped tape textures / tape-hiss-saturated soundscapes',
      'Briefcase modular synth (Synthi AKS-style)',
      'Early digital FM synths (DX7-style) - glassy, cold, but evolving',
      'Wordless vocal loops / ethereal choir pads',
      'Sound-on-sound tape delays (Echoplex-style)',
      'VCS 3-style patchboard synth textures',
      'Generative melodic loops with differing lengths',
    ],
  },
} as const;

export type Genre = keyof typeof GENRE_INSTRUMENTS;

const GENRE_PRIORITY: Genre[] = ['ambient'];

export function detectGenre(description: string): Genre | null {
  const lower = description.toLowerCase();
  for (const style of GENRE_PRIORITY) {
    if (GENRE_INSTRUMENTS[style].keywords.some(kw => lower.includes(kw))) {
      return style;
    }
  }
  return null;
}

export function getGenreInstruments(genre: Genre): string {
  const g = GENRE_INSTRUMENTS[genre];
  const selectedInstruments = shuffle(g.instruments).slice(0, 5);
  return [
    `SUGGESTED INSTRUMENTS (${g.name}):`,
    g.description,
    ...selectedInstruments.map(i => `- ${i}`),
  ].join('\n');
}
