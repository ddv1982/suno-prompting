/**
 * Keyword extraction for topic-aware title generation
 *
 * Extracts meaningful keywords from descriptions and maps them to
 * word categories for better title relevance.
 *
 * @module prompt/title/keyword-extractor
 */

// =============================================================================
// Keyword Mapping
// =============================================================================

/** Maps description keywords to TIME_WORDS */
const TIME_KEYWORDS: Record<string, string[]> = {
  night: ['Midnight', 'Night', 'Evening', 'Dusk'],
  morning: ['Morning', 'Dawn', 'Daybreak'],
  day: ['Morning', 'Daybreak', 'Sun'],
  sunset: ['Sunset', 'Dusk', 'Twilight'],
  twilight: ['Twilight', 'Dusk'],
  dawn: ['Dawn', 'Daybreak', 'Morning'],
  midnight: ['Midnight', 'Night'],
  evening: ['Evening', 'Dusk', 'Twilight'],
  star: ['Starlight', 'Night', 'Stars'],
  moon: ['Moon', 'Night', 'Midnight'],
  // Compound time words
  nightfall: ['Night', 'Dusk', 'Evening'],
  nighttime: ['Night', 'Midnight'],
  sunrise: ['Morning', 'Dawn', 'Sun'],
  moonlight: ['Moon', 'Night', 'Starlight'],
  moonrise: ['Moon', 'Evening', 'Dusk'],
  starlight: ['Starlight', 'Night', 'Stars'],
  // Seasons
  spring: ['Spring', 'Morning', 'Blossom'],
  summer: ['Summer', 'Sun', 'Daylight'],
  autumn: ['Autumn', 'Dusk', 'Twilight'],
  fall: ['Autumn', 'Dusk', 'Twilight'],
  winter: ['Winter', 'Night', 'Snow'],
  // Additional time
  yesterday: ['Yesterday', 'Memory', 'Past'],
  tomorrow: ['Tomorrow', 'Hope', 'Future'],
  today: ['Moment', 'Present', 'Now'],
  forever: ['Forever', 'Eternity', 'Always'],
  never: ['Never', 'Lost', 'Silence'],
  always: ['Always', 'Forever', 'Eternity'],
  hour: ['Hour', 'Moment', 'Time'],
  moment: ['Moment', 'Instant', 'Second'],
  instant: ['Instant', 'Moment', 'Second'],
  century: ['Century', 'Era', 'Ages'],
  era: ['Era', 'Epoch', 'Ages'],
  age: ['Ages', 'Era', 'Eternity'],
  noon: ['Noon', 'Daylight', 'Sun'],
  afternoon: ['Afternoon', 'Daylight'],
};

