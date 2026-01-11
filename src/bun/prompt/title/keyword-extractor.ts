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
 * Extract keywords from description and map to word categories.
 * Returns a map of category -> preferred words based on description content.
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

  // Extract time-related keywords
  for (const [keyword, words] of Object.entries(TIME_KEYWORDS)) {
    if (descLower.includes(keyword)) {
      keywords.time = [...(keywords.time || []), ...words];
    }
  }

  // Extract nature-related keywords
  for (const [keyword, words] of Object.entries(NATURE_KEYWORDS)) {
    if (descLower.includes(keyword)) {
      keywords.nature = [...(keywords.nature || []), ...words];
    }
  }

  // Extract emotion-related keywords
  for (const [keyword, words] of Object.entries(EMOTION_KEYWORDS)) {
    if (descLower.includes(keyword)) {
      keywords.emotion = [...(keywords.emotion || []), ...words];
    }
  }

  // Extract action-related keywords
  for (const [keyword, words] of Object.entries(ACTION_KEYWORDS)) {
    if (descLower.includes(keyword)) {
      keywords.action = [...(keywords.action || []), ...words];
    }
  }

  // Extract abstract-related keywords
  for (const [keyword, words] of Object.entries(ABSTRACT_KEYWORDS)) {
    if (descLower.includes(keyword)) {
      keywords.abstract = [...(keywords.abstract || []), ...words];
    }
  }

  // Deduplicate arrays
  for (const category in keywords) {
    keywords[category] = [...new Set(keywords[category])];
  }

  return keywords;
}

/**
 * Check if a word is available in the topic-aware keywords.
 *
 * @param word - Word to check
 * @param category - Word category
 * @param keywords - Extracted keywords map
 * @returns True if word matches topic keywords
 */
export function isTopicRelevant(
  word: string,
  category: string,
  keywords: Record<string, string[]>
): boolean {
  const categoryKeywords = keywords[category];
  if (!categoryKeywords || categoryKeywords.length === 0) return false;
  return categoryKeywords.includes(word);
}

/**
 * Get topic-relevant words from a category, or fall back to full category.
 *
 * @param category - Word category
 * @param keywords - Extracted keywords map
 * @param allWords - Full word pool for the category
 * @returns Filtered words relevant to topic, or full pool if no matches
 */
export function getTopicRelevantWords(
  category: string,
  keywords: Record<string, string[]>,
  allWords: readonly string[]
): readonly string[] {
  const categoryKeywords = keywords[category];
  if (!categoryKeywords || categoryKeywords.length === 0) {
    return allWords;
  }

  // Filter to topic-relevant words
  const relevant = allWords.filter(word => categoryKeywords.includes(word));
  
  // Return relevant words if found, otherwise full pool
  return relevant.length > 0 ? relevant : allWords;
}
