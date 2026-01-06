import { type LanguageModel } from 'ai';

import { generateTitle, generateLyrics } from '@bun/ai/content-generator';
import {
  selectInstrumentsForGenre,
  GENRE_REGISTRY,
  MULTI_GENRE_COMBINATIONS,
  isMultiGenre,
} from '@bun/instruments';
import { MOOD_POOL } from '@bun/instruments/datasets';
import { getRandomProgressionForGenre } from '@bun/prompt/chord-progressions';
import { selectRealismTags, selectElectronicTags, isElectronicGenre, selectRecordingDescriptors, selectGenericTags } from '@bun/prompt/realism-tags';
import { replaceFieldLine, replaceStyleTagsLine, replaceRecordingLine } from '@bun/prompt/remix';
import { getVocalSuggestionsForGenre } from '@bun/prompt/vocal-descriptors';

import type { GenreType } from '@bun/instruments';

export type RemixResult = {
  text: string;
};

export function extractGenreFromPrompt(prompt: string): string {
  const match = prompt.match(/^genre:\s*"?([^"\n,]+)/mi);
  return match?.[1]?.trim().toLowerCase() || 'acoustic';
}

export function extractMoodFromPrompt(prompt: string): string {
  const match = prompt.match(/^mood:\s*"?([^"\n]+)/mi) || prompt.match(/^Mood:\s*([^\n]+)/mi);
  return match?.[1]?.trim() || 'emotional';
}

export function injectStyleTags(prompt: string, genre: string): string {
  const isElectronic = isElectronicGenre(genre);
  let styleTags = isElectronic
    ? selectElectronicTags(4)
    : selectRealismTags(genre, 4);

  if (styleTags.length === 0) {
    styleTags = selectGenericTags(4);
  }

  return replaceStyleTagsLine(prompt, styleTags.join(', '));
}

/**
 * Remix instruments in a prompt with new genre-appropriate instruments.
 *
 * This function is fully deterministic - no LLM calls are made.
 * Genre is extracted from the current prompt's genre field for reliability.
 * This aligns with how other remix functions work (remixStyleTags, remixRecording, etc.)
 * and ensures consistent behavior even when originalInput is empty or doesn't contain
 * genre keywords.
 *
 * @param currentPrompt - The current prompt to modify
 * @param _originalInput - Kept for API compatibility, no longer used for genre detection
 * @returns Updated prompt with new instruments
 */
export function remixInstruments(
  currentPrompt: string,
  _originalInput: string
): RemixResult {
  // Extract genre from prompt (like other remix functions)
  // This is more reliable than keyword detection on originalInput
  // Cast to GenreType since extractGenreFromPrompt returns 'acoustic' as fallback
  const genre = extractGenreFromPrompt(currentPrompt) as GenreType;

  // 1. New instruments
  const instruments = selectInstrumentsForGenre(genre, { maxTags: 4 });

  // 2. New chord progression for this genre
  const progression = getRandomProgressionForGenre(genre);
  const harmonyTag = `${progression.name} (${progression.pattern}) harmony`;

  // 3. New vocal style for this genre
  const { range, delivery, technique } = getVocalSuggestionsForGenre(genre);
  const vocalTags = [
    `${range.toLowerCase()} vocals`,
    `${delivery.toLowerCase()} delivery`,
    technique.toLowerCase(),
  ];

  // 4. Combine all elements
  const combined = [...instruments, harmonyTag, ...vocalTags];

  return { text: replaceFieldLine(currentPrompt, 'Instruments', combined.join(', ')) };
}

/** Select a random item from array, with fallback */
function randomFrom<T>(arr: T[], fallback: T): T {
  if (arr.length === 0) return fallback;
  return arr[Math.floor(Math.random() * arr.length)] ?? fallback;
}

/** Select new single genre (handles both single and multi-genre current values) */
function selectSingleGenre(currentGenre: string, allSingleGenres: GenreType[]): string | null {
  if (isMultiGenre(currentGenre)) {
    const available = MULTI_GENRE_COMBINATIONS.filter(g => g !== currentGenre);
    return randomFrom(available, currentGenre);
  }
  const available = allSingleGenres.filter(g => g !== currentGenre);
  if (available.length === 0) return null;
  return randomFrom(available, 'ambient');
}

/** Select multiple new genres */
function selectMultipleGenres(currentGenres: string[], count: number, allOptions: string[]): string {
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

export function remixGenre(currentPrompt: string): RemixResult {
  const genreMatch = currentPrompt.match(/^genre:\s*"?([^"\n]+?)(?:"|$)/mi);
  const fullGenreValue = genreMatch?.[1]?.trim() || '';
  const currentGenres = fullGenreValue.split(',').map(g => g.trim().toLowerCase()).filter(Boolean);

  const allSingleGenres = Object.keys(GENRE_REGISTRY) as GenreType[];
  const allGenreOptions = [...allSingleGenres, ...MULTI_GENRE_COMBINATIONS];

  let newGenreValue: string;
  if (currentGenres.length <= 1) {
    const selected = selectSingleGenre(currentGenres[0] || '', allSingleGenres);
    if (selected === null) return { text: currentPrompt };
    newGenreValue = selected;
  } else {
    newGenreValue = selectMultipleGenres(currentGenres, currentGenres.length, allGenreOptions);
  }

  const result = replaceFieldLine(currentPrompt, 'Genre', newGenreValue);
  return { text: updateBpmForNewGenre(result, newGenreValue) };
}

export function remixMood(): RemixResult & { moodLine: string } {
  const count = Math.random() < 0.5 ? 2 : 3;
  const shuffled = [...MOOD_POOL].sort(() => Math.random() - 0.5);
  const selectedMoods = shuffled.slice(0, count);
  const moodLine = selectedMoods.join(', ');
  return { text: '', moodLine };
}

export function remixMoodInPrompt(currentPrompt: string): RemixResult {
  const { moodLine } = remixMood();
  return { text: replaceFieldLine(currentPrompt, 'Mood', moodLine) };
}

export function remixStyleTags(currentPrompt: string): RemixResult {
  const genre = extractGenreFromPrompt(currentPrompt);
  return { text: injectStyleTags(currentPrompt, genre) };
}

export function remixRecording(currentPrompt: string): RemixResult {
  const descriptors = selectRecordingDescriptors(3);
  return { text: replaceRecordingLine(currentPrompt, descriptors.join(', ')) };
}

export async function remixTitle(
  currentPrompt: string,
  originalInput: string,
  getModel: () => LanguageModel
): Promise<{ title: string }> {
  const genre = extractGenreFromPrompt(currentPrompt);
  const mood = extractMoodFromPrompt(currentPrompt);
  const result = await generateTitle(originalInput, genre, mood, getModel);
  return { title: result.title };
}

export async function remixLyrics(
  currentPrompt: string,
  originalInput: string,
  lyricsTopic: string | undefined,
  maxMode: boolean,
  getModel: () => LanguageModel,
  useSunoTags: boolean = false
): Promise<{ lyrics: string }> {
  const genre = extractGenreFromPrompt(currentPrompt);
  const mood = extractMoodFromPrompt(currentPrompt);
  const topicForLyrics = lyricsTopic?.trim() || originalInput;
  const result = await generateLyrics(topicForLyrics, genre, mood, maxMode, getModel, useSunoTags);
  return { lyrics: result.lyrics };
}