/** Maps description keywords to NATURE_WORDS */
const NATURE_KEYWORDS: Record<string, string[]> = {
  ocean: ['Ocean', 'Waves', 'Water'],
  sea: ['Ocean', 'Waves', 'Water'],
  water: ['Ocean', 'River', 'Rain', 'Waves'],
  rain: ['Rain', 'Storm', 'Water'],
  storm: ['Storm', 'Thunder', 'Rain', 'Wind'],
  wind: ['Wind', 'Storm'],
  sky: ['Sky', 'Stars', 'Moon', 'Sun'],
  mountain: ['Mountain', 'Sky'],
  forest: ['Forest', 'Wind'],
  fire: ['Fire', 'Sun'],
  snow: ['Snow', 'Wind'],
  thunder: ['Thunder', 'Storm'],
  river: ['River', 'Water', 'Waves'],
  beach: ['Ocean', 'Waves', 'Sun'],
  desert: ['Sun', 'Fire', 'Sand'],
  city: ['Sky', 'Fire', 'Thunder'],
  urban: ['Sky', 'Fire', 'Thunder'],
  // Compound nature words
  rainfall: ['Rain', 'Water', 'Storm'],
  rainstorm: ['Rain', 'Storm', 'Thunder'],
  snowfall: ['Snow', 'Wind'],
  snowstorm: ['Snow', 'Storm', 'Wind'],
  windstorm: ['Wind', 'Storm', 'Thunder'],
  riverside: ['River', 'Water'],
  waterfall: ['Cascade', 'Water', 'River'],
  wildfire: ['Fire', 'Storm'],
  // Weather
  fog: ['Fog', 'Mist', 'Shadow'],
  mist: ['Mist', 'Fog', 'Rain'],
  cloud: ['Sky', 'Storm', 'Rain'],
  lightning: ['Thunder', 'Storm', 'Fire'],
  breeze: ['Breeze', 'Wind', 'Air'],
  gale: ['Gale', 'Wind', 'Storm'],
  hurricane: ['Hurricane', 'Storm', 'Wind'],
  tornado: ['Tornado', 'Storm', 'Wind'],
  // Landscapes
  valley: ['Valley', 'Mountain', 'River'],
  canyon: ['Canyon', 'Mountain', 'Stone'],
  cliff: ['Cliff', 'Mountain', 'Stone'],
  peak: ['Peak', 'Summit', 'Mountain'],
  summit: ['Summit', 'Peak', 'Mountain'],
  horizon: ['Horizon', 'Sky', 'Sun'],
  prairie: ['Prairie', 'Sky', 'Wind'],
  jungle: ['Jungle', 'Forest', 'Rain'],
  // Water
  lake: ['Lake', 'Water', 'Moon'],
  pond: ['Pond', 'Lake', 'Water'],
  stream: ['Stream', 'River', 'Water'],
  brook: ['Brook', 'Stream', 'Water'],
  creek: ['Creek', 'Stream', 'Water'],
  cascade: ['Cascade', 'Water', 'River'],
  wave: ['Waves', 'Ocean', 'Water'],
  tide: ['Waves', 'Ocean', 'Moon'],
  // Celestial
  comet: ['Comet', 'Stars', 'Sky'],
  meteor: ['Meteor', 'Stars', 'Fire'],
  nebula: ['Nebula', 'Stars', 'Cosmos', 'Galaxy'],
  // Elements
  earth: ['Earth', 'Stone', 'Mountain'],
  air: ['Air', 'Wind', 'Sky'],
  ash: ['Ash', 'Fire', 'Dust'],
  dust: ['Dust', 'Wind', 'Sand'],
  sand: ['Sand', 'Desert', 'Dust'],
  stone: ['Stone', 'Mountain', 'Earth'],
  crystal: ['Crystal', 'Ice', 'Stone'],
  ice: ['Ice', 'Snow', 'Crystal'],
  // Flora
  flower: ['Blossom', 'Petal', 'Spring'],
  blossom: ['Blossom', 'Petal', 'Spring'],
  petal: ['Petal', 'Blossom', 'Flower'],
  tree: ['Branch', 'Root', 'Forest'],
  leaf: ['Leaf', 'Branch', 'Forest'],
  seed: ['Seed', 'Root', 'Earth'],
};

