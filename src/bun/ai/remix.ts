import { type LanguageModel } from 'ai';
import {
  selectInstrumentsForGenre,
  GENRE_REGISTRY,
  MULTI_GENRE_COMBINATIONS,
  isMultiGenre,
} from '@bun/instruments';
import { MOOD_POOL } from '@bun/instruments/datasets';
import type { GenreType } from '@bun/instruments';
import { selectModes } from '@bun/instruments/selection';
import { replaceFieldLine, replaceStyleTagsLine, replaceRecordingLine } from '@bun/prompt/remix';
import { selectRealismTags, selectElectronicTags, isElectronicGenre, selectRecordingDescriptors, selectGenericTags } from '@bun/prompt/realism-tags';
import { generateTitle, generateLyrics } from '@bun/ai/content-generator';

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

export async function remixInstruments(
  currentPrompt: string,
  originalInput: string,
  getModel: () => LanguageModel
): Promise<RemixResult> {
  const selection = await selectModes(originalInput, getModel());
  const genre = selection.genre || 'ambient';
  const instruments = selectInstrumentsForGenre(genre, { maxTags: 4 });
  return { text: replaceFieldLine(currentPrompt, 'Instruments', instruments.join(', ')) };
}

export function remixGenre(currentPrompt: string): RemixResult {
  const genreMatch = currentPrompt.match(/^genre:\s*"?([^"\n]+?)(?:"|$)/mi);
  const fullGenreValue = genreMatch?.[1]?.trim() || '';

  const currentGenres = fullGenreValue.split(',').map(g => g.trim().toLowerCase()).filter(Boolean);
  const genreCount = currentGenres.length;

  const allSingleGenres = Object.keys(GENRE_REGISTRY) as GenreType[];
  const allGenreOptions = [...allSingleGenres, ...MULTI_GENRE_COMBINATIONS];

  let newGenreValue: string;

  if (genreCount <= 1) {
    const singleGenre = currentGenres[0] || '';

    if (isMultiGenre(singleGenre)) {
      const available = MULTI_GENRE_COMBINATIONS.filter(g => g !== singleGenre);
      newGenreValue = available[Math.floor(Math.random() * available.length)]!;
    } else {
      const availableGenres = allSingleGenres.filter(g => g !== singleGenre);
      if (availableGenres.length === 0) return { text: currentPrompt };
      newGenreValue = availableGenres[Math.floor(Math.random() * availableGenres.length)]!;
    }
  } else {
    const availableGenres = allGenreOptions.filter(g => !currentGenres.includes(g.toLowerCase()));
    const shuffled = [...availableGenres].sort(() => Math.random() - 0.5);
    const selectedGenres = shuffled.slice(0, genreCount);
    newGenreValue = selectedGenres.join(', ');
  }

  let result = replaceFieldLine(currentPrompt, 'Genre', newGenreValue);

  const firstGenre = newGenreValue.split(',')[0]?.trim().toLowerCase() || '';
  const baseGenre = firstGenre.split(' ')[0] || firstGenre;
  const genreDef = GENRE_REGISTRY[baseGenre as GenreType];
  if (genreDef?.bpm) {
    result = replaceFieldLine(result, 'BPM', `${genreDef.bpm.typical}`);
  }

  return { text: result };
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
  getModel: () => LanguageModel
): Promise<{ lyrics: string }> {
  const genre = extractGenreFromPrompt(currentPrompt);
  const mood = extractMoodFromPrompt(currentPrompt);
  const topicForLyrics = lyricsTopic?.trim() || originalInput;
  const result = await generateLyrics(topicForLyrics, genre, mood, maxMode, getModel);
  return { lyrics: result.lyrics };
}
