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
import { detectAllGenres } from '@bun/prompt/deterministic/genre';
import { generateDeterministicTitle } from '@bun/prompt/title';

import { injectWordlessVocals } from './vocals';

import type { TraceCollector } from '@bun/trace';
import type { LanguageModel } from 'ai';

const log = createLogger('CreativeBoostHelpers');

type TraceRuntime = {
  readonly trace?: TraceCollector;
  readonly rng?: () => number;
};

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
 * 
 * Priority order:
 * 1. Seed genres (explicit user selection)
 * 2. Description-based detection (keywords in user's description)
 * 3. Lyrics topic detection via LLM (only when lyrics mode is ON)
 * 4. Empty array (let creativity level decide)
 */
export async function resolveGenreForCreativeBoost(
  seedGenres: string[],
  lyricsTopic: string | undefined,
  withLyrics: boolean,
  getModel: () => LanguageModel,
  ollamaEndpoint?: string,
  runtime?: TraceRuntime,
  description?: string
): Promise<{ genres: string[]; debugInfo?: GenreDetectionDebugInfo }> {
  // Priority 1: If we have seed genres, use them
  if (seedGenres.length > 0) {
    log.info('resolveGenreForCreativeBoost:seedGenres', { genres: seedGenres });
    return { genres: seedGenres };
  }

  // Priority 2: Detect genre from description using keyword matching (no LLM needed)
  if (description?.trim()) {
    const detectedFromDescription = detectAllGenres(description);
    if (detectedFromDescription.length > 0) {
      log.info('resolveGenreForCreativeBoost:fromDescription', { 
        description: description.substring(0, 50), 
        genres: detectedFromDescription 
      });
      return { genres: detectedFromDescription };
    }
  }

  // Priority 3: Detect genre from lyrics topic if lyrics mode is ON and topic provided
  if (withLyrics && lyricsTopic?.trim()) {
    const result = await detectGenreFromTopic(lyricsTopic.trim(), getModel, undefined, ollamaEndpoint, {
      trace: runtime?.trace,
      traceLabel: 'genre.detectFromTopic',
    });
    log.info('resolveGenreForCreativeBoost:fromTopic', { topic: lyricsTopic, genre: result.genre });
    return {
      genres: [result.genre],
      debugInfo: result.debugInfo,
    };
  }

  // Priority 4: No genre detected - creativity level will decide
  log.info('resolveGenreForCreativeBoost:none', { withLyrics, hasDescription: !!description });
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
  withWordlessVocals: boolean,
  runtime?: TraceRuntime
): string {
  const rng = runtime?.rng ?? Math.random;
  const trace = runtime?.trace;
  const result = maxMode
    ? buildDeterministicMaxPrompt({ description: genre, genreOverride: genre, rng, trace })
    : buildDeterministicStandardPrompt({ description: genre, genreOverride: genre, rng, trace });

  let styleResult = result.text;

  if (withWordlessVocals) {
    styleResult = injectWordlessVocals(styleResult);
  }

  return styleResult;
}

/**
 * Generate title for creative boost.
 * Uses LLM when lyrics are enabled OR when LLM is available (for more creative titles);
 * otherwise generates deterministically.
 */
export async function generateCreativeBoostTitle(
  withLyrics: boolean,
  lyricsTopic: string | undefined,
  description: string | undefined,
  genre: string,
  mood: string,
  getModel: () => LanguageModel,
  ollamaEndpoint?: string,
  runtime?: TraceRuntime,
  isLLMAvailable?: boolean
): Promise<{ title: string; debugInfo?: GenerationDebugInfo }> {
  // Use LLM for title when lyrics are enabled OR when LLM is available
  if (withLyrics || isLLMAvailable) {
    const topic = lyricsTopic?.trim() || description?.trim() || DEFAULT_LYRICS_TOPIC;
    const result = await generateTitle({
      description: topic,
      genre,
      mood,
      getModel,
      ollamaEndpoint,
      trace: runtime?.trace,
      traceLabel: 'title.generate',
    });
    return { title: result.title, debugInfo: result.debugInfo };
  }

  // Use description for topic-aware deterministic title generation
  const topicDescription = description?.trim();
  return { title: generateDeterministicTitle(genre, mood, runtime?.rng ?? Math.random, topicDescription) };
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
  ollamaEndpoint?: string,
  runtime?: TraceRuntime
): Promise<{ lyrics?: string; debugInfo?: GenerationDebugInfo }> {
  if (!withLyrics) {
    return {};
  }

  const topic = lyricsTopic?.trim() || description?.trim() || DEFAULT_LYRICS_TOPIC;
  const result = await generateLyrics(topic, genre, mood, maxMode, getModel, useSunoTags, undefined, ollamaEndpoint, {
    trace: runtime?.trace,
    traceLabel: 'lyrics.generate',
  });

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
  ollamaEndpoint?: string,
  runtime?: TraceRuntime
): Promise<{ lyrics: string | undefined; debugInfo?: { systemPrompt: string; userPrompt: string } }> {
  if (!withLyrics) return { lyrics: undefined };

  const genre = extractGenreFromPrompt(styleResult);
  const mood = extractMoodFromPrompt(styleResult);
  const topicForLyrics = lyricsTopic?.trim() || description?.trim() || DEFAULT_LYRICS_TOPIC;
  const result = await generateLyrics(topicForLyrics, genre, mood, maxMode, getModel, useSunoTags, undefined, ollamaEndpoint, {
    trace: runtime?.trace,
    traceLabel: 'lyrics.generate',
  });

  return {
    lyrics: result.lyrics,
    debugInfo: result.debugInfo,
  };
}
