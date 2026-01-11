/**
 * Deterministic remix operations for prompt manipulation.
 *
 * All functions in this module are fully deterministic - no LLM calls are made.
 * They handle instrument selection, genre changes, mood updates, style tags,
 * and recording descriptors using rule-based logic with controlled randomness.
 *
 * LLM-dependent operations (remixTitle, remixLyrics) remain in ai/remix.ts
 *
 * @module prompt/deterministic/remix-operations
 */

import {
  selectInstrumentsForGenre,
  GENRE_REGISTRY,
  MULTI_GENRE_COMBINATIONS,
  isMultiGenre,
} from '@bun/instruments';
import { MOOD_POOL } from '@bun/instruments/datasets';
import { getRandomProgressionForGenre } from '@bun/prompt/chord-progressions';
import { selectInstrumentsForMultiGenre } from '@bun/prompt/genre-parser';
import {
  replaceFieldLine,
  replaceStyleTagsLine,
  replaceRecordingLine,
} from '@bun/prompt/remix';
import {
  selectVocalTags,
  selectTextureTags,
  selectRecordingContext,
  selectRecordingDescriptors,
} from '@bun/prompt/tags';
import { getVocalSuggestionsForGenre } from '@bun/prompt/vocal-descriptors';
import { DEFAULT_GENRE } from '@shared/constants';

import type { RemixResult } from './types';
import type { GenreType } from '@bun/instruments';

// ============================================================================
// INTERNAL HELPERS (not exported)
// ============================================================================

/** Select a random item from array, with fallback */
function randomFrom<T>(arr: T[], fallback: T): T {
  if (arr.length === 0) return fallback;
  return arr[Math.floor(Math.random() * arr.length)] ?? fallback;
}

/** Select new single genre (handles both single and multi-genre current values) */
function selectSingleGenre(
  currentGenre: string,
  allSingleGenres: GenreType[]
): string | null {
  if (isMultiGenre(currentGenre)) {
    const available = MULTI_GENRE_COMBINATIONS.filter(g => g !== currentGenre);
    return randomFrom(available, currentGenre);
  }
  const available = allSingleGenres.filter(g => g !== currentGenre);
  if (available.length === 0) return null;
  return randomFrom(available, 'ambient');
}

/** Select multiple new genres */
function selectMultipleGenres(
  currentGenres: string[],
  count: number,
  allOptions: string[]
): string {
  const available = allOptions.filter(g => !currentGenres.includes(g.toLowerCase()));
  const shuffled = [...available].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count).join(', ');
}

/** Update BPM based on genre */
function updateBpmForNewGenre(prompt: string, newGenreValue: string): string {
  const firstGenre = newGenreValue.split(',')[0]?.trim().toLowerCase() || '';
  const baseGenre = firstGenre.split(' ')[0] || firstGenre;
  const genreDef = GENRE_REGISTRY[baseGenre as GenreType];
  if (genreDef?.bpm) {
    return replaceFieldLine(prompt, 'BPM', `${genreDef.bpm.typical}`);
  }
  return prompt;
}

// ============================================================================
// EXTRACTION FUNCTIONS
// ============================================================================

/**
 * Extract and validate the primary genre from prompt's genre field.
 *
 * Validates against GENRE_REGISTRY to ensure downstream functions
 * (instrument selection, BPM lookup) receive a known genre type.
 * Falls back to DEFAULT_GENRE ('pop') to guarantee remix operations
 * always have valid genre context - prevents silent failures.
 *
 * For multi-genre prompts, returns only the first genre since most
 * operations need a single primary genre for lookups.
 */
export function extractGenreFromPrompt(prompt: string): GenreType {
  const match = prompt.match(/^genre:\s*"?([^"\n,]+)/im);
  const extracted = match?.[1]?.trim().toLowerCase();
  if (!extracted) return DEFAULT_GENRE as GenreType;
  return extracted in GENRE_REGISTRY
    ? (extracted as GenreType)
    : (DEFAULT_GENRE as GenreType);
}

/**
 * Extract and validate all genres from prompt's genre field.
 *
 * Multi-genre support enables blended instrument selection - when a prompt
 * has "jazz, rock", we can pull instruments from both genre pools for
 * more creative combinations. Each genre is validated to ensure registry lookups work.
 *
 * Falls back to [DEFAULT_GENRE] to guarantee at least one valid genre,
 * preventing empty arrays that would break downstream selection logic.
 */
