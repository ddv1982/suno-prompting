/**
 * Compound Mood Selection Service
 *
 * Functions for selecting compound moods based on genre context.
 * Provides genre-appropriate mood combinations with random fallback.
 *
 * @module mood/services/compound
 */

import { COMPOUND_MOODS } from '@bun/mood/compound';

import type { CompoundMood } from '@bun/mood/compound';

/**
 * Genre-to-compound-mood affinity mapping.
 *
 * Maps genres to compound moods that particularly suit their aesthetic.
 * Genres not listed fall back to random selection from all compound moods.
 */
const GENRE_MOOD_AFFINITIES: Record<string, readonly CompoundMood[]> = {
  // Electronic genres
  electronic: ['dark euphoria', 'chaotic joy', 'anxious bliss'],
  dubstep: ['dark euphoria', 'fierce tenderness', 'aggressive hope'],
  drumandbass: ['chaotic joy', 'restless serenity', 'fierce tenderness'],
  techno: ['dark euphoria', 'peaceful intensity', 'restless serenity'],
  house: ['bright sorrow', 'warm desolation', 'gentle fury'],
  trance: ['ethereal darkness', 'luminous grief', 'peaceful intensity'],

  // Jazz & Soul
  jazz: ['bittersweet nostalgia', 'raw elegance', 'wistful optimism'],
  soul: ['tender melancholy', 'raw elegance', 'warm desolation'],
  blues: ['quiet desperation', 'rough tenderness', 'bittersweet nostalgia'],

  // Rock & Alternative
  rock: ['aggressive hope', 'defiant vulnerability', 'fierce tenderness'],
  metal: ['fierce tenderness', 'gentle fury', 'luminous grief'],
  punk: ['aggressive hope', 'defiant vulnerability', 'chaotic joy'],
  shoegaze: ['ethereal darkness', 'soft rage', 'haunting beauty'],
  grunge: ['quiet desperation', 'rough tenderness', 'defiant vulnerability'],
  postpunk: ['ethereal darkness', 'quiet desperation', 'soft rage'],
  emo: ['tender melancholy', 'defiant vulnerability', 'raw elegance'],

  // Ambient & Atmospheric
  ambient: ['peaceful intensity', 'ethereal darkness', 'luminous grief'],
  dreampop: ['haunting beauty', 'soft rage', 'wistful optimism'],
  newage: ['peaceful intensity', 'sharp comfort', 'delicate power'],

  // World & Folk
  celtic: ['bittersweet nostalgia', 'fierce tenderness', 'wistful optimism'],
  folk: ['tender melancholy', 'bittersweet nostalgia', 'quiet desperation'],
  bossanova: ['wistful optimism', 'warm desolation', 'tender melancholy'],

  // Hip Hop & R&B
  hiphop: ['aggressive hope', 'defiant vulnerability', 'raw elegance'],
  rnb: ['tender melancholy', 'warm desolation', 'delicate power'],
  trap: ['dark euphoria', 'aggressive hope', 'anxious bliss'],

  // Pop & Dance
  pop: ['bright sorrow', 'anxious bliss', 'wistful optimism'],
  disco: ['chaotic joy', 'bright sorrow', 'somber celebration'],
  synthwave: ['bittersweet nostalgia', 'dark euphoria', 'haunting beauty'],

  // Classical & Cinematic
  classical: ['luminous grief', 'delicate power', 'somber celebration'],
  cinematic: ['melancholic triumph', 'haunting beauty', 'ethereal darkness'],
  orchestral: ['melancholic triumph', 'delicate power', 'fierce tenderness'],
} as const;

/**
 * Select a compound mood appropriate for a genre context.
 *
 * If the genre has defined affinities, preferentially selects from those.
 * Otherwise falls back to random selection from all compound moods.
 *
 * @param genre - Primary genre for context
 * @param rng - Random number generator (defaults to Math.random)
 * @returns Selected compound mood string
 *
 * @example
 * selectCompoundMood('jazz');
 * // 'bittersweet nostalgia' or 'raw elegance' or 'wistful optimism'
 *
 * @example
 * selectCompoundMood('unknown-genre');
 * // Random selection from all compound moods
 */
export function selectCompoundMood(
  genre: string,
  rng: () => number = Math.random,
): CompoundMood {
  const normalizedGenre = genre.toLowerCase().replace(/[^a-z]/g, '');

  // Check for genre-specific affinities
  const affinities = GENRE_MOOD_AFFINITIES[normalizedGenre];
  const pool: readonly CompoundMood[] = affinities?.length ? affinities : COMPOUND_MOODS;

  // Select random mood from pool
  const index = Math.floor(rng() * pool.length);
  return pool[index] ?? COMPOUND_MOODS[0];
}

/**
 * Get all compound moods with affinity for a genre.
 *
 * @param genre - Genre to look up
 * @returns Array of compound moods with affinity, or empty array if none
 */
export function getCompoundMoodsForGenre(genre: string): readonly CompoundMood[] {
  const normalizedGenre = genre.toLowerCase().replace(/[^a-z]/g, '');
  return GENRE_MOOD_AFFINITIES[normalizedGenre] ?? [];
}
