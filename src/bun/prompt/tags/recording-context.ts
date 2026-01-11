/**
 * Recording context descriptors and genre-specific recording environments
 * @module prompt/tags/recording-context
 */

// =============================================================================
// Structured Recording Context Categories (Conflict Prevention)
// =============================================================================

/**
 * Production quality levels (mutually exclusive - pick ONE)
 */
const RECORDING_PRODUCTION_QUALITY = {
  professional: [
    'professional mastering polish',
    'studio-grade production',
    'commercial studio sound',
  ],
  demo: [
    'demo tape roughness',
    'rough mix aesthetic',
    'unpolished demo vibe',
  ],
  raw: [
    'bootleg live recording character',
    'raw performance energy',
    'unedited authenticity',
  ],
} as const;

/**
 * Recording environment types (mutually exclusive - pick ONE)
 */
const RECORDING_ENVIRONMENT = {
  studio: [
    'studio session warmth',
    'recording studio precision',
    'controlled studio environment',
  ],
  live: [
    'live venue capture',
    'concert hall natural acoustics',
    'live performance energy',
  ],
  home: [
    'intimate bedroom recording',
    'home studio intimacy',
    'DIY home production',
  ],
  rehearsal: [
    'rehearsal room authenticity',
    'jam session energy',
    'practice space vibe',
  ],
  outdoor: [
    'outdoor field recording ambience',
    'natural environment capture',
    'open-air recording',
  ],
} as const;

/**
 * Recording technique (analog/digital) (mutually exclusive - pick ONE)
 */
const RECORDING_TECHNIQUE = {
  analog: [
    'warm analog console',
    'tape recorder warmth',
    'analog four-track character',
    'cassette tape saturation',
    'vintage vinyl warmth',
    'direct-to-disc recording',
  ],
  digital: [
    'digital production clarity',
    'modern DAW precision',
    'digital multitrack recording',
  ],
  hybrid: [
    'hybrid analog-digital chain',
    'mixed recording techniques',
  ],
} as const;

/**
 * Recording characteristics (can combine multiple)
 */
const RECORDING_CHARACTER = {
  intimate: [
    'intimate close-micd sound',
    'close-up performance texture',
    'single microphone capture',
  ],
  spacious: [
    'atmospheric miking',
    'room ambience capture',
    'spacious reverb character',
  ],
  vintage: [
    'vintage recording aesthetic',
    'retro production character',
    'classic recording vibe',
  ],
  modern: [
    'contemporary production sound',
    'modern recording techniques',
  ],
  compressed: [
    'radio broadcast compression',
    'tight dynamic control',
  ],
} as const;

/**
 * Legacy: All recording descriptors (for backward compatibility)
 * Note: Kept for existing usage, but prefer selectRecordingDescriptors()
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

// =============================================================================
// Helper Functions
// =============================================================================

/**
 * Select random item from a category subcategory
 */
function selectFromSubcategory<T extends Record<string, readonly string[]>>(
  category: T,
  subcategory: keyof T,
  rng: () => number
): string {
  const items = category[subcategory];
  if (!items || items.length === 0) return '';
  const index = Math.floor(rng() * items.length);
  return items[index] ?? '';
}

/**
 * Select random subcategory key from category
 */
function selectRandomKey<T extends Record<string, unknown>>(
  obj: T,
  rng: () => number
): keyof T {
  const keys = Object.keys(obj) as Array<keyof T>;
  const index = Math.floor(rng() * keys.length);
  const selected = keys[index];
  if (selected !== undefined) return selected;
  // Fallback to first key (should never happen with non-empty objects)
  return keys[0] as keyof T;
}

// =============================================================================
// Genre-Aware Selection Helpers
// =============================================================================

/**
 * Check if genre matches electronic patterns
 */
function isElectronic(normalized: string): boolean {
  return normalized.includes('electronic') || normalized.includes('edm') || 
         normalized.includes('house') || normalized.includes('techno') ||
         normalized.includes('trap') || normalized.includes('dubstep');
}

/**
 * Check if genre matches acoustic/vintage patterns
 */
function isAcousticVintage(normalized: string): boolean {
  return normalized.includes('folk') || normalized.includes('blues') ||
         normalized.includes('jazz') || normalized.includes('soul') ||
         normalized.includes('vintage') || normalized.includes('retro');
}

/**
 * Check if genre matches modern pop/rock patterns
 */
function isModernPopRock(normalized: string): boolean {
  return normalized.includes('pop') || normalized.includes('rock') ||
         normalized.includes('indie');
}

