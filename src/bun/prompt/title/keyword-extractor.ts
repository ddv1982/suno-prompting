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
  waterfall: ['Water', 'River'],
  wildfire: ['Fire', 'Storm'],
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
  spirit: ['Spirit', 'Soul', 'Dream'],
  // Compound emotion words
  heartbreak: ['Heart', 'Cry', 'Lost', 'Shadow'],
  heartache: ['Heart', 'Cry', 'Lost'],
  loneliness: ['Silence', 'Lost', 'Shadow'],
  happiness: ['Light', 'Hope', 'Found'],
  sadness: ['Shadow', 'Lost', 'Cry'],
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


