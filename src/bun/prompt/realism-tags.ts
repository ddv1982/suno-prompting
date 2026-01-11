// Realism and style tags for Suno Max Mode
// Based on community-discovered techniques for higher quality output

// Re-export MAX_MODE_HEADER from shared for backwards compatibility
export { MAX_MODE_HEADER } from '@shared/max-format';

// Recording context descriptors for max mode
export const RECORDING_DESCRIPTORS = [
  'live symphonic venue capture with atmospheric miking',
  'tape recorder, close-up, raw performance texture',
  'studio session, warm analog console',
  'intimate bedroom recording, DIY aesthetic',
  'outdoor field recording ambience',
  'vintage vinyl warmth, needle crackle',
  'radio broadcast compression character',
  'concert hall natural acoustics',
  'basement jam session energy',
  'late night studio session vibe',
  'bootleg live recording character',
  'demo tape roughness',
  'rehearsal room authenticity',
  'home studio intimacy',
  'professional mastering polish',
  'analog four-track warmth',
  'cassette tape saturation',
  'direct-to-disc recording',
  'single microphone capture',
] as const;

export function selectRecordingDescriptors(count: number = 3, rng: () => number = Math.random): string[] {
  const shuffled = [...RECORDING_DESCRIPTORS].sort(() => rng() - 0.5);
  return shuffled.slice(0, count);
}

/**
 * Vocal performance descriptors for vocal-capable genres.
 * Based on Suno V5 community research and official documentation.
 * 
 * Total tags: 38 across 8 categories
 * 
 * @example
 * // Access specific category
 * VOCAL_PERFORMANCE_TAGS.breathTexture // ['breathy delivery', 'airy vocals', ...]
 */
export const VOCAL_PERFORMANCE_TAGS = {
  /** Breathiness and vocal texture (5 tags) */
  breathTexture: [
    'breathy delivery',
    'airy vocals',
    'whispered tones',
    'smooth vocals',
    'raspy edge',
  ],
  
  /** Vocal power and dynamics (5 tags) */
  vocalPower: [
    'belt technique',
    'powerful vocals',
    'soft delivery',
    'intimate whisper',
    'vocal restraint',
  ],
  
  /** Extended techniques (5 tags) */
  techniques: [
    'falsetto sections',
    'chest voice dominance',
    'head voice clarity',
    'vibrato',
    'straight-tone delivery',
  ],
  
  /** Vocal character (5 tags) */
  character: [
    'crooner style',
    'operatic delivery',
    'conversational vocals',
    'theatrical performance',
    'raw emotion',
  ],
  
  /** Layering and harmony (5 tags) */
  layering: [
    'choir stacking',
    'vocal doubles',
    'harmony layers',
    'octave vocal layers',
    'unison vocal tracking',
  ],
  
  /** Articulation (4 tags) */
  articulation: [
    'clear diction',
    'slurred phrasing',
    'staccato delivery',
    'legato phrasing',
  ],
  
  /** Mic technique (4 tags) */
  micTechnique: [
    'close-mic intimacy',
    'distant mic character',
    'proximity effect',
    'off-axis vocal warmth',
  ],
  
  /** Genre-specific styles (5 tags) */
  genreStyles: [
    'soul vocal runs',
    'jazz scat vocalization',
    'gospel shouts',
    'country twang',
    'blues grit',
  ],
} as const;

/**
 * Spatial audio and reverb descriptors for stereo imaging.
 * Controls perceived space and depth in the mix.
 * 
 * Total tags: 22 across 5 categories
 * 
 * @example
 * // Access specific category
 * SPATIAL_AUDIO_TAGS.width // ['wide stereo field', 'narrow mono image', ...]
 */
export const SPATIAL_AUDIO_TAGS = {
  /** Stereo width (5 tags) */
  width: [
    'wide stereo field',
    'narrow mono image',
    'centered focus',
    'immersive soundstage',
    'mono-compatible mix',
  ],
  
  /** Reverb depth (5 tags) */
  depth: [
    'deep reverb space',
    'shallow room sound',
    'intimate dry space',
    'cavernous reverb',
    'tight ambience',
  ],
  
  /** Early reflections (4 tags) */
  reflections: [
    'early reflections emphasized',
    'smooth reverb tail',
    'diffuse reflections',
    'clear early reflections',
  ],
  
  /** Spatial positioning (4 tags) */
  positioning: [
    'center-focused elements',
    'wide panning',
    'binaural spacing',
    'left-right separation',
  ],
  
  /** Ambience (4 tags) */
  ambience: [
    'room ambience present',
    'atmospheric space',
    'dead room character',
    'environmental reverb',
  ],
} as const;

