// Realism and style tags for Suno Max Mode
// Based on community-discovered techniques for higher quality output

// Re-export MAX_MODE_HEADER from shared for backwards compatibility
export { MAX_MODE_HEADER } from '@shared/max-format';

// Realism descriptors for organic/acoustic genres
export const REALISM_TAGS = {
  // Room and space
  roomAcoustics: [
    'small room acoustics',
    'room tone',
    'small-bedroom acoustics',
    'natural reverb',
    'early reflections emphasized',
  ],
  // Microphone characteristics
  micCharacter: [
    'close mic presence',
    'off-axis mic placement',
    'proximity effect',
    'single-mic capture',
    'light mic handling noise',
  ],
  // Performance authenticity
  performance: [
    'one-take performance',
    'natural timing drift',
    'human micro-rubato',
    'natural dynamics',
    'no brickwall feel',
  ],
  // Human sounds
  humanSounds: [
    'breath detail',
    'audible inhales',
    'mouth noise',
    'subtle lip noise',
  ],
  // Instrument noises
  instrumentNoises: [
    'pick noise',
    'fret squeak',
    'string slides',
    'finger movement noise',
    'chair creak',
  ],
  // Analog character
  analogCharacter: [
    'tape saturation',
    'analog warmth',
    'harmonic grit',
    'slight wow & flutter',
    'gentle preamp drive',
  ],
  // Mix characteristics
  mixCharacter: [
    'limited stereo',
    'narrow mono image',
    'mono-compatible',
    'background noise floor consistent',
    'imperfections kept',
  ],
} as const;

// Electronic music clarity tags (opposite of realism - clean and tight)
export const ELECTRONIC_CLARITY_TAGS = {
  bassControl: [
    'tight sub bass',
    'controlled low end',
    'mono-compatible sub',
    'phase-aligned bass',
  ],
  transients: [
    'sharp transients',
    'fast attack',
    'clean punch',
    'high dynamic contrast',
  ],
  spatial: [
    'focused stereo image',
    'minimal spatial smear',
    'tight width',
    'center-focused mix',
  ],
  distortion: [
    'controlled saturation',
    'harmonic distortion only',
    'clean high end',
  ],
  arrangement: [
    'minimal layer stacking',
    'intentional drops',
    'clear drop structure',
  ],
} as const;

// Genre to tag category mapping
export const GENRE_REALISM_MAP: Record<string, (keyof typeof REALISM_TAGS)[]> = {
  // Acoustic/organic genres get full realism
  country: ['roomAcoustics', 'micCharacter', 'performance', 'humanSounds', 'instrumentNoises', 'analogCharacter', 'mixCharacter'],
  folk: ['roomAcoustics', 'micCharacter', 'performance', 'humanSounds', 'instrumentNoises', 'analogCharacter', 'mixCharacter'],
  acoustic: ['roomAcoustics', 'micCharacter', 'performance', 'humanSounds', 'instrumentNoises', 'mixCharacter'],
  blues: ['roomAcoustics', 'performance', 'humanSounds', 'instrumentNoises', 'analogCharacter'],
  jazz: ['roomAcoustics', 'micCharacter', 'performance', 'humanSounds', 'analogCharacter'],
  soul: ['roomAcoustics', 'performance', 'humanSounds', 'analogCharacter'],
  
  // Rock genres - some realism
  rock: ['performance', 'instrumentNoises', 'analogCharacter'],
  metal: ['performance', 'instrumentNoises'],
  punk: ['performance', 'instrumentNoises', 'analogCharacter'],
  
  // Classical/orchestral
  classical: ['roomAcoustics', 'performance'],
  orchestral: ['roomAcoustics', 'performance'],
  cinematic: ['roomAcoustics', 'performance'],
  
  // These genres don't benefit from realism tags
  electronic: [],
  edm: [],
  house: [],
  techno: [],
  trance: [],
  dubstep: [],
  dnb: [],
  synthwave: [],
  lofi: ['analogCharacter'], // lo-fi gets some analog character
  trap: [],
  hiphop: ['analogCharacter'],
  rap: [],
};

// Genres that should use electronic clarity tags instead
export const ELECTRONIC_GENRES = new Set([
  'electronic', 'edm', 'house', 'techno', 'trance', 'dubstep', 
  'dnb', 'drum and bass', 'synthwave', 'trap', 'future bass',
]);

export function selectRealismTags(genre: string, count: number = 4): string[] {
  const normalizedGenre = genre.toLowerCase().trim();
  const categories = GENRE_REALISM_MAP[normalizedGenre] || [];
  
  if (categories.length === 0) {
    return [];
  }
  
  // Collect all tags from relevant categories
  const allTags: string[] = [];
  for (const category of categories) {
    allTags.push(...REALISM_TAGS[category]);
  }
  
  // Shuffle and select
  const shuffled = [...allTags].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

export function selectElectronicTags(count: number = 4): string[] {
  const allTags: string[] = [];
  for (const category of Object.values(ELECTRONIC_CLARITY_TAGS)) {
    allTags.push(...category);
  }
  
  const shuffled = [...allTags].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

export function isElectronicGenre(genre: string): boolean {
  const normalizedGenre = genre.toLowerCase().trim();
  return ELECTRONIC_GENRES.has(normalizedGenre) || 
    normalizedGenre.includes('electronic') ||
    normalizedGenre.includes('synth') ||
    normalizedGenre.includes('edm');
}

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

export function selectRecordingDescriptors(count: number = 3): string[] {
  const shuffled = [...RECORDING_DESCRIPTORS].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

// Generic fallback tags that work for any genre
export const GENERIC_STYLE_TAGS = [
  'natural dynamics',
  'room tone',
  'performance authenticity',
  'subtle imperfections',
  'organic feel',
  'dynamic range preserved',
  'cohesive mix balance',
  'tasteful arrangement',
  'musical breathing room',
  'natural decay',
  'harmonic richness',
  'tonal warmth',
] as const;

export function selectGenericTags(count: number = 4): string[] {
  const shuffled = [...GENERIC_STYLE_TAGS].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}
