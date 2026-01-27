/**
 * Creative Boost Types
 *
 * Type definitions for creative boost templates.
 *
 * @module prompt/creative-boost/types
 */

import type { MoodCategory } from '@bun/mood';
import type { CreativityLevel } from '@shared/types';

export interface CreativityPool {
  /** Genre options appropriate for this creativity level */
  genres: readonly string[];
  /** Whether to allow blending multiple genres */
  allowBlending: boolean;
  /** Maximum number of genres to blend */
  maxGenres: number;
}

export interface BuildCreativeBoostOptions {
  /** Creativity level (0-100, mapped to CreativityLevel) */
  creativityLevel: number;
  /** User-provided seed genres */
  seedGenres: string[];
  /** Use MAX mode format */
  maxMode: boolean;
  /** Optional mood category to override mood selection */
  moodCategory?: MoodCategory;
  /** Random number generator (defaults to Math.random) */
  rng?: () => number;
}

export type { CreativityLevel, MoodCategory };
