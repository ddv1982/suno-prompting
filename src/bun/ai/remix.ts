/**
 * LLM-based Remix Operations
 *
 * This module contains remix operations that require LLM calls:
 * - remixTitle: Generate a new song title using AI
 * - remixLyrics: Generate new lyrics using AI
 *
 * For deterministic remix operations (instruments, genre, mood, style tags, recording),
 * see @bun/prompt/deterministic which handles those without LLM calls.
 *
 * @module ai/remix
 */

import { type LanguageModel } from 'ai';

import { generateTitle, generateLyrics } from '@bun/ai/content-generator';
import {
  extractGenreFromPrompt,
  extractMoodFromPrompt,
} from '@bun/prompt/deterministic';

/**
 * Generate a new song title using AI based on prompt context.
 *
 * @param currentPrompt - The current prompt to extract genre/mood from
 * @param originalInput - The original user input for context
 * @param getModel - Function to get the language model
 * @returns Generated title
 */
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

/**
 * Generate new lyrics using AI based on prompt context.
 *
 * @param currentPrompt - The current prompt to extract genre/mood from
 * @param originalInput - The original user input for context
 * @param lyricsTopic - Optional specific topic for lyrics
 * @param maxMode - Whether to use max mode for lyrics generation
 * @param getModel - Function to get the language model
 * @param useSunoTags - Whether to include Suno-specific tags in lyrics
 * @returns Generated lyrics
 */
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
  const result = await generateLyrics(
    topicForLyrics,
    genre,
    mood,
    maxMode,
    getModel,
    useSunoTags
  );
  return { lyrics: result.lyrics };
}
