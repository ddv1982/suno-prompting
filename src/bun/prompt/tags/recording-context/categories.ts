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
  demo: ['demo tape roughness', 'rough mix aesthetic', 'unpolished demo vibe'],
  raw: ['bootleg live recording character', 'raw performance energy', 'unedited authenticity'],
} as const;

/**
 * Recording environment types (mutually exclusive - pick ONE)
 */
export const RECORDING_ENVIRONMENT = {
  studio: ['studio session warmth', 'recording studio precision', 'controlled studio environment'],
  live: ['live venue capture', 'concert hall natural acoustics', 'live performance energy'],
  home: ['intimate bedroom recording', 'home studio intimacy', 'DIY home production'],
  rehearsal: ['rehearsal room authenticity', 'jam session energy', 'practice space vibe'],
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
  digital: ['digital production clarity', 'modern DAW precision', 'digital multitrack recording'],
  hybrid: ['hybrid analog-digital chain', 'mixed recording techniques'],
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
  spacious: ['atmospheric miking', 'room ambience capture', 'spacious reverb character'],
  vintage: ['vintage recording aesthetic', 'retro production character', 'classic recording vibe'],
  modern: ['contemporary production sound', 'modern recording techniques'],
  compressed: ['radio broadcast compression', 'tight dynamic control'],
} as const;