/**
 * Determine preferred recording technique based on genre
 */
function getPreferredTechnique(genre?: string): 'analog' | 'digital' | 'hybrid' | null {
  if (!genre) return null;
  
  const normalized = genre.toLowerCase();
  
  // Electronic genres prefer digital
  if (isElectronic(normalized)) return 'digital';
  
  // Vintage/acoustic genres prefer analog
  if (isAcousticVintage(normalized)) return 'analog';
  
  // Modern pop/rock can use hybrid
  if (isModernPopRock(normalized)) return 'hybrid';
  
  return null;
}

/**
 * Determine preferred environment based on genre
 */
function getPreferredEnvironment(genre?: string): keyof typeof RECORDING_ENVIRONMENT | null {
  if (!genre) return null;
  
  const normalized = genre.toLowerCase();
  
  // Classical/orchestral prefer live venues
  if (normalized.includes('classical') || normalized.includes('orchestral') ||
      normalized.includes('symphonic')) {
    return 'live';
  }
  
  // Jazz/blues often recorded live
  if (normalized.includes('jazz') || normalized.includes('blues')) {
    return 'live';
  }
  
  // Lo-fi/bedroom pop prefer home
  if (normalized.includes('lofi') || normalized.includes('lo-fi') ||
      normalized.includes('bedroom')) {
    return 'home';
  }
  
  // Punk/garage prefer rehearsal
  if (normalized.includes('punk') || normalized.includes('garage')) {
    return 'rehearsal';
  }
  
  return null;
}

// =============================================================================
// Public API
// =============================================================================

/**
 * Select recording descriptors with conflict prevention.
 * 
 * Structured selection ensures no conflicting tags (e.g., "professional" + "demo",
 * "analog" + "digital", "concert hall" + "bedroom").
 * 
 * Strategy:
 * 1. Pick ONE production quality (professional/demo/raw)
 * 2. Pick ONE environment (studio/live/home/rehearsal/outdoor) - genre-aware
 * 3. Pick ONE technique (analog/digital/hybrid) - genre-aware
 * 4. Optionally add characteristics (intimate/spacious/vintage/modern)
 * 
 * @param count - Number of descriptors to return (1-4)
 * @param rng - Random number generator for deterministic selection
 * @param genre - Optional genre for genre-aware selection
 * @returns Array of compatible recording descriptors
 * 
 * @example
 * // Basic usage
 * selectRecordingDescriptors(2)
 * // ["professional mastering polish", "studio session warmth"]
 * 
 * @example
 * // Genre-aware (electronic gets digital)
 * selectRecordingDescriptors(3, Math.random, 'electronic')
 * // ["professional mastering polish", "studio session warmth", "digital production clarity"]
 * 
 * @example
 * // Genre-aware (jazz gets analog + live)
 * selectRecordingDescriptors(3, Math.random, 'jazz')
 * // ["raw performance energy", "live venue capture", "warm analog console"]
 */
export function selectRecordingDescriptors(
  count: number = 3,
  rng: () => number = Math.random,
  genre?: string
): string[] {
  const selected: string[] = [];
  const clampedCount = Math.max(1, Math.min(4, count));
  
  // 1. Pick ONE production quality
  const qualityKey = selectRandomKey(RECORDING_PRODUCTION_QUALITY, rng);
  const quality = selectFromSubcategory(RECORDING_PRODUCTION_QUALITY, qualityKey, rng);
  selected.push(quality);
  
  if (clampedCount >= 2) {
    // 2. Pick ONE environment (genre-aware)
    const preferredEnv = getPreferredEnvironment(genre);
    const envKey = preferredEnv ?? selectRandomKey(RECORDING_ENVIRONMENT, rng);
    const environment = selectFromSubcategory(RECORDING_ENVIRONMENT, envKey, rng);
    selected.push(environment);
  }
  
  if (clampedCount >= 3) {
    // 3. Pick ONE technique (genre-aware)
    const preferredTech = getPreferredTechnique(genre);
    const techKey = preferredTech ?? selectRandomKey(RECORDING_TECHNIQUE, rng);
    const technique = selectFromSubcategory(RECORDING_TECHNIQUE, techKey, rng);
    selected.push(technique);
  }
  
  if (clampedCount >= 4) {
    // 4. Optionally add character
    const charKey = selectRandomKey(RECORDING_CHARACTER, rng);
    const character = selectFromSubcategory(RECORDING_CHARACTER, charKey, rng);
    selected.push(character);
  }
  
  return selected;
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