export function extractGenresFromPrompt(prompt: string): GenreType[] {
  const match = prompt.match(/^genre:\s*"?([^"\n]+?)(?:"|$)/im);
  if (!match?.[1]) return [DEFAULT_GENRE as GenreType];

  const genres = match[1]
    .split(',')
    .map(g => g.trim().toLowerCase())
    .filter((g): g is GenreType => g in GENRE_REGISTRY);

  return genres.length > 0 ? genres : [DEFAULT_GENRE as GenreType];
}

/**
 * Extract mood from prompt's mood field.
 *
 * Mood context influences style tag selection and can affect
 * instrument choices. Falls back to 'emotional' as a neutral default
 * that works across all genres without biasing the output.
 */
export function extractMoodFromPrompt(prompt: string): string {
  const match =
    prompt.match(/^mood:\s*"?([^"\n]+)/im) ||
    prompt.match(/^Mood:\s*([^\n]+)/im);
  return match?.[1]?.trim() || 'emotional';
}

// ============================================================================
// STYLE INJECTION
// ============================================================================

/**
 * Inject style tags appropriate for the given genre.
 *
 * Uses modern tag selection approach with vocal, texture, and recording context.
 * Provides better variety and consistency with main prompt generation.
 * Falls back to recording descriptors if no tags are selected.
 *
 * @since v2.0.0 - Updated to use new tag selection functions
 */
export function injectStyleTags(prompt: string, genre: string): string {
  const styleTags: string[] = [];

  // Use new tag selection (simplified for remix - no weighted probability)
  const vocalTags = selectVocalTags(genre, 1, Math.random);
  styleTags.push(...vocalTags);

  const textureTags = selectTextureTags(2, Math.random);
  styleTags.push(...textureTags);

  // Add recording context
  const context = selectRecordingContext(genre, Math.random);
  styleTags.push(context);

  // Fallback if no tags selected
  if (styleTags.length === 0) {
    const fallback = selectRecordingDescriptors(1, Math.random);
    styleTags.push(...fallback);
  }

  return replaceStyleTagsLine(prompt, styleTags.join(', '));
}

// ============================================================================
// CORE REMIX OPERATIONS
// ============================================================================

/**
 * Remix instruments in a prompt with new genre-appropriate instruments.
 *
 * This function is fully deterministic - no LLM calls are made.
 * Genres are extracted from the current prompt's genre field.
 * Supports multi-genre prompts - uses blended instrument selection when multiple genres.
 *
 * @param currentPrompt - The current prompt to modify
 * @param _originalInput - Kept for API compatibility, no longer used for genre detection
 * @returns Updated prompt with new instruments
 */
export function remixInstruments(
  currentPrompt: string,
  _originalInput: string
): RemixResult {
  const genres = extractGenresFromPrompt(currentPrompt);
  const primaryGenre = genres[0] ?? (DEFAULT_GENRE as GenreType);

  // 1. New instruments - blend from multiple genres when present
  const instruments =
    genres.length > 1
      ? selectInstrumentsForMultiGenre(genres, Math.random, 4)
      : selectInstrumentsForGenre(primaryGenre, { maxTags: 4 });

  // 2. New chord progression for primary genre
  const progression = getRandomProgressionForGenre(primaryGenre);
  const harmonyTag = `${progression.name} (${progression.pattern}) harmony`;

  // 3. New vocal style for primary genre
  const { range, delivery, technique } =
    getVocalSuggestionsForGenre(primaryGenre);
  const vocalTags = [
    `${range.toLowerCase()} vocals`,
    `${delivery.toLowerCase()} delivery`,
    technique.toLowerCase(),
  ];

  // 4. Combine all elements
  const combined = [...instruments, harmonyTag, ...vocalTags];

  return {
    text: replaceFieldLine(currentPrompt, 'Instruments', combined.join(', ')),
  };
}