/**
 * Harmonic and frequency descriptors for tonal character.
 * Based on Suno V5 harmonic enhancement capabilities.
 * 
 * Total tags: 17 across 4 categories
 * 
 * @example
 * // Access specific category
 * HARMONIC_DESCRIPTORS.stacking // ['stacked harmonies', 'tight harmonies', ...]
 */
export const HARMONIC_DESCRIPTORS = {
  /** Harmony stacking (5 tags) */
  stacking: [
    'stacked harmonies',
    'tight harmonies',
    'wide harmony spread',
    'octave doubles',
    'unison harmonies',
  ],
  
  /** Harmonic richness (4 tags) */
  richness: [
    'harmonic richness',
    'overtone emphasis',
    'fundamental focus',
    'harmonic saturation',
  ],
  
  /** Frequency balance (4 tags) */
  balance: [
    'balanced frequency spectrum',
    'warm low mids',
    'bright high end',
    'scooped midrange',
  ],
  
  /** Tonal character (4 tags) */
  character: [
    'tonal warmth',
    'harmonic clarity',
    'vintage harmonic distortion',
    'clean harmonic structure',
  ],
} as const;

/**
 * Dynamic range and compression descriptors.
 * Controls perceived loudness and dynamics.
 * 
 * Total tags: 15 across 4 categories
 * 
 * @example
 * // Access specific category
 * DYNAMIC_RANGE_TAGS.compression // ['natural dynamics', 'compressed punch', ...]
 */
export const DYNAMIC_RANGE_TAGS = {
  /** Compression style (5 tags) */
  compression: [
    'natural dynamics',
    'compressed punch',
    'brickwall limiting',
    'vintage compression',
    'gentle compression',
  ],
  
  /** Dynamic contrast (4 tags) */
  contrast: [
    'high dynamic contrast',
    'consistent energy',
    'dynamic breathing room',
    'controlled peaks',
  ],
  
  /** Loudness (3 tags) */
  loudness: [
    'modern loudness',
    'vintage dynamic range',
    'mastered for streaming',
  ],
  
  /** Transients (3 tags) */
  transients: [
    'punchy transients',
    'soft transients',
    'transient emphasis',
  ],
} as const;

/**
 * Temporal and timing descriptors for rhythmic feel.
 * Influences perceived timing and groove.
 * 
 * Total tags: 12 across 3 categories
 * 
 * @example
 * // Access specific category
 * TEMPORAL_EFFECT_TAGS.timing // ['swing feel', 'straight time', ...]
 */
export const TEMPORAL_EFFECT_TAGS = {
  /** Timing feel (4 tags) */
  timing: [
    'swing feel',
    'straight time',
    'rushed timing',
    'laid-back groove',
  ],
  
  /** Micro-timing (4 tags) */
  microTiming: [
    'human timing drift',
    'quantized precision',
    'micro-rubato',
    'tight timing',
  ],
  
  /** Groove (4 tags) */
  groove: [
    'groove pocket',
    'stiff quantization',
    'loose feel',
    'locked groove',
  ],
} as const;

/**
 * Recording texture descriptors for overall sonic character.
 * Expanded from existing recording context concepts.
 * 
 * Total tags: 21 across 5 categories
 * 
 * @example
 * // Access specific category
 * TEXTURE_DESCRIPTORS.polish // ['polished production', 'raw texture', ...]
 */
