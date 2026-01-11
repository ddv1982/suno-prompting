/**
 * Recording context descriptors and genre-specific recording environments
 * @module prompt/tags/recording-context
 */

/**
 * Generic recording context descriptors for max mode
 */
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

/**
 * Select generic recording descriptors
 */
export function selectRecordingDescriptors(count: number = 3, rng: () => number = Math.random): string[] {
  const shuffled = [...RECORDING_DESCRIPTORS].sort(() => rng() - 0.5);
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
 * Total: 18 genres × 5-10 contexts = 141 unique recording context descriptors
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
