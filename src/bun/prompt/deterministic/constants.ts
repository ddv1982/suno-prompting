/**
 * Constants for deterministic prompt generation.
 *
 * @module prompt/deterministic/constants
 */

import { GENRE_REGISTRY } from '@bun/instruments';
import { APP_CONSTANTS } from '@shared/constants';

import type { GenreType } from '@bun/instruments/genres';

/** All genre keys for random selection */
export const ALL_GENRE_KEYS = Object.keys(GENRE_REGISTRY) as GenreType[];

/** Maximum character limit for prompts */
export const MAX_CHARS = APP_CONSTANTS.MAX_PROMPT_CHARS;

/** Fallback BPM range when genre has no defined BPM */
export const DEFAULT_BPM_RANGE = 'between 90 and 140';

/** Musical keys for STANDARD MODE */
export const MUSICAL_KEYS: readonly string[] = [
  'C',
  'C#',
  'D',
  'D#',
  'E',
  'F',
  'F#',
  'G',
  'G#',
  'A',
  'A#',
  'B',
];

/** Musical modes for STANDARD MODE */
export const MUSICAL_MODES: readonly string[] = [
  'major',
  'minor',
  'dorian',
  'mixolydian',
  'lydian',
  'phrygian',
];
