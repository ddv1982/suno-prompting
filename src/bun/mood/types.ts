/**
 * Mood Category Types
 *
 * Type definitions for the mood category system that enables
 * user-controlled mood influence on prompt generation.
 *
 * @module mood/types
 */

/**
 * Intensity level for moods.
 * Controls the strength/expressiveness of the mood.
 */
export type MoodIntensity = 'mild' | 'moderate' | 'intense';

/**
 * Mood with intensity scaling applied.
 * Combines base category, selected mood word, and intensity level.
 */
export interface IntensifiedMood {
  /** Base mood category */
  readonly category: MoodCategory;
  /** Selected mood word (with intensity applied) */
  readonly mood: string;
  /** Intensity level applied */
  readonly intensity: MoodIntensity;
}

/**
 * Mood category identifiers.
 * Derived from semantic groupings in MOOD_POOL comments.
 */
export type MoodCategory =
  | 'energetic'
  | 'calm'
  | 'dark'
  | 'emotional'
  | 'playful'
  | 'intense'
  | 'atmospheric'
  | 'seasonal'
  | 'social'
  | 'sophisticated'
  | 'gritty'
  | 'epic'
  | 'vulnerable'
  | 'tense'
  | 'groove'
  | 'spiritual'
  | 'eclectic'
  | 'attitude'
  | 'texture'
  | 'movement';

/**
 * Definition of a mood category including its moods and genre mappings.
 */
export interface MoodCategoryDefinition {
  /** Display name for UI (e.g., "Energetic") */
  readonly name: string;

  /** Individual moods belonging to this category */
  readonly moods: readonly string[];

  /** Compatible genres derived from genre.moods arrays */
  compatibleGenres: readonly string[];
}

/**
 * Registry of all mood categories.
 */
export type MoodCategoryRegistry = Record<MoodCategory, MoodCategoryDefinition>;

/**
 * Combobox option format for UI.
 */
export interface MoodCategoryOption {
  readonly value: MoodCategory | '';
  readonly label: string;
}
