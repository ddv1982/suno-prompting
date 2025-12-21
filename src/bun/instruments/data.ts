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
export type Genre = 'ambient';

export const AMBIENT_KEYWORDS = ['ambient', 'atmospheric', 'soundscape'] as const;

// Rarity types for instrument selection weighting
export type Rarity = 'common' | 'rare';

export type InstrumentTag =
  | 'organic'
  | 'electronic'
  | 'tonal'
  | 'textural'
  | 'bright'
  | 'dark'
  | 'metallic'
  | 'warm'
  | 'cold'
  | 'acoustic'
  | 'processed';

// Pool-based ambient instrument system for varied, coherent selections
export const AMBIENT_INSTRUMENT_POOLS = {
  coreHarmonic: {
    pick: { min: 1, max: 1 },
    instruments: [
      { name: 'Soft-felted acoustic piano - intimate, muted keys', rarity: 'common' as Rarity, tags: ['organic', 'acoustic', 'tonal', 'warm'] },
      { name: 'Soft-pedal acoustic piano - slow, sustained, intimate', rarity: 'common' as Rarity, tags: ['organic', 'acoustic', 'tonal', 'warm'] },
      { name: 'Prepared felt piano - gentle clacks, muted harmonics', rarity: 'common' as Rarity, tags: ['organic', 'acoustic', 'tonal', 'processed'] },
      { name: 'Upright piano through tape saturation - nostalgic bloom', rarity: 'common' as Rarity, tags: ['organic', 'acoustic', 'tonal', 'processed', 'warm'] },
      { name: 'Harmonium / pump organ drones - breathy, devotional sustain', rarity: 'common' as Rarity, tags: ['organic', 'acoustic', 'tonal', 'warm'] },
      { name: 'Celesta / music-box keys - delicate, glassy innocence', rarity: 'common' as Rarity, tags: ['organic', 'acoustic', 'tonal', 'bright'] },
      { name: 'Fender Rhodes - warm, electric piano tone', rarity: 'common' as Rarity, tags: ['organic', 'electronic', 'tonal', 'warm'] },
      { name: 'Wurlitzer electric piano - gritty warmth under reverb', rarity: 'common' as Rarity, tags: ['organic', 'electronic', 'tonal', 'warm'] },
      { name: 'Omnichord-style strums - naive harmony haze', rarity: 'common' as Rarity, tags: ['organic', 'electronic', 'tonal', 'warm'] },
      { name: 'Nord Stage-style keys (synth + pad blends)', rarity: 'common' as Rarity, tags: ['electronic', 'tonal', 'warm'] },
      { name: 'Early digital pads (Triton-style) - lush, orchestral-like', rarity: 'common' as Rarity, tags: ['electronic', 'textural', 'warm'] },
    ],
  },
  padsAtmosphere: {
    pick: { min: 1, max: 2 },
    instruments: [
      { name: 'Analog synth pads (Prophet / OB / Juno) - slow attack, long release', rarity: 'common' as Rarity, tags: ['electronic', 'textural', 'warm'] },
      { name: 'CS-80-style brass pads - soft, human, breathing', rarity: 'common' as Rarity, tags: ['electronic', 'textural', 'warm'] },
      { name: 'String-machine ensemble (Solina-style) - gentle vintage choir', rarity: 'common' as Rarity, tags: ['electronic', 'textural', 'warm'] },
      { name: 'Korg Wavestation-style wavesequencing pads - evolving, cinematic motion', rarity: 'common' as Rarity, tags: ['electronic', 'textural', 'bright'] },
      { name: 'Roland D-50/LA-synthesis pads - glossy, glass-and-air', rarity: 'common' as Rarity, tags: ['electronic', 'textural', 'bright', 'cold'] },
      { name: 'Compact polyphonic synths - ethereal pads and singing leads', rarity: 'common' as Rarity, tags: ['electronic', 'textural', 'warm'] },
      { name: 'Wavetable synth textures - complex, evolving, metallic', rarity: 'common' as Rarity, tags: ['electronic', 'textural', 'metallic', 'cold'] },
      { name: 'Analog-digital hybrid synthesis - deep, evolving drones', rarity: 'common' as Rarity, tags: ['electronic', 'textural', 'dark'] },
      { name: 'Granular pad clouds - soft, smeared harmonies', rarity: 'common' as Rarity, tags: ['electronic', 'textural', 'processed'] },
      { name: 'Pulsing string ensembles - slow, rhythmic swells', rarity: 'common' as Rarity, tags: ['electronic', 'textural'] },
      { name: 'Subtractive synth choirs - vowel-like pads, no words', rarity: 'common' as Rarity, tags: ['electronic', 'textural', 'warm'] },
    ],
  },
  colorOvertones: {
    pick: { min: 1, max: 1 },
    instruments: [
      { name: 'Bowed vibraphone', rarity: 'common' as Rarity, tags: ['organic', 'acoustic', 'tonal', 'metallic'] },
      { name: 'Marimba with long, atmospheric decay', rarity: 'common' as Rarity, tags: ['organic', 'acoustic', 'tonal', 'warm'] },
      { name: 'Kalimba / thumb piano - tiny notes in a huge room', rarity: 'common' as Rarity, tags: ['organic', 'acoustic', 'tonal', 'bright'] },
      { name: 'Glockenspiel / celesta sparkles - very sparse, very distant', rarity: 'common' as Rarity, tags: ['organic', 'acoustic', 'tonal', 'bright', 'metallic'] },
      { name: 'Gamelan/metallophone shimmer - soft strikes, long trails', rarity: 'common' as Rarity, tags: ['organic', 'acoustic', 'tonal', 'metallic'] },
      { name: 'Glassy bells, not melodies', rarity: 'common' as Rarity, tags: ['organic', 'acoustic', 'tonal', 'metallic', 'bright'] },
      { name: 'Crystal and Tibetan singing bowls - pure, resonant overtones', rarity: 'common' as Rarity, tags: ['organic', 'acoustic', 'tonal', 'metallic'] },
      { name: 'Waterphone-like bowed metal swells - eerie, cinematic', rarity: 'common' as Rarity, tags: ['organic', 'acoustic', 'tonal', 'metallic', 'dark'] },
      { name: 'Crisp Yamaha-FM tones (DX7-style) - glassy, cold, evolving', rarity: 'common' as Rarity, tags: ['electronic', 'tonal', 'bright', 'cold'] },
      { name: 'Synclavier-style digital textures - crystalline, evolving', rarity: 'rare' as Rarity, tags: ['electronic', 'textural', 'bright', 'cold'] },
    ],
  },
  expressiveVoices: {
    pick: { min: 0, max: 1 },
    instruments: [
      { name: 'Breathy wind synths / EWI-like leads - expressive, floating', rarity: 'common' as Rarity, tags: ['electronic', 'tonal', 'organic'] },
      { name: 'Warm analog leads - smooth, singing quality', rarity: 'common' as Rarity, tags: ['electronic', 'tonal', 'warm'] },
      { name: 'Wordless choir pads - human air, no lyrics', rarity: 'common' as Rarity, tags: ['organic', 'tonal', 'warm'] },
      { name: 'Bowed strings (cello/viola) - slow swells, endless sustain', rarity: 'common' as Rarity, tags: ['organic', 'acoustic', 'tonal', 'warm'] },
      { name: 'Bass clarinet breath tones - woody, deep, intimate', rarity: 'common' as Rarity, tags: ['organic', 'acoustic', 'tonal', 'dark'] },
      { name: 'Shakuhachi / duduk-like airy lead lines - fragile, haunting', rarity: 'common' as Rarity, tags: ['organic', 'acoustic', 'tonal', 'dark'] },
      { name: 'Ethereal electric guitar - lush chorus and deep reverb', rarity: 'common' as Rarity, tags: ['organic', 'electronic', 'tonal', 'processed'] },
    ],
  },
  textureTime: {
    pick: { min: 1, max: 1 },
    instruments: [
      { name: 'Looped tape textures / tape-hiss-saturated soundscapes', rarity: 'common' as Rarity, tags: ['electronic', 'textural', 'processed', 'warm'] },
      { name: 'Revox-style dual tape-loop/phasing system - unsynced evolution', rarity: 'common' as Rarity, tags: ['electronic', 'textural', 'processed'] },
      { name: 'Sound-on-sound tape delays (Echoplex-style)', rarity: 'common' as Rarity, tags: ['electronic', 'textural', 'processed', 'warm'] },
      { name: 'Decaying tape loops / oxide-shed artifacts - fragile, dissolving', rarity: 'common' as Rarity, tags: ['electronic', 'textural', 'processed', 'dark'] },
      { name: 'Shortwave radio drift + hiss beds - distant, haunted signals', rarity: 'common' as Rarity, tags: ['electronic', 'textural', 'processed', 'cold'] },
      { name: 'Granular processing - micro-looping atmospheres', rarity: 'common' as Rarity, tags: ['electronic', 'textural', 'processed'] },
      { name: 'Eventide H3000-style micro-pitch shimmer - spectral smear', rarity: 'common' as Rarity, tags: ['electronic', 'textural', 'processed', 'bright'] },
      { name: 'Generative melodic loops with differing lengths', rarity: 'common' as Rarity, tags: ['electronic', 'textural', 'processed'] },
      { name: 'Generative sequencers and samplers - rhythmic textures', rarity: 'common' as Rarity, tags: ['electronic', 'textural', 'processed'] },
    ],
  },
  subtleRhythm: {
    pick: { min: 0, max: 1 },
    instruments: [
      { name: 'Ethnic rattles, shakers, and gourds - subtle rhythmic layers', rarity: 'common' as Rarity, tags: ['organic', 'acoustic', 'textural'] },
      { name: 'Brush-on-frame-drum pulses - barely there, heartbeat-soft', rarity: 'common' as Rarity, tags: ['organic', 'acoustic', 'textural'] },
      { name: 'Soft handpan swells - gentle tonal percussion', rarity: 'common' as Rarity, tags: ['organic', 'acoustic', 'tonal', 'metallic'] },
      { name: 'Hybrid electronic-acoustic grooves - subtle, pulsing foundations', rarity: 'common' as Rarity, tags: ['electronic', 'textural'] },
      { name: 'Clockwork ticks / distant found-percussion - low presence', rarity: 'common' as Rarity, tags: ['organic', 'textural', 'processed'] },
      { name: 'Deep sub-bass drones - grounding, foundational low-end', rarity: 'common' as Rarity, tags: ['electronic', 'textural', 'dark'] },
    ],
  },
  contrastWildcard: {
    pick: { min: 0, max: 1 },
    chanceToInclude: 0.45,
    instruments: [
      { name: 'Chamber strings (viola/cello ensemble) - beatless, slow-moving clouds', rarity: 'common' as Rarity, tags: ['organic', 'acoustic', 'tonal', 'warm'] },
      { name: 'Effects-treated guitars (volume swells) - haloed chords, no attack', rarity: 'common' as Rarity, tags: ['organic', 'electronic', 'tonal', 'processed'] },
      { name: 'Clean digital glass mallets - icy, precise, minimal', rarity: 'common' as Rarity, tags: ['electronic', 'tonal', 'bright', 'cold'] },
      { name: 'Underwater hydrophone recordings - bubbles, currents, distant rumbles', rarity: 'common' as Rarity, tags: ['organic', 'textural', 'processed', 'cold'] },
      { name: 'Contact-mic object resonances - quiet metallic singing', rarity: 'common' as Rarity, tags: ['organic', 'textural', 'processed', 'metallic'] },
      { name: 'Noise veil (kept quiet) - grain, air, and soft distortion', rarity: 'common' as Rarity, tags: ['electronic', 'textural', 'processed', 'dark'] },
    ],
  },
  rare: {
    pick: { min: 0, max: 1 },
    chanceToInclude: 0.15,
    instruments: [
      { name: 'VCS 3-style patchboard synth textures', rarity: 'rare' as Rarity, tags: ['electronic', 'textural', 'processed'] },
      { name: 'EMS Synthi AKS-style generative loops - unsynced, quietly alive', rarity: 'rare' as Rarity, tags: ['electronic', 'textural', 'processed'] },
      { name: 'Buchla-style west-coast plucks + random voltages - delicate chaos', rarity: 'rare' as Rarity, tags: ['electronic', 'tonal', 'processed', 'bright'] },
      { name: 'ARP 2600 sequenced drones - hypnotic, evolving steps', rarity: 'rare' as Rarity, tags: ['electronic', 'textural', 'processed', 'dark'] },
      { name: 'Solfeggio frequency tones (528Hz, 432Hz) - meditative foundations', rarity: 'rare' as Rarity, tags: ['electronic', 'tonal', 'warm'] },
      { name: 'Briefcase modular synth (Synthi AKS-style)', rarity: 'rare' as Rarity, tags: ['electronic', 'textural', 'processed'] },
    ],
  },
} as const;

export type AmbientPoolName = keyof typeof AMBIENT_INSTRUMENT_POOLS;

// Exclusion rules: instruments containing these substrings should not appear together
export const AMBIENT_EXCLUSION_RULES: readonly [string, string][] = [
  ['acoustic piano', 'Rhodes'],
  ['Rhodes', 'Wurlitzer'],
  ['DX7', 'Triton'],
  ['bells', 'singing bowls'],
];
