/**
 * Structured recording context categories for conflict prevention
 * @module prompt/tags/recording-context/categories
 */

/**
 * Maximum number of recording descriptors (one from each category)
 * Categories: quality + environment + technique + character = 4 max
 */
export const MAX_RECORDING_DESCRIPTORS = 4;

/**
 * Production quality levels (mutually exclusive - pick ONE)
 */
export const RECORDING_PRODUCTION_QUALITY = {
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
export const RECORDING_ENVIRONMENT = {
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
export const RECORDING_TECHNIQUE = {
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
export const RECORDING_CHARACTER = {
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
 * @deprecated Will be removed in v3.0.0 - Use selectRecordingDescriptors() instead
 * 
 * Legacy: All recording descriptors kept for backward compatibility.
 * New code should use selectRecordingDescriptors() which provides:
 * - Conflict prevention (no "analog" + "digital")
 * - Genre-aware selection (electronic → digital, jazz → analog)
 * - Structured categories for musical coherence
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
