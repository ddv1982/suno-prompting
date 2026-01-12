/**
 * Creative Boost Content Generation
 *
 * Genre resolution, style building, title and lyrics generation.
 *
 * @module ai/creative-boost/helpers/content
 */

import { generateLyrics, generateTitle, detectGenreFromTopic } from '@bun/ai/content-generator';
import { createLogger } from '@bun/logger';
import { buildDeterministicMaxPrompt, buildDeterministicStandardPrompt, extractGenreFromPrompt, extractMoodFromPrompt } from '@bun/prompt/deterministic';
import { generateDeterministicTitle } from '@bun/prompt/title';

import { injectWordlessVocals } from './vocals';

import type { LanguageModel } from 'ai';

const log = createLogger('CreativeBoostHelpers');

/**
 * Default fallback topic when no lyrics topic or description is provided.
 * "Creative expression" is intentionally generic to give the LLM freedom
 * to generate thematically open lyrics.
 */
export const DEFAULT_LYRICS_TOPIC = 'creative expression';

/**
 * Debug info for genre detection.
 */
export type GenreDetectionDebugInfo = {
  systemPrompt: string;
  userPrompt: string;
  detectedGenre: string;
};

/**
 * Debug info for title/lyrics generation.
 */
export type GenerationDebugInfo = {
  systemPrompt: string;
  userPrompt: string;
};

/**
 * Resolve genre for creative boost.
 * Uses seed genres when available to avoid LLM calls; falls back to
 * topic-based detection only when necessary for lyrics generation.
 */
export async function resolveGenreForCreativeBoost(
  seedGenres: string[],
  lyricsTopic: string | undefined,
  withLyrics: boolean,
  getModel: () => LanguageModel,
  ollamaEndpoint?: string
): Promise<{ genres: string[]; debugInfo?: GenreDetectionDebugInfo }> {
  // If we have seed genres, use them
  if (seedGenres.length > 0) {
    return { genres: seedGenres };
  }

  // Detect genre from lyrics topic if lyrics mode is ON and topic provided
  if (withLyrics && lyricsTopic?.trim()) {
    const result = await detectGenreFromTopic(lyricsTopic.trim(), getModel, undefined, ollamaEndpoint);
    log.info('resolveGenreForCreativeBoost:detected', { topic: lyricsTopic, genre: result.genre });
    return {
      genres: [result.genre],
      debugInfo: result.debugInfo,
    };
  }

  return { genres: [] };
}

/**
 * Build style prompt using deterministic builders.
 * Avoids LLM calls entirely - uses genre registry and curated instrument pools
 * to produce consistent, high-quality prompts without network latency.
 */
export function buildCreativeBoostStyle(
  genre: string,
  maxMode: boolean,
  withWordlessVocals: boolean
): string {
  const result = maxMode
    ? buildDeterministicMaxPrompt({ description: genre, genreOverride: genre })
    : buildDeterministicStandardPrompt({ description: genre, genreOverride: genre });

  let styleResult = result.text;

  if (withWordlessVocals) {
    styleResult = injectWordlessVocals(styleResult);
  }

  return styleResult;
}

/**
 * Generate title for creative boost.
 * Uses LLM only when lyrics are enabled (title should match lyrical theme);
 * otherwise generates deterministically to minimize latency.
 */
export async function generateCreativeBoostTitle(
  withLyrics: boolean,
  lyricsTopic: string | undefined,
  description: string | undefined,
  genre: string,
  mood: string,
  getModel: () => LanguageModel,
  ollamaEndpoint?: string
): Promise<{ title: string; debugInfo?: GenerationDebugInfo }> {
  if (withLyrics) {
    const topic = lyricsTopic?.trim() || description?.trim() || DEFAULT_LYRICS_TOPIC;
    const result = await generateTitle(topic, genre, mood, getModel, undefined, ollamaEndpoint);
    return { title: result.title, debugInfo: result.debugInfo };
  }

  // Use description for topic-aware deterministic title generation
  const topicDescription = description?.trim();
  return { title: generateDeterministicTitle(genre, mood, Math.random, topicDescription) };
}

/**
 * Generate lyrics for creative boost when lyrics mode is enabled.
 * Early-exits when lyrics disabled to avoid unnecessary LLM calls.
 */
export async function generateCreativeBoostLyrics(
  withLyrics: boolean,
  lyricsTopic: string | undefined,
  description: string | undefined,
  genre: string,
  mood: string,
  maxMode: boolean,
  getModel: () => LanguageModel,
  useSunoTags: boolean,
  ollamaEndpoint?: string
): Promise<{ lyrics?: string; debugInfo?: GenerationDebugInfo }> {
  if (!withLyrics) {
    return {};
  }

  const topic = lyricsTopic?.trim() || description?.trim() || DEFAULT_LYRICS_TOPIC;
  const result = await generateLyrics(topic, genre, mood, maxMode, getModel, useSunoTags, undefined, ollamaEndpoint);

  return { lyrics: result.lyrics, debugInfo: result.debugInfo };
}

/**
 * Generates lyrics for creative boost prompts.
 */
export async function generateLyricsForCreativeBoost(
  styleResult: string,
  lyricsTopic: string,
  description: string,
  maxMode: boolean,
  withLyrics: boolean,
  getModel: () => LanguageModel,
  useSunoTags: boolean,
  ollamaEndpoint?: string
): Promise<{ lyrics: string | undefined; debugInfo?: { systemPrompt: string; userPrompt: string } }> {
  if (!withLyrics) return { lyrics: undefined };

  const genre = extractGenreFromPrompt(styleResult);
  const mood = extractMoodFromPrompt(styleResult);
  const topicForLyrics = lyricsTopic?.trim() || description?.trim() || DEFAULT_LYRICS_TOPIC;
  const result = await generateLyrics(topicForLyrics, genre, mood, maxMode, getModel, useSunoTags, undefined, ollamaEndpoint);

  return {
    lyrics: result.lyrics,
    debugInfo: result.debugInfo,
  };
}