/** Maps description keywords to EMOTION_WORDS */
const EMOTION_KEYWORDS: Record<string, string[]> = {
  love: ['Love', 'Heart', 'Dream'],
  heart: ['Heart', 'Love', 'Soul'],
  dream: ['Dream', 'Spirit', 'Hope'],
  hope: ['Hope', 'Light', 'Dream'],
  lost: ['Lost', 'Shadow', 'Memory'],
  found: ['Found', 'Light', 'Hope'],
  memory: ['Memory', 'Echo', 'Dream'],
  remember: ['Memory', 'Echo', 'Dream'],
  forget: ['Lost', 'Shadow', 'Silence'],
  sad: ['Shadow', 'Lost', 'Cry'],
  happy: ['Light', 'Hope', 'Found'],
  lonely: ['Silence', 'Shadow', 'Lost'],
  alone: ['Silence', 'Solitude', 'Shadow'],
  together: ['Heart', 'Love', 'Found'],
  break: ['Breaking', 'Cry', 'Lost'],
  heal: ['Hope', 'Light', 'Found'],
  pain: ['Cry', 'Shadow', 'Lost'],
  joy: ['Light', 'Hope', 'Dream'],
  soul: ['Soul', 'Spirit', 'Heart'],
  // Compound emotion words
  heartbreak: ['Heart', 'Cry', 'Lost', 'Shadow'],
  heartache: ['Heart', 'Cry', 'Lost'],
  loneliness: ['Silence', 'Lost', 'Shadow'],
  happiness: ['Light', 'Hope', 'Found'],
  sadness: ['Shadow', 'Lost', 'Cry'],
  // Additional emotions
  anger: ['Rage', 'Fury', 'Fire'],
  rage: ['Rage', 'Fury', 'Chaos'],
  fury: ['Fury', 'Rage', 'Storm'],
  fear: ['Fear', 'Dread', 'Shadow'],
  courage: ['Courage', 'Hope', 'Light'],
  brave: ['Courage', 'Hope', 'Light'],
  peace: ['Peace', 'Serenity', 'Calm'],
  peaceful: ['Peace', 'Serenity', 'Calm'],
  excited: ['Elation', 'Euphoria', 'Joy'],
  passion: ['Passion', 'Desire', 'Fire'],
  passionate: ['Passion', 'Desire', 'Yearning'],
  desire: ['Desire', 'Yearning', 'Passion'],
  longing: ['Longing', 'Yearning', 'Desire'],
  grief: ['Grief', 'Sorrow', 'Tears'],
  sorrow: ['Sorrow', 'Grief', 'Despair'],
  tears: ['Tears', 'Cry', 'Sorrow'],
  cry: ['Cry', 'Tears', 'Grief'],
  laugh: ['Laughter', 'Joy', 'Bliss'],
  laughter: ['Laughter', 'Joy', 'Elation'],
  wonder: ['Wonder', 'Awe', 'Dream'],
  awe: ['Awe', 'Wonder', 'Mystery'],
  trust: ['Trust', 'Faith', 'Bond'],
  faith: ['Faith', 'Trust', 'Hope'],
  doubt: ['Doubt', 'Fear', 'Shadow'],
  regret: ['Regret', 'Remorse', 'Memory'],
  shame: ['Shame', 'Regret', 'Shadow'],
  pride: ['Pride', 'Courage', 'Light'],
};

/** Maps description keywords to ACTION_WORDS */
const ACTION_KEYWORDS: Record<string, string[]> = {
  rise: ['Rising', 'Flying'],
  rising: ['Rising', 'Flying'],
  fall: ['Falling', 'Fading'],
  falling: ['Falling', 'Fading'],
  run: ['Running', 'Chasing'],
  running: ['Running', 'Chasing'],
  dance: ['Dancing', 'Flying'],
  dancing: ['Dancing', 'Flying'],
  fly: ['Flying', 'Rising'],
  flying: ['Flying', 'Rising'],
  burn: ['Burning', 'Fire'],
  burning: ['Burning', 'Fire'],
  fade: ['Fading', 'Falling'],
  fading: ['Fading', 'Falling'],
  drift: ['Drifting', 'Floating'],
  drifting: ['Drifting', 'Floating'],
  chase: ['Chasing', 'Running'],
  chasing: ['Chasing', 'Running'],
  break: ['Breaking', 'Falling'],
  breaking: ['Breaking', 'Falling'],
};

