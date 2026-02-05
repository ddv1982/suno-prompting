/**
 * Extended word pools for title generation
 *
 * Contains specialized word pools for numbers, places, single words,
 * and question formats for enhanced title variety.
 *
 * @module prompt/title/datasets/extended
 */

/**
 * Numbers and years for titles
 *
 * Convention: Mix of numeric formats, years, and number words in Title Case
 * Examples: '1984', '3AM', 'Seven'
 */
export const NUMBER_WORDS: readonly string[] = [
  // Years
  '1984',
  '2099',
  // Time formats
  '11:11',
  '24/7',
  '3AM',
  // Tech/music references
  '808',
  '404',
  // Simple numbers
  '7',
  '13',
  '21',
  '99',
  '1000',
  // Symbols
  '∞',
  // Number words
  'Zero',
  'One',
  'Seven',
  'Thirteen',
  'Infinite',
];

/**
 * Place names for titles
 *
 * Convention: City names in Title Case
 * Examples: 'Tokyo', 'Berlin', 'New York'
 */
export const PLACE_WORDS: readonly string[] = [
  // Asia
  'Tokyo',
  'Seoul',
  'Mumbai',
  'Shanghai',
  'Kyoto',
  // Europe
  'Berlin',
  'Paris',
  'London',
  'Moscow',
  'Amsterdam',
  'Barcelona',
  'Vienna',
  // Africa
  'Lagos',
  'Cairo',
  'Marrakech',
  // Americas
  'New York',
  'Rio',
  'Havana',
];

/**
 * Single evocative words for titles
 *
 * Convention: Powerful single words in Title Case
 * Examples: 'Bloom', 'Pulse', 'Ember'
 */
export const SINGLE_WORDS: readonly string[] = [
  // Growth/Light
  'Bloom',
  'Glow',
  'Spark',
  'Ember',
  'Nova',
  // Movement/Energy
  'Pulse',
  'Flux',
  'Drift',
  'Surge',
  'Wave',
  'Flow',
  // Atmosphere
  'Aether',
  'Echo',
  'Haze',
  'Void',
  // Direction/Change
  'Rise',
  'Fall',
  'Shift',
  'Fade',
  // Action
  'Crash',
  'Burn',
  'Float',
  'Dive',
  'Soar',
];

/**
 * Question format titles
 *
 * Convention: Complete questions in Title Case with question mark
 * Examples: 'Where Did You Go?', 'What If?'
 */
export const QUESTION_WORDS: readonly string[] = [
  'Where Did You Go?',
  'What If?',
  'Why Not?',
  'Who Are You?',
  'When Did It End?',
  'How Long?',
  'Is This Real?',
  'Can You Hear Me?',
  'Do You Remember?',
  'Will You Stay?',
];

/**
 * Extended pattern types
 *
 * Maps pattern category to available pattern templates
 */
export const EXTENDED_PATTERNS: Record<string, readonly string[]> = {
  number: ['{number}', 'Track {number}', '{number} Miles', '{number} Days', 'Room {number}'],
  place: [
    '{place}',
    'Nights in {place}',
    '{place} Dreams',
    'From {place}',
    '{place} Sunset',
    'Lost in {place}',
  ],
  single: ['{single}'],
  question: ['{question}'],
};