export const TEXTURE_DESCRIPTORS = {
  /** Polish level (4 tags) */
  polish: [
    'polished production',
    'raw texture',
    'demo quality',
    'professional sheen',
  ],
  
  /** Analog/digital character (5 tags) */
  character: [
    'analog warmth',
    'digital precision',
    'tape saturation',
    'crystal clear',
    'vintage warmth',
  ],
  
  /** Fidelity (4 tags) */
  fidelity: [
    'lo-fi dusty',
    'hi-fi clarity',
    'mid-fi character',
    'bootleg quality',
  ],
  
  /** Organic/synthetic (4 tags) */
  nature: [
    'organic feel',
    'synthetic sheen',
    'acoustic authenticity',
    'electronic polish',
  ],
  
  /** Space and depth (4 tags) */
  space: [
    'layered depth',
    'flat 2d mix',
    'atmospheric space',
    'intimate close-up',
  ],
} as const;

/**
 * Vocal tag applicability per genre.
 * Controls whether vocal performance tags can be selected.
 * 
 * Probability values:
 * - 0.9-1.0: Almost always vocal (pop, r&b, soul)
 * - 0.6-0.8: Often vocal (jazz, rock, country)
 * - 0.3-0.5: Sometimes vocal (classical, electronic)
 * - 0.0-0.2: Rarely vocal (ambient, cinematic)
 * 
 * @example
 * // Check vocal probability for jazz
 * GENRE_VOCAL_PROBABILITY.jazz // 0.70
 */
export const GENRE_VOCAL_PROBABILITY: Record<string, number> = {
  // Almost always vocal
  pop: 0.95,
  rnb: 0.95,
  soul: 0.90,
  hiphop: 0.95,
  country: 0.90,
  gospel: 0.95,
  
  // Often vocal
  jazz: 0.70,
  blues: 0.80,
  rock: 0.75,
  folk: 0.85,
  punk: 0.80,
  metal: 0.60, // Growls/screams count as vocals
  
  // Sometimes vocal
  classical: 0.30, // Choral works
  electronic: 0.40,
  edm: 0.50,
  reggae: 0.75,
  latin: 0.80,
  funk: 0.70,
  
  // Rarely vocal
  ambient: 0.05,
  cinematic: 0.10,
  orchestral: 0.20,
  
  // Default for unmapped genres
  default: 0.50,
} as const;

/**
 * Electronic vs. organic tag weighting per genre.
 * Controls the ratio of electronic clarity tags vs. realism tags.
 * 
 * Values:
 * - 1.0: 100% electronic tags (edm, techno)
 * - 0.5-0.8: Hybrid genres (synthwave, electronic rock)
 * - 0.0: 100% realism tags (folk, classical)
 * 
 * @example
 * // Check electronic ratio for synthwave
 * GENRE_ELECTRONIC_RATIO.synthwave // 0.8
 */
export const GENRE_ELECTRONIC_RATIO: Record<string, number> = {
  // Pure electronic
  edm: 1.0,
  techno: 1.0,
  house: 1.0,
  trance: 1.0,
  dubstep: 1.0,
  dnb: 1.0,
  'drum and bass': 1.0,
  trap: 0.9,
  
  // Hybrid electronic/organic
  synthwave: 0.8,
  'electronic rock': 0.6,
  'future bass': 0.85,
  electropop: 0.75,
  indietronica: 0.60,
  
  // Minimal electronic (samples/synth pads)
  hiphop: 0.30,
  lofi: 0.35,
  ambient: 0.30,
  
  // Pure organic
  folk: 0.0,
  country: 0.0,
  classical: 0.0,
  jazz: 0.0,
  blues: 0.0,
  rock: 0.0,
  metal: 0.0,
  punk: 0.0,
  
  // Default
  default: 0.0,
} as const;

/**
 * Select vocal performance tags based on genre vocal probability.
 * Returns empty array if RNG roll fails the genre's vocal probability check.
 * 
 * Flattens all VOCAL_PERFORMANCE_TAGS categories, shuffles deterministically,
 * and returns up to `count` tags.
 * 
 * @param genre - Music genre to check vocal probability
 * @param count - Maximum number of tags to return
 * @param rng - Random number generator function (0.0-1.0) for deterministic selection
 * @returns Array of vocal performance tags, or empty array if probability check fails
 * 
 * @example
 * // High vocal probability genre (pop = 0.95)
 * selectVocalTags('pop', 2, () => 0.8) // ['breathy delivery', 'belt technique']
 * 
 * @example
 * // Low vocal probability genre (ambient = 0.05)
 * selectVocalTags('ambient', 2, () => 0.1) // [] (failed probability check)
 */
