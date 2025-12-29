// Instrument articulation descriptors based on professional prompt patterns
// These add character and specificity to instrument tags

export type InstrumentCategory = 
  | 'guitar' 
  | 'piano' 
  | 'bass' 
  | 'drums' 
  | 'strings' 
  | 'brass' 
  | 'woodwind' 
  | 'synth'
  | 'organ'
  | 'percussion';

export const ARTICULATIONS: Record<InstrumentCategory, readonly string[]> = {
  guitar: [
    'Arpeggiated', 'Strummed', 'Picked', 'Palm Muted', 'Fingerpicked', 
    'Jangly', 'Clean', 'Overdriven', 'Crunchy', 'Chorus Drenched',
    'Reverb Soaked', 'Tremolo', 'Slide', 'Wah',
  ],
  piano: [
    'Comping', 'Arpeggiated', 'Block Chords', 'Stride Style', 
    'Sparse', 'Rolling', 'Gentle', 'Dramatic',
  ],
  bass: [
    'Walking', 'Slapped', 'Picked', 'Round', 'Deep', 'Punchy',
    'Subby', 'Groovy', 'Syncopated', 'Root Note',
  ],
  drums: [
    'Brushed', 'Tight', 'Punchy', 'Laid Back', 'Driving', 
    'Snappy', 'Tom Heavy', 'Minimal', 'Busy', 'Loose',
  ],
  strings: [
    'Legato', 'Staccato', 'Pizzicato', 'Tremolo', 'Swelling',
    'Lush', 'Warm', 'Soaring', 'Mournful',
  ],
  brass: [
    'Muted', 'Bold', 'Fanfare', 'Stabs', 'Swells', 
    'Punchy', 'Warm', 'Bright',
  ],
  woodwind: [
    'Legato', 'Staccato', 'Soft', 'Bright', 'Warm',
    'Solo', 'Ornamented', 'Runs',
  ],
  synth: [
    'Sidechained', 'Evolving', 'Plucky', 'Warm', 'Bright',
    'Detuned', 'Filtered', 'Pulsing', 'Shimmering',
  ],
  organ: [
    'Swelling', 'Comping', 'Warm', 'Bright', 'Full',
    'Sparse', 'Churchy',
  ],
  percussion: [
    'Tight', 'Loose', 'Syncopated', 'Soft', 'Driving',
    'Minimal', 'Busy', 'Latin',
  ],
} as const;

// Map instrument names to their categories for articulation lookup
export const INSTRUMENT_CATEGORIES: Record<string, InstrumentCategory> = {
  // Guitars
  'guitar': 'guitar',
  'acoustic guitar': 'guitar',
  'electric guitar': 'guitar',
  'nylon string guitar': 'guitar',
  'hollowbody guitar': 'guitar',
  'Fender Stratocaster': 'guitar',
  'Telecaster': 'guitar',
  'distorted guitar': 'guitar',
  'clean guitar': 'guitar',
  'fretless guitar': 'guitar',
  
  // Pianos
  'piano': 'piano',
  'grand piano': 'piano',
  'felt piano': 'piano',
  'prepared piano': 'piano',
  'Rhodes': 'piano',
  'Wurlitzer': 'piano',
  'electric piano': 'piano',
  'synth piano': 'piano',
  
  // Bass
  'bass': 'bass',
  'upright bass': 'bass',
  'walking bass': 'bass',
  'electric bass': 'bass',
  'synth bass': 'bass',
  '808': 'bass',
  
  // Drums
  'drums': 'drums',
  'jazz brushes': 'drums',
  'kick drum': 'drums',
  'snare': 'drums',
  'hi-hat': 'drums',
  'ride cymbal': 'drums',
  'toms': 'drums',
  
  // Strings
  'strings': 'strings',
  'violin': 'strings',
  'viola': 'strings',
  'cello': 'strings',
  'string ensemble': 'strings',
  
  // Brass
  'trumpet': 'brass',
  'muted trumpet': 'brass',
  'trombone': 'brass',
  'french horn': 'brass',
  'tuba': 'brass',
  'brass section': 'brass',
  
  // Woodwinds
  'saxophone': 'woodwind',
  'tenor sax': 'woodwind',
  'alto sax': 'woodwind',
  'clarinet': 'woodwind',
  'flute': 'woodwind',
  'oboe': 'woodwind',
  
  // Synths
  'synth': 'synth',
  'synth pad': 'synth',
  'analog synth': 'synth',
  'FM synth': 'synth',
  'Moog synth': 'synth',
  'arpeggiator': 'synth',
  'supersaw': 'synth',
  
  // Organs
  'organ': 'organ',
  'Hammond organ': 'organ',
  'pipe organ': 'organ',
  
  // Percussion
  'congas': 'percussion',
  'bongos': 'percussion',
  'shaker': 'percussion',
  'tambourine': 'percussion',
  'handclaps': 'percussion',
  'timpani': 'percussion',
};

// Get a random articulation for an instrument
export function getArticulationForInstrument(
  instrument: string,
  rng: () => number = Math.random
): string | null {
  const category = INSTRUMENT_CATEGORIES[instrument.toLowerCase()] || 
                   INSTRUMENT_CATEGORIES[instrument];
  
  if (!category) return null;
  
  const articulations = ARTICULATIONS[category];
  if (!articulations || articulations.length === 0) return null;
  
  const index = Math.floor(rng() * articulations.length);
  return articulations[index] ?? null;
}

// Apply articulation to an instrument string
export function articulateInstrument(
  instrument: string,
  rng: () => number = Math.random,
  chanceToArticulate: number = 0.4
): string {
  if (rng() > chanceToArticulate) return instrument;
  
  const articulation = getArticulationForInstrument(instrument, rng);
  if (!articulation) return instrument;
  
  return `${articulation} ${instrument}`;
}