/** Maps description keywords to ABSTRACT_WORDS */
const ABSTRACT_KEYWORDS: Record<string, string[]> = {
  forever: ['Eternity', 'Infinity'],
  eternal: ['Eternity', 'Infinity'],
  infinity: ['Infinity', 'Eternity'],
  eternity: ['Eternity', 'Infinity'],
  free: ['Freedom', 'Flying'],
  freedom: ['Freedom', 'Liberty'],
  destiny: ['Destiny', 'Fate'],
  fate: ['Destiny', 'Fate'],
  chaos: ['Chaos', 'Storm'],
  peace: ['Serenity', 'Harmony'],
  calm: ['Serenity', 'Peace'],
  balance: ['Balance', 'Harmony'],
  harmony: ['Harmony', 'Balance'],
  truth: ['Truth', 'Light'],
  // Musical terms
  rhythm: ['Rhythm', 'Pulse', 'Beat'],
  beat: ['Beat', 'Pulse', 'Rhythm'],
  pulse: ['Pulse', 'Beat', 'Rhythm'],
  melody: ['Resonance', 'Harmony'],
  music: ['Rhythm', 'Harmony', 'Resonance'],
  song: ['Resonance', 'Harmony'],
  tempo: ['Rhythm', 'Pulse', 'Beat'],
  // Journey/Path
  journey: ['Journey', 'Quest', 'Voyage'],
  quest: ['Quest', 'Journey', 'Path'],
  voyage: ['Voyage', 'Journey', 'Quest'],
  path: ['Path', 'Road', 'Journey'],
  road: ['Road', 'Path', 'Journey'],
  wander: ['Journey', 'Path', 'Quest'],
  // Space/Cosmic
  space: ['Cosmos', 'Universe', 'Void'],
  cosmic: ['Cosmos', 'Universe', 'Galaxy'],
  universe: ['Universe', 'Cosmos', 'Infinity'],
  galaxy: ['Galaxy', 'Cosmos', 'Universe'],
  cosmos: ['Cosmos', 'Universe', 'Galaxy'],
  void: ['Void', 'Abyss', 'Nothingness'],
  abyss: ['Abyss', 'Void', 'Nothingness'],
  // Mystical/Spiritual
  mystery: ['Mystery', 'Enigma', 'Riddle'],
  enigma: ['Enigma', 'Mystery', 'Paradox'],
  magic: ['Mystery', 'Illusion', 'Wonder'],
  spirit: ['Spirit', 'Soul', 'Essence', 'Dream'],
  divine: ['Transcendence', 'Nirvana', 'Serenity'],
  transcend: ['Transcendence', 'Ascension'],
  // Additional concepts
  battle: ['Chaos', 'Storm', 'Thunder'],
  war: ['Chaos', 'Storm', 'Fury'],
  fight: ['Chaos', 'Fury', 'Rage'],
  reality: ['Reality', 'Truth', 'Existence'],
  illusion: ['Illusion', 'Dream', 'Mystery'],
  time: ['Eternity', 'Infinity', 'Timeless'],
  timeless: ['Timeless', 'Eternity', 'Immortality'],
  immortal: ['Immortality', 'Eternity', 'Timeless'],
  fleeting: ['Fleeting', 'Ephemeral', 'Mortality'],
};

// =============================================================================
// Extraction Logic
// =============================================================================

/**
 * Helper function to extract keywords from a single category.
 * Uses word boundary regex for precise matching to avoid false positives.
 *
 * @param descLower - Lowercased description text
 * @param categoryKeywords - Keyword mappings for this category
 * @param categoryName - Name of the category (e.g., 'time', 'nature')
 * @param result - Result object to accumulate keywords into
 */
function extractCategoryKeywords(
  descLower: string,
  categoryKeywords: Record<string, string[]>,
  categoryName: string,
  result: Record<string, string[]>
): void {
  for (const [keyword, words] of Object.entries(categoryKeywords)) {
    // Use word boundary regex for precise matching
    // This prevents false positives like "nightingale" matching "night"
    const regex = new RegExp(`\\b${keyword}\\b`, 'i');
    if (regex.test(descLower)) {
      result[categoryName] = [...(result[categoryName] || []), ...words];
    }
  }
}

/**
 * Extract keywords from description and map to word categories.
 * Returns a map of category -> preferred words based on description content.
 *
 * Uses word boundary matching for precise keyword detection, avoiding false positives
 * like "nightingale" matching "night".
 *
 * @param description - User's song description
 * @returns Map of category names to arrays of preferred words
 *
 * @example
 * extractKeywords('A song about midnight rain and lost love')
 * // {
 * //   time: ['Midnight', 'Night'],
 * //   nature: ['Rain', 'Storm'],
 * //   emotion: ['Lost', 'Shadow', 'Love', 'Heart']
 * // }
 */
export function extractKeywords(description?: string): Record<string, string[]> {
  if (!description) return {};

  const descLower = description.toLowerCase();
  const keywords: Record<string, string[]> = {};

  // Extract keywords for each category using helper function
  extractCategoryKeywords(descLower, TIME_KEYWORDS, 'time', keywords);
  extractCategoryKeywords(descLower, NATURE_KEYWORDS, 'nature', keywords);
  extractCategoryKeywords(descLower, EMOTION_KEYWORDS, 'emotion', keywords);
  extractCategoryKeywords(descLower, ACTION_KEYWORDS, 'action', keywords);
  extractCategoryKeywords(descLower, ABSTRACT_KEYWORDS, 'abstract', keywords);

  // Deduplicate arrays
  for (const category in keywords) {
    keywords[category] = [...new Set(keywords[category])];
  }

  return keywords;
}