export function selectVocalTags(genre: string, count: number, rng: () => number = Math.random): string[] {
  const normalizedGenre = genre.toLowerCase().trim();
  const probability = GENRE_VOCAL_PROBABILITY[normalizedGenre] ?? GENRE_VOCAL_PROBABILITY['default'] ?? 0.50;
  
  // Check vocal probability with RNG roll
  if (rng() > probability) {
    return [];
  }
  
  // Flatten all vocal performance tags
  const allTags: string[] = [];
  for (const category of Object.values(VOCAL_PERFORMANCE_TAGS)) {
    allTags.push(...category);
  }
  
  // Shuffle using RNG and return max count
  const shuffled = [...allTags].sort(() => rng() - 0.5);
  return shuffled.slice(0, count);
}

/**
 * Select spatial audio tags for stereo imaging and reverb.
 * 
 * Flattens all SPATIAL_AUDIO_TAGS categories, shuffles deterministically,
 * and returns up to `count` tags.
 * 
 * @param count - Maximum number of tags to return
 * @param rng - Random number generator function (0.0-1.0) for deterministic selection
 * @returns Array of spatial audio tags
 * 
 * @example
 * selectSpatialTags(1, seedRng(42)) // ['wide stereo field']
 */
export function selectSpatialTags(count: number, rng: () => number = Math.random): string[] {
  const allTags: string[] = [];
  for (const category of Object.values(SPATIAL_AUDIO_TAGS)) {
    allTags.push(...category);
  }
  
  const shuffled = [...allTags].sort(() => rng() - 0.5);
  return shuffled.slice(0, count);
}

/**
 * Select harmonic descriptor tags for tonal character.
 * 
 * Flattens all HARMONIC_DESCRIPTORS categories, shuffles deterministically,
 * and returns up to `count` tags.
 * 
 * @param count - Maximum number of tags to return
 * @param rng - Random number generator function (0.0-1.0) for deterministic selection
 * @returns Array of harmonic descriptor tags
 * 
 * @example
 * selectHarmonicTags(1, seedRng(42)) // ['harmonic richness']
 */
export function selectHarmonicTags(count: number, rng: () => number = Math.random): string[] {
  const allTags: string[] = [];
  for (const category of Object.values(HARMONIC_DESCRIPTORS)) {
    allTags.push(...category);
  }
  
  const shuffled = [...allTags].sort(() => rng() - 0.5);
  return shuffled.slice(0, count);
}

/**
 * Select dynamic range tags for compression and loudness.
 * 
 * Flattens all DYNAMIC_RANGE_TAGS categories, shuffles deterministically,
 * and returns up to `count` tags.
 * 
 * @param count - Maximum number of tags to return
 * @param rng - Random number generator function (0.0-1.0) for deterministic selection
 * @returns Array of dynamic range tags
 * 
 * @example
 * selectDynamicTags(1, seedRng(42)) // ['natural dynamics']
 */
export function selectDynamicTags(count: number, rng: () => number = Math.random): string[] {
  const allTags: string[] = [];
  for (const category of Object.values(DYNAMIC_RANGE_TAGS)) {
    allTags.push(...category);
  }
  
  const shuffled = [...allTags].sort(() => rng() - 0.5);
  return shuffled.slice(0, count);
}

/**
 * Select temporal effect tags for timing and groove.
 * 
 * Flattens all TEMPORAL_EFFECT_TAGS categories, shuffles deterministically,
 * and returns up to `count` tags.
 * 
 * @param count - Maximum number of tags to return
 * @param rng - Random number generator function (0.0-1.0) for deterministic selection
 * @returns Array of temporal effect tags
 * 
 * @example
 * selectTemporalTags(1, seedRng(42)) // ['swing feel']
 */
export function selectTemporalTags(count: number, rng: () => number = Math.random): string[] {
  const allTags: string[] = [];
  for (const category of Object.values(TEMPORAL_EFFECT_TAGS)) {
    allTags.push(...category);
  }
  
  const shuffled = [...allTags].sort(() => rng() - 0.5);
  return shuffled.slice(0, count);
}

