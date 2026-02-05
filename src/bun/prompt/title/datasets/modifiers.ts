/**
 * Genre-specific title patterns and modifiers
 *
 * Contains title template patterns organized by genre for
 * generating contextually appropriate song titles.
 *
 * @module prompt/title/datasets/modifiers
 */

/** Genre-specific title templates with placeholders */
export const GENRE_TITLE_PATTERNS: Record<string, readonly string[]> = {
  jazz: [
    '{time} {emotion}',
    'Blue {nature}',
    '{emotion} in {time}',
    'Smooth {nature}',
    '{time} Session',
    'Cool {emotion}',
    // New patterns
    'The {emotion} of {time}',
    '{nature} and {emotion}',
    'Between {time} and {nature}',
    "{emotion}'s {action}",
    '{action} Through {nature}',
  ],
  blues: [
    '{emotion} Blues',
    '{time} Blues',
    'Down by the {nature}',
    '{action} Away',
    'Lonesome {nature}',
    '{emotion} Road',
  ],
  rock: [
    '{action} {nature}',
    '{emotion} Anthem',
    '{nature} of {emotion}',
    'Rise of {abstract}',
    '{action} Free',
    '{time} Rebel',
    // New patterns
    'Born to {action}',
    'When {nature} {action}s',
    '{emotion} Never Dies',
    'The {action} {emotion}',
    "{nature}'s {emotion}",
    // Extended patterns
    '{single}',
    '{question}',
  ],
  metal: [
    '{nature} of {abstract}',
    '{action} in {emotion}',
    'Dark {nature}',
    '{abstract} Rising',
    'Through the {nature}',
    'March of {emotion}',
  ],
  pop: [
    '{emotion} Tonight',
    '{action} Hearts',
    '{time} Love',
    'Feel the {nature}',
    '{emotion} Vibes',
    'Sweet {emotion}',
    // New patterns
    'All the {emotion}',
    '{action} With Me',
    'My {nature}',
    '{emotion} Forever',
    // Extended patterns
    '{single}',
    '{question}',
    '{place} Love',
  ],
  electronic: [
    '{abstract} State',
    'Digital {nature}',
    '{action} Signal',
    'Electric {emotion}',
    'Synthetic {nature}',
    '{time} Pulse',
    // New patterns
    '{emotion}.exe',
    'System {abstract}',
    '{action} Protocol',
    'Cyber {nature}',
    '{abstract} Algorithm',
    // Extended patterns
    '{number}',
    'Track {number}',
    '{single}',
    '{place} Nights',
  ],
  ambient: [
    '{nature} Drift',
    '{time} Meditation',
    'Floating {emotion}',
    'Ethereal {nature}',
    '{abstract} Space',
    'Gentle {nature}',
    // New patterns
    '{emotion} in the {abstract}',
    'Whispers of {nature}',
    "{time}'s {emotion}",
    'The {action} {abstract}',
    // Extended patterns
    '{single}',
    '{place} Dreams',
    '{question}',
  ],
  classical: [
    '{nature} Sonata',
    '{emotion} Nocturne',
    '{time} Prelude',
    'Opus of {abstract}',
    '{nature} Symphony',
    '{emotion} Waltz',
  ],
  folk: [
    '{nature} Song',
    'Old {time} Tale',
    'Wandering {emotion}',
    'Country {nature}',
    '{emotion} Ballad',
    'Homespun {emotion}',
  ],
  country: [
    '{time} on the {nature}',
    'Dusty {nature}',
    '{emotion} Highway',
    'Back Road {emotion}',
    '{nature} Nights',
    'Heartland {emotion}',
  ],
  hiphop: [
    '{action} Hard',
    '{emotion} Streets',
    '{time} Grind',
    'Real {emotion}',
    '{abstract} Flow',
    'City {nature}',
  ],
  rnb: [
    '{emotion} Touch',
    '{time} Romance',
    'Velvet {nature}',
    'Slow {emotion}',
    '{action} Closer',
    'Silk {emotion}',
  ],
  soul: [
    '{emotion} Soul',
    'Deep {nature}',
    '{time} Feeling',
    'Soulful {emotion}',
    '{nature} of Love',
    'Gospel {emotion}',
  ],
  reggae: [
    '{nature} Vibes',
    'Island {emotion}',
    '{time} Riddim',
    'One {abstract}',
    '{emotion} Sunshine',
    'Roots {nature}',
  ],
  latin: [
    '{nature} Fuego',
    '{emotion} Corazón',
    '{time} Caliente',
    'Tropical {nature}',
    '{action} Ritmo',
    'Passion {emotion}',
  ],
  funk: [
    'Get {action}',
    '{emotion} Groove',
    'Funky {nature}',
    '{time} Jam',
    'Super {emotion}',
    '{action} Machine',
  ],
  disco: [
    '{time} Fever',
    '{action} Floor',
    'Disco {nature}',
    'Glitter {emotion}',
    '{emotion} Night',
    'Mirror {nature}',
  ],
  punk: [
    '{action} System',
    'No {abstract}',
    '{emotion} Riot',
    'Raw {nature}',
    '{action} Rules',
    'Anarchy {emotion}',
  ],
  indie: [
    'Little {nature}',
    '{emotion} Days',
    'Quiet {time}',
    '{nature} Theory',
    'Paper {emotion}',
    '{time} Wonder',
  ],
  lofi: [
    '{time} Study',
    'Chill {nature}',
    'Lo-Fi {emotion}',
    'Lazy {time}',
    'Soft {nature}',
    'Cozy {emotion}',
  ],
  // Synthwave/Retro genres with extended patterns
  synthwave: [
    '{time} Drive',
    'Chrome {nature}',
    'Retro {emotion}',
    'Chrome {nature}',
    '{action} Machine',
    'Digital {emotion}',
    // Extended patterns
    '{place} Nights',
    '{number}',
    '{single}',
    'Lost in {place}',
    'Escape from {place}',
    '{emotion} Highway',
  ],
  outrun: [
    '{time} Chase',
    'Turbo {emotion}',
    'Nighttime {action}',
    '{nature} Runner',
    'Speed {emotion}',
    // Extended patterns
    '{place} Drive',
    '{number}',
    '{single}',
    'Escape from {place}',
  ],
  darksynth: [
    'Dark {nature}',
    '{emotion} Machine',
    'Cyber {abstract}',
    '{action} Destroyer',
    'Synth {emotion}',
    // Extended patterns
    '{number}',
    '{single}',
    '{place} Shadows',
  ],
};

/**
 * Default patterns for unknown genres
 *
 * Pattern examples:
 * - '{emotion} of the {nature}' → "Shadow of the Moon"
 * - '{action} Through {nature}' → "Dancing Through Fire"
 * - '{nature}'s {emotion}' → "Ocean's Memory"
 * - 'When {nature} {action}s' → "When Thunder Strikes"
 * - 'Between {time} and {emotion}' → "Between Midnight and Dreams"
 */
export const DEFAULT_PATTERNS: readonly string[] = [
  // Original 2-word patterns
  '{emotion} {nature}',
  '{time} {emotion}',
  '{action} {nature}',
  '{nature} of {abstract}',
  '{emotion} Journey',
  '{time} Tale',
  // New 3-word patterns
  '{emotion} of the {nature}',
  '{action} Through {nature}',
  'The {emotion} {action}',
  '{time} in {abstract}',
  // Possessive patterns
  "{nature}'s {emotion}",
  "{time}'s {action}",
  "{emotion}'s {nature}",
  // Additional patterns
  'When {nature} {action}s',
  '{emotion} and {nature}',
  'Between {time} and {emotion}',
];