/** Options for remixGenre operation */
export interface RemixGenreOptions {
  /**
   * Target number of genres in the output (1-4).
   *
   * WHY: Creative Boost mode allows users to select multiple seed genres
   * (e.g., 3 genres for a fusion). When remixing, we preserve this count
   * so users get fresh genre combinations without losing their preferred
   * fusion complexity. Without this, a 3-genre selection would randomly
   * become 1 genre after remix, frustrating users who intentionally chose
   * a multi-genre fusion.
   */
  targetGenreCount?: number;
}

/**
 * Remix genre in a prompt with a new genre.
 *
 * Preserves multi-genre structure (e.g., 2-genre → 2-genre) to maintain
 * the user's creative intent for fusion styles. BPM is auto-updated to
 * match the new genre's typical tempo, preventing tempo/genre mismatches
 * that could confuse Suno (e.g., 140 BPM with "jazz").
 *
 * @param currentPrompt - The current prompt to modify
 * @param options - Optional configuration including targetGenreCount
 * @returns Updated prompt with new genre(s)
 */
export function remixGenre(
  currentPrompt: string,
  options?: RemixGenreOptions
): RemixResult {
  const genreMatch = currentPrompt.match(/^genre:\s*"?([^"\n]+?)(?:"|$)/im);
  const fullGenreValue = genreMatch?.[1]?.trim() || '';
  const currentGenres = fullGenreValue
    .split(',')
    .map(g => g.trim().toLowerCase())
    .filter(Boolean);

  // Determine target count: use provided count, otherwise preserve current count
  // Clamp to valid range (1-4), default to 1 if 0 or undefined when no current genres
  const rawTargetCount = options?.targetGenreCount ?? currentGenres.length;
  const targetCount = Math.max(1, Math.min(4, rawTargetCount || 1));

  const allSingleGenres = Object.keys(GENRE_REGISTRY) as GenreType[];
  const allGenreOptions = [...allSingleGenres, ...MULTI_GENRE_COMBINATIONS];

  let newGenreValue: string;
  if (targetCount <= 1) {
    const selected = selectSingleGenre(currentGenres[0] || '', allSingleGenres);
    if (selected === null) return { text: currentPrompt };
    newGenreValue = selected;
  } else {
    newGenreValue = selectMultipleGenres(
      currentGenres,
      targetCount,
      allGenreOptions
    );
  }

  const result = replaceFieldLine(currentPrompt, 'Genre', newGenreValue);
  return { text: updateBpmForNewGenre(result, newGenreValue) };
}

/**
 * Generate a new mood selection.
 *
 * Returns both text (empty) and moodLine separately to allow callers
 * to either inject into a prompt or use the raw mood for other purposes
 * (e.g., passing to title generation). The 2-3 mood count creates variety
 * while avoiding overly complex mood combinations.
 */
export function remixMood(): RemixResult & { moodLine: string } {
  const count = Math.random() < 0.5 ? 2 : 3;
  const shuffled = [...MOOD_POOL].sort(() => Math.random() - 0.5);
  const selectedMoods = shuffled.slice(0, count);
  const moodLine = selectedMoods.join(', ');
  return { text: '', moodLine };
}

/**
 * Remix mood in a prompt with a new mood combination.
 *
 * Convenience wrapper that combines remixMood() generation with
 * prompt injection in a single call for the common use case.
 */
export function remixMoodInPrompt(currentPrompt: string): RemixResult {
  const { moodLine } = remixMood();
  return { text: replaceFieldLine(currentPrompt, 'Mood', moodLine) };
}

/**
 * Remix style tags in a prompt with new genre-appropriate tags.
 *
 * Extracts genre first to ensure style tags match the current genre,
 * preventing mismatches like electronic tags on an acoustic jazz prompt.
 */
export function remixStyleTags(currentPrompt: string): RemixResult {
  const genre = extractGenreFromPrompt(currentPrompt);
  return { text: injectStyleTags(currentPrompt, genre) };
}

/**
 * Remix recording descriptors in a prompt.
 *
 * Recording descriptors add production context (studio type, mic placement, etc.)
 * that helps Suno understand the desired sonic character independent of genre.
 */
export function remixRecording(currentPrompt: string): RemixResult {
  const descriptors = selectRecordingDescriptors(3);
  return { text: replaceRecordingLine(currentPrompt, descriptors.join(', ')) };
}