/**
 * Select texture descriptor tags for sonic character.
 * 
 * Flattens all TEXTURE_DESCRIPTORS categories, shuffles deterministically,
 * and returns up to `count` tags.
 * 
 * @param count - Maximum number of tags to return
 * @param rng - Random number generator function (0.0-1.0) for deterministic selection
 * @returns Array of texture descriptor tags
 * 
 * @example
 * selectTextureTags(1, seedRng(42)) // ['polished production']
 */
export function selectTextureTags(count: number, rng: () => number = Math.random): string[] {
  const allTags: string[] = [];
  for (const category of Object.values(TEXTURE_DESCRIPTORS)) {
    allTags.push(...category);
  }
  
  const shuffled = [...allTags].sort(() => rng() - 0.5);
  return shuffled.slice(0, count);
}

/**
 * Genre-specific recording contexts for Suno V5.
 * New in v2: Adds authentic recording environments per genre.
 * 
 * Each genre has 5-10 context descriptors describing typical recording environments,
 * equipment, and techniques used for that style. Contexts enhance variety and
 * authenticity by adding genre-appropriate production environments.
 * 
 * Total: 18 genres × 5-10 contexts = 161 unique recording context descriptors
 * 
 * @since v2.0.0
 * @example
 * // Access jazz recording contexts
 * GENRE_RECORDING_CONTEXTS['jazz'] // Returns array of jazz-specific contexts
 * 
 * @example
 * // Access electronic recording contexts
 * GENRE_RECORDING_CONTEXTS['electronic'] // Returns array of electronic production contexts
 */
export const GENRE_RECORDING_CONTEXTS: Record<string, readonly string[]> = {
  pop: [
    'modern pop studio',
    'professional vocal booth',
    'digital pop production',
    'radio-ready mix',
    'contemporary pop sound',
    'multitrack pop recording',
    'polished pop production',
    'commercial studio sound',
  ],
  
  rock: [
    'live room tracking',
    'vintage rock studio',
    'analog rock recording',
    'garage band setup',
    'stadium rock production',
    'rehearsal room energy',
    'basement rock session',
    'classic rock studio',
    'power trio setup',
  ],
  
  jazz: [
    'intimate jazz club',
    'small jazz ensemble',
    'live jazz session',
    'acoustic jazz space',
    'trio recording',
    'blue note studio vibe',
    'bebop era recording',
    'jazz quartet intimacy',
    'smoky club atmosphere',
  ],
  
  blues: [
    'delta blues porch recording',
    'chicago blues club',
    'juke joint atmosphere',
    'roadhouse blues session',
    'raw blues tracking',
    'vintage blues studio',
    'one-mic blues capture',
    'acoustic blues intimacy',
  ],
  
  soul: [
    'memphis soul studio',
    'motown recording booth',
    'classic soul sound',
    'vintage soul session',
    'church recording vibe',
    'stax records warmth',
    'philadelphia soul production',
    'southern soul studio',
  ],
  
  rnb: [
    'contemporary r&b studio',
    'smooth r&b production',
    'neo-soul recording',
    'modern r&b booth',
    'bedroom r&b session',
    'trap-soul production',
    'alternative r&b sound',
  ],
  
  country: [
    'nashville studio warmth',
    'honky-tonk recording',
    'country barn session',
    'acoustic country space',
    'outlaw country vibe',
    'bluegrass porch recording',
    'texas country studio',
    'americana recording',
    'country road sound',
  ],
  
  folk: [
    'coffeehouse recording',
    'cabin acoustic session',
    'folk festival sound',
    'living room intimacy',
    'campfire recording',
    'traditional folk space',
    'singer-songwriter booth',
    'acoustic folk studio',
  ],
  
  classical: [
    'concert hall recording',
    'symphonic venue capture',
    'chamber music space',
    'recital hall acoustics',
    'orchestral stage sound',
    'cathedral recording',
    'classical studio precision',
    'conservatory hall',
  ],
  
  orchestral: [
    'cinematic scoring stage',
    'symphonic hall capture',
    'film scoring studio',
    'large ensemble recording',
    'abbey road orchestral',
    'epic orchestral space',
    'studio orchestra sound',
  ],
  
  ambient: [
    'atmospheric field recording',
    'cathedral reverb space',
    'nature soundscape',
    'experimental studio',
    'ethereal sound design',
    'drone recording space',
    'minimal ambient room',
    'immersive soundscape',
  ],
  
  cinematic: [
    'film scoring stage',
    'epic trailer production',
    'cinematic sound design',
    'hollywood scoring studio',
    'dramatic orchestral space',
    'soundtrack recording',
    'theatrical sound stage',
  ],
  
  electronic: [
    'digital production studio',
    'electronic music workstation',
    'synthesizer laboratory',
    'modular synth setup',
    'laptop production',
    'home studio electronic',
    'professional edm studio',
    'hybrid analog-digital rig',
  ],
  
  edm: [
    'festival sound system',
    'club sound design',
    'mainstage production',
    'modern edm studio',
    'dj booth recording',
    'electronic dance floor',
    'rave warehouse sound',
    'massive sound system',
  ],
  
  house: [
    'chicago house studio',
    'underground club sound',
    'deep house production',
    'warehouse party vibe',
    'ibiza club recording',
    'classic house studio',
    'modern house production',
  ],
  
  techno: [
    'berlin warehouse techno',
    'industrial techno space',
    'minimal techno studio',
    'detroit techno sound',
    'underground rave recording',
    'modular techno setup',
    'acid techno production',
  ],
  
  metal: [
    'heavy metal studio',
    'brutal tracking room',
    'metal rehearsal space',
    'high-gain production',
    'thrash metal sound',
    'doom metal recording',
    'progressive metal studio',
    'extreme metal tracking',
  ],
  
  punk: [
    'punk basement recording',
    'raw punk session',
    'diy punk studio',
    'garage punk sound',
    'hardcore punk tracking',
    'independent punk recording',
    'lo-fi punk aesthetic',
  ],
} as const;

