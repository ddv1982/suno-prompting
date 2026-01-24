// Instrument articulation descriptors based on professional prompt patterns
// These add character and specificity to instrument tags

import { APP_CONSTANTS } from '@shared/constants';

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
  chanceToArticulate: number = APP_CONSTANTS.ARTICULATION_CHANCE
): string {
  if (rng() > chanceToArticulate) return instrument;
  
  const articulation = getArticulationForInstrument(instrument, rng);
  if (!articulation) return instrument;
  
  return `${articulation} ${instrument}`;
}

/**
 * Probability of using theme-biased articulation when a theme matches.
 * The remaining probability falls through to standard random articulation.
 */
const THEME_ARTICULATION_BIAS_CHANCE = 0.6;

/**
 * Theme-to-articulation bias mapping for enhanced instrument articulation.
 *
 * Maps thematic keywords to preferred articulations for specific instrument
 * categories. When a theme matches, there's a THEME_ARTICULATION_BIAS_CHANCE (60%)
 * probability the biased articulation will be used instead of random selection.
 *
 * @since v2.1.0
 */
const THEME_ARTICULATION_BIAS: Record<string, Partial<Record<InstrumentCategory, string[]>>> = {
  gentle: { guitar: ['Fingerpicked', 'Clean'], piano: ['Gentle', 'Sparse'] },
  aggressive: { guitar: ['Crunchy', 'Overdriven'], drums: ['Punchy', 'Driving'] },
  dreamy: { guitar: ['Reverb Soaked', 'Chorus Drenched'], synth: ['Shimmering', 'Evolving'] },
  intimate: { piano: ['Sparse', 'Gentle'], strings: ['Warm', 'Legato'] },
  soft: { guitar: ['Clean', 'Fingerpicked'], piano: ['Gentle', 'Sparse'] },
  hard: { guitar: ['Crunchy', 'Overdriven'], drums: ['Punchy', 'Driving'] },
  ethereal: { synth: ['Shimmering', 'Evolving'], strings: ['Swelling', 'Lush'] },
  warm: { piano: ['Gentle'], strings: ['Warm', 'Legato'], bass: ['Round', 'Deep'] },
  energetic: { drums: ['Driving', 'Punchy'], bass: ['Punchy', 'Groovy'] },
  melancholic: { piano: ['Sparse', 'Gentle'], strings: ['Mournful', 'Legato'] },
} as const;

/**
 * Articulate instrument with theme-based bias.
 *
 * When themes are provided, checks for matches in the theme-articulation bias
 * mapping. If a match is found for the instrument's category, there's a
 * THEME_ARTICULATION_BIAS_CHANCE (60%) probability to use the biased articulation.
 * Falls back to standard random articulation when no theme match or on the
 * remaining probability.
 *
 * @param instrument - The instrument name to articulate
 * @param rng - Random number generator for deterministic selection
 * @param themes - Optional array of theme strings to check for articulation bias
 * @param chanceToArticulate - Base chance to apply any articulation (default: APP_CONSTANTS.ARTICULATION_CHANCE)
 * @returns The instrument string, possibly prefixed with an articulation descriptor
 *
 * @example
 * // With "gentle" theme and guitar, biases toward fingerpicked/clean
 * articulateInstrumentWithThemes('acoustic guitar', rng, ['gentle', 'nostalgic'])
 * // Returns: "Fingerpicked acoustic guitar" (60% chance when theme matches)
 *
 * @example
 * // With "aggressive" theme and drums, biases toward punchy/driving
 * articulateInstrumentWithThemes('drums', rng, ['aggressive', 'intense'])
 * // Returns: "Punchy drums" (60% chance when theme matches)
 *
 * @example
 * // Falls back to standard articulation when no theme match
 * articulateInstrumentWithThemes('piano', rng, ['nostalgic'])
 * // Returns: standard random articulation from articulateInstrument()
 *
 * @since v2.1.0
 */
export function articulateInstrumentWithThemes(
  instrument: string,
  rng: () => number,
  themes?: string[],
  chanceToArticulate: number = APP_CONSTANTS.ARTICULATION_CHANCE
): string {
  // Check base articulation chance
  if (rng() > chanceToArticulate) return instrument;

  // Get the instrument category
  const category = INSTRUMENT_CATEGORIES[instrument.toLowerCase()] ?? INSTRUMENT_CATEGORIES[instrument];
  if (!category) return instrument;

  // Check for theme-based bias
  if (themes && themes.length > 0) {
    for (const theme of themes) {
      const themeLower = theme.toLowerCase();
      const bias = THEME_ARTICULATION_BIAS[themeLower]?.[category];
      if (bias && bias.length > 0) {
        // Use biased articulation based on configured probability
        if (rng() < THEME_ARTICULATION_BIAS_CHANCE) {
          const index = Math.floor(rng() * bias.length);
          const selected = bias[index];
          if (selected) {
            return `${selected} ${instrument}`;
          }
        }
        // On the 40% chance, fall through to standard articulation
        break;
      }
    }
  }

  // Fall back to standard random articulation
  const articulation = getArticulationForInstrument(instrument, rng);
  if (!articulation) return instrument;

  return `${articulation} ${instrument}`;
}
