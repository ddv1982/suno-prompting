/**
 * Quick Vibes Types
 *
 * Type definitions for Quick Vibes templates.
 *
 * @module prompt/quick-vibes/types
 */

import type { MoodCategory } from '@bun/mood';
import type { TraceCollector } from '@bun/trace';
import type { QuickVibesCategory } from '@shared/types';

export interface QuickVibesTemplate {
  /** Genre options for this category */
  genres: readonly string[];
  /** Instrument combination options */
  instruments: readonly (readonly string[])[];
  /** Mood options */
  moods: readonly string[];
  /** Title word pools by position */
  titleWords: {
    adjectives: readonly string[];
    nouns: readonly string[];
    contexts: readonly string[];
  };
}

export interface BuildQuickVibesOptions {
  /** Whether to include wordless vocals in instruments */
  withWordlessVocals: boolean;
  /** Whether to use MAX mode format (quoted fields) or standard */
  maxMode: boolean;
  /** Optional mood category to override template moods */
  moodCategory?: MoodCategory;
  /** Random number generator for deterministic testing (defaults to Math.random) */
  rng?: () => number;
  /** Optional trace collector for debug mode */
  trace?: TraceCollector;
}

export type { MoodCategory, QuickVibesCategory };
