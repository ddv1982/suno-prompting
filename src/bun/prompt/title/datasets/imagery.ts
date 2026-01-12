/**
 * Imagery word lists for title generation
 *
 * Contains nature-based, abstract, and time-based imagery words
 * for generating evocative titles.
 *
 * @module prompt/title/datasets/imagery
 */

/**
 * Time-based words for atmospheric titles
 *
 * Convention: All entries use Title Case, including multi-word phrases
 * Examples: 'Midnight', 'Golden Hour', 'Witching Hour'
 */
export const TIME_WORDS: readonly string[] = [
  // Original words (10)
  'Midnight',
  'Dawn',
  'Twilight',
  'Sunset',
  'Morning',
  'Evening',
  'Night',
  'Daybreak',
  'Dusk',
  'Starlight',
  // Seasons (6)
  'Spring',
  'Summer',
  'Autumn',
  'Winter',
  'Solstice',
  'Equinox',
  // Time periods (8)
  'Hour',
  'Moment',
  'Instant',
  'Second',
  'Minute',
  'Century',
  'Era',
  'Epoch',
  // Day parts (6)
  'Noon',
  'Afternoon',
  'Daylight',
  'Nightfall',
  'Sunrise',
  'Moonrise',
  // Poetic time (7)
  'Yesterday',
  'Tomorrow',
  'Forever',
  'Never',
  'Always',
  'Eternity',
  'Ages',
  // Specific times (4)
  'Golden Hour',
  'Blue Hour',
  'Witching Hour',
  'Zero Hour',
  // Cycles (5)
  'Cycle',
  'Phase',
  'Turn',
  'Passage',
  'Interval',
];

/**
 * Nature-based words for title generation
 *
 * Convention: All entries use Title Case
 * Examples: 'Ocean', 'Mountain', 'Thunder'
 */
export const NATURE_WORDS: readonly string[] = [
  // Original words (15)
  'Ocean',
  'River',
  'Mountain',
  'Forest',
  'Rain',
  'Storm',
  'Wind',
  'Sky',
  'Moon',
  'Sun',
  'Stars',
  'Waves',
  'Thunder',
  'Snow',
  'Fire',
  // Weather (9)
  'Fog',
  'Mist',
  'Hail',
  'Sleet',
  'Drizzle',
  'Breeze',
  'Gale',
  'Hurricane',
  'Tornado',
  // Landscapes (10)
  'Valley',
  'Canyon',
  'Cliff',
  'Peak',
  'Summit',
  'Horizon',
  'Prairie',
  'Tundra',
  'Jungle',
  'Savanna',
  // Water features (7)
  'Lake',
  'Pond',
  'Brook',
  'Creek',
  'Stream',
  'Cascade',
  'Rapids',
  // Celestial (7)
  'Comet',
  'Meteor',
  'Nebula',
  'Galaxy',
  'Cosmos',
  'Void',
  'Abyss',
  // Elements (9)
  'Earth',
  'Air',
  'Ember',
  'Ash',
  'Dust',
  'Sand',
  'Stone',
  'Crystal',
  'Ice',
  // Flora (8)
  'Blossom',
  'Petal',
  'Thorn',
  'Vine',
  'Root',
  'Branch',
  'Leaf',
  'Seed',
];

/**
 * Abstract concept words for title generation
 *
 * Convention: All entries use Title Case
 * Examples: 'Infinity', 'Eternity', 'Journey'
 */
export const ABSTRACT_WORDS: readonly string[] = [
  // Original words (10)
  'Infinity',
  'Eternity',
  'Destiny',
  'Freedom',
  'Solitude',
  'Serenity',
  'Chaos',
  'Harmony',
  'Balance',
  'Truth',
  // Concepts (6)
  'Reality',
  'Illusion',
  'Mystery',
  'Enigma',
  'Paradox',
  'Riddle',
  // Philosophy (6)
  'Existence',
  'Void',
  'Nothingness',
  'Everything',
  'Being',
  'Essence',
  // Time abstracts (5)
  'Immortality',
  'Mortality',
  'Ephemeral',
  'Fleeting',
  'Timeless',
  // Space abstracts (6)
  'Universe',
  'Dimension',
  'Realm',
  'Plane',
  'Boundary',
  'Threshold',
  // States (6)
  'Transcendence',
  'Ascension',
  'Descent',
  'Limbo',
  'Purgatory',
  'Nirvana',
  // Additional concepts (9)
  'Quest',
  'Journey',
  'Voyage',
  'Path',
  'Road',
  'Pulse',
  'Beat',
  'Rhythm',
  'Resonance',
];

/** Generic descriptors for instrument qualities */
export const GENERIC_DESCRIPTORS: readonly string[] = [
  'rich',
  'warm',
  'bright',
  'smooth',
  'textured',
  'resonant',
  'subtle',
  'bold',
  'delicate',
  'expansive',
];