/**
 * Select recording context for a genre.
 * Returns genre-specific context if available, otherwise falls back to generic
 * recording descriptors from selectRecordingDescriptors().
 * 
 * New in v2.0.0: Genre-aware recording contexts provide authentic production
 * environments specific to each musical style.
 * 
 * @param genre - Genre name (e.g., 'jazz', 'rock', 'electronic')
 * @param rng - Seeded random number generator for deterministic selection
 * @returns One recording context string
 * 
 * @example
 * // Known genre returns genre-specific context
 * const context = selectRecordingContext('jazz', seedRng(42));
 * // Returns: "intimate jazz club" or similar jazz-specific context
 * 
 * @example
 * // Unknown genre falls back to generic recording descriptor
 * const context = selectRecordingContext('unknown-genre', seedRng(42));
 * // Returns: generic recording context from selectRecordingDescriptors()
 * 
 * @since v2.0.0
 */
export function selectRecordingContext(
  genre: string,
  rng: () => number = Math.random
): string {
  // Normalize genre (lowercase, trim)
  const normalizedGenre = genre.trim().toLowerCase();
  
  // Get genre-specific contexts if available
  const contexts = GENRE_RECORDING_CONTEXTS[normalizedGenre];
  
  if (contexts && contexts.length > 0) {
    // Select random context from genre-specific pool
    const index = Math.floor(rng() * contexts.length);
    const selected = contexts[index];
    if (selected) return selected;
  }
  
  // Fallback to generic recording descriptor
  const fallback = selectRecordingDescriptors(1, rng);
  const selected = fallback[0];
  return selected ?? 'studio recording';
}

/**
 * @internal
 * Test helpers for unit testing internal constants.
 * Do not use in production code.
 */
export const _testHelpers = {
  VOCAL_PERFORMANCE_TAGS,
  SPATIAL_AUDIO_TAGS,
  HARMONIC_DESCRIPTORS,
  DYNAMIC_RANGE_TAGS,
  TEMPORAL_EFFECT_TAGS,
  TEXTURE_DESCRIPTORS,
  GENRE_VOCAL_PROBABILITY,
  GENRE_ELECTRONIC_RATIO,
  GENRE_RECORDING_CONTEXTS,
} as const;
