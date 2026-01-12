/**
 * Compound Moods
 *
 * Pre-defined compound mood combinations that blend contrasting
 * or complementary emotional qualities for richer prompts.
 *
 * @module mood/compound
 */

/**
 * Pre-defined compound mood combinations.
 *
 * Each combines two emotional qualities:
 * - Contrasting emotions (bittersweet nostalgia, dark euphoria)
 * - Complex emotional states (melancholic triumph)
 * - Atmospheric combinations (ethereal darkness)
 * - Textural emotions (rough tenderness)
 */
export const COMPOUND_MOODS = [
  // Contrasting emotions
  'bittersweet nostalgia',
  'dark euphoria',
  'aggressive hope',
  'tender melancholy',
  'chaotic joy',
  'peaceful intensity',
  'wistful optimism',
  'haunting beauty',
  'fierce tenderness',
  'quiet desperation',
  // Complex emotional states
  'melancholic triumph',
  'restless serenity',
  'gentle fury',
  'luminous grief',
  'defiant vulnerability',
  // Atmospheric combinations
  'ethereal darkness',
  'warm desolation',
  'bright sorrow',
  'somber celebration',
  'anxious bliss',
  // Textural emotions
  'rough tenderness',
  'sharp comfort',
  'soft rage',
  'delicate power',
  'raw elegance',
] as const;

/**
 * Type representing a valid compound mood.
 */
export type CompoundMood = (typeof COMPOUND_MOODS)[number];
