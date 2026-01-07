/**
 * Helper utilities for Creative Boost Engine
 *
 * Contains conversion, length enforcement, and vocal injection helpers
 * used across generation and refinement operations.
 *
 * @module ai/creative-boost/helpers
 */

import { generateLyrics, generateTitle, detectGenreFromTopic } from '@bun/ai/content-generator';
import { condense } from '@bun/ai/llm-rewriter';
import { GENRE_REGISTRY, type GenreType } from '@bun/instruments';
import { createLogger } from '@bun/logger';
import { convertToMaxFormat, convertToNonMaxFormat } from '@bun/prompt/conversion';
import { buildDeterministicMaxPrompt, buildDeterministicStandardPrompt, extractGenreFromPrompt, extractGenresFromPrompt, extractMoodFromPrompt } from '@bun/prompt/deterministic';
import { enforceLengthLimit } from '@bun/prompt/postprocess';
import { replaceFieldLine } from '@bun/prompt/remix';
import { generateDeterministicTitle } from '@bun/prompt/title';
import { APP_CONSTANTS } from '@shared/constants';

import type { PostProcessParams, CreativeBoostEngineConfig } from '@bun/ai/creative-boost/types';
import type { GenerationResult } from '@bun/ai/types';
import type { DebugInfo, ConversionOptions } from '@shared/types';
import type { LanguageModel } from 'ai';

const log = createLogger('CreativeBoostHelpers');
const MAX_CHARS = APP_CONSTANTS.MAX_PROMPT_CHARS;

/**
 * Default fallback topic when no lyrics topic or description is provided.
 * "Creative expression" is intentionally generic to give the LLM freedom
 * to generate thematically open lyrics.
 */
export const DEFAULT_LYRICS_TOPIC = 'creative expression';

/**
 * Applies max or non-max mode conversion to style output.
 */
export async function applyMaxModeConversion(
  style: string,
  maxMode: boolean,
  getModel: () => LanguageModel,
  options: ConversionOptions = {}
): Promise<{ styleResult: string; debugInfo?: DebugInfo['maxConversion'] }> {
  if (maxMode) {
    const result = await convertToMaxFormat(style, getModel, options);
    return { styleResult: result.convertedPrompt, debugInfo: result.debugInfo };
  } else {
    const result = await convertToNonMaxFormat(style, getModel, options);
    return { styleResult: result.convertedPrompt, debugInfo: result.debugInfo };
  }
}

/**
 * Enforces max character limit on prompt text.
 * Condenses text using LLM if it exceeds the limit.
 */
export async function enforceMaxLength(
  text: string,
  getModel: () => LanguageModel
): Promise<string> {
  if (text.length <= MAX_CHARS) {
    return text;
  }
  log.info('enforceMaxLength:processing', { originalLength: text.length, maxChars: MAX_CHARS });
  const result = await enforceLengthLimit(text, MAX_CHARS, (t) => condense(t, getModel));
  if (result.length < text.length) {
    log.info('enforceMaxLength:reduced', { newLength: result.length });
  }
  return result;
}

/**
 * Inject wordless vocals into the instruments line of a prompt.
 * Handles both MAX mode (instruments: "...") and standard mode (Instruments: ...) formats.
 */
export function injectWordlessVocals(prompt: string): string {
  // Match instruments line in both formats
  const maxModePattern = /(instruments:\s*"[^"]+)/i;
  const standardModePattern = /(Instruments:\s*[^\n]+)/i;

  // Try MAX mode format first
  if (maxModePattern.test(prompt)) {
    return prompt.replace(maxModePattern, '$1, wordless vocals');
  }

  // Try standard mode format
  if (standardModePattern.test(prompt)) {
    return prompt.replace(standardModePattern, '$1, wordless vocals');
  }

  // If no instruments line found, return unchanged
  return prompt;
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
  useSunoTags: boolean
): Promise<{ lyrics: string | undefined; debugInfo?: { systemPrompt: string; userPrompt: string } }> {
  if (!withLyrics) return { lyrics: undefined };

  const genre = extractGenreFromPrompt(styleResult);
  const mood = extractMoodFromPrompt(styleResult);
  const topicForLyrics = lyricsTopic?.trim() || description?.trim() || DEFAULT_LYRICS_TOPIC;
  const result = await generateLyrics(topicForLyrics, genre, mood, maxMode, getModel, useSunoTags);

  return {
    lyrics: result.lyrics,
    debugInfo: result.debugInfo,
  };
}

/**
 * Post-process a parsed creative boost response.
 */
export async function postProcessCreativeBoostResponse(
  parsed: { style: string; title: string },
  params: PostProcessParams
): Promise<GenerationResult> {
  const { maxMode, seedGenres, sunoStyles, lyricsTopic, description, withLyrics, config, performanceInstruments, performanceVocalStyle, chordProgression, bpmRange } = params;

  const { styleResult, debugInfo: maxConversionDebugInfo } = await applyMaxModeConversion(
    parsed.style, maxMode, config.getModel, { seedGenres, sunoStyles, performanceInstruments, performanceVocalStyle, chordProgression, bpmRange }
  );

  const processedStyle = await enforceMaxLength(styleResult, config.getModel);

  const lyricsResult = await generateLyricsForCreativeBoost(
    processedStyle,
    lyricsTopic,
    description,
    maxMode,
    withLyrics,
    config.getModel,
    config.getUseSunoTags?.() ?? false
  );

  let debugInfo: DebugInfo | undefined;
  if (config.isDebugMode()) {
    debugInfo = config.buildDebugInfo(params.systemPrompt, params.userPrompt, params.rawResponse);
    if (maxConversionDebugInfo) {
      debugInfo.maxConversion = maxConversionDebugInfo;
    }
    if (lyricsResult.debugInfo) {
      debugInfo.lyricsGeneration = lyricsResult.debugInfo;
    }
  }

  return {
    text: processedStyle,
    title: parsed.title,
    lyrics: lyricsResult.lyrics,
    debugInfo,
  };
}

// =============================================================================
// Genre Count Enforcement
// =============================================================================

/**
 * Select random genres from the registry, excluding specified genres.
 *
 * WHY: When the LLM returns fewer genres than requested, we need to add
 * more to meet the target count. This selects from the genre registry
 * while avoiding duplicates with existing genres.
 */
function selectRandomGenres(excludeGenres: string[], count: number): string[] {
  const allGenres = Object.keys(GENRE_REGISTRY) as GenreType[];
  const excludeSet = new Set(excludeGenres.map(g => g.toLowerCase()));
  const available = allGenres.filter(g => !excludeSet.has(g.toLowerCase()));

  // Shuffle and take count genres
  const shuffled = [...available].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

/**
 * Enforce a specific genre count in a prompt by trimming or adding genres.
 *
 * WHY: LLMs don't always follow genre count instructions precisely. This
 * post-processing step guarantees the output matches the user's selected
 * genre count, maintaining their fusion complexity preference even if the
 * LLM suggests a different number of genres.
 *
 * @param prompt - The prompt to enforce genre count on
 * @param targetCount - The exact number of genres required (1-4)
 * @returns Modified prompt with exactly targetCount genres
 */
export function enforceGenreCount(prompt: string, targetCount: number): string {
  // Clamp target to valid range
  const clampedTarget = Math.max(1, Math.min(4, targetCount));

  // Extract current genres
  const currentGenres = extractGenresFromPrompt(prompt);

  // If count matches, return unchanged
  if (currentGenres.length === clampedTarget) {
    return prompt;
  }

  let newGenres: string[];

  if (currentGenres.length > clampedTarget) {
    // Too many genres: trim to first N
    newGenres = currentGenres.slice(0, clampedTarget);
    log.info('enforceGenreCount:trimmed', {
      from: currentGenres.length,
      to: clampedTarget,
      kept: newGenres,
    });
  } else {
    // Too few genres: add from registry
    const neededCount = clampedTarget - currentGenres.length;
    const additionalGenres = selectRandomGenres(currentGenres, neededCount);
    newGenres = [...currentGenres, ...additionalGenres];
    log.info('enforceGenreCount:added', {
      from: currentGenres.length,
      to: clampedTarget,
      added: additionalGenres,
    });
  }

  // Check if prompt has a genre field at all
  const hasGenreField = /^genre:\s*/im.test(prompt) || /^Genre:\s*/m.test(prompt);

  if (!hasGenreField) {
    // No genre field: add one at the beginning
    const genreLine = `genre: "${newGenres.join(', ')}"`;
    log.info('enforceGenreCount:added_field', { genres: newGenres });
    return `${genreLine}\n${prompt}`;
  }

  // Replace existing genre field
  return replaceFieldLine(prompt, 'Genre', newGenres.join(', '));
}

// =============================================================================
// Creative Boost Generation Helpers
// =============================================================================

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
  getModel: () => LanguageModel
): Promise<{ genres: string[]; debugInfo?: GenreDetectionDebugInfo }> {
  // If we have seed genres, use them
  if (seedGenres.length > 0) {
    return { genres: seedGenres };
  }

  // Detect genre from lyrics topic if lyrics mode is ON and topic provided
  if (withLyrics && lyricsTopic?.trim()) {
    const result = await detectGenreFromTopic(lyricsTopic.trim(), getModel);
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
  getModel: () => LanguageModel
): Promise<{ title: string; debugInfo?: GenerationDebugInfo }> {
  if (withLyrics) {
    const topic = lyricsTopic?.trim() || description?.trim() || DEFAULT_LYRICS_TOPIC;
    const result = await generateTitle(topic, genre, mood, getModel);
    return { title: result.title, debugInfo: result.debugInfo };
  }

  return { title: generateDeterministicTitle(genre, mood) };
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
  useSunoTags: boolean
): Promise<{ lyrics?: string; debugInfo?: GenerationDebugInfo }> {
  if (!withLyrics) {
    return {};
  }

  const topic = lyricsTopic?.trim() || description?.trim() || DEFAULT_LYRICS_TOPIC;
  const result = await generateLyrics(topic, genre, mood, maxMode, getModel, useSunoTags);

  return { lyrics: result.lyrics, debugInfo: result.debugInfo };
}

/**
 * Build debug info for creative boost generation.
 * Only assembles when debug mode is enabled to avoid overhead in production.
 * Labels indicate generation path (deterministic vs LLM-assisted).
 */
export function buildCreativeBoostDebugInfo(
  config: CreativeBoostEngineConfig,
  context: { withLyrics: boolean; level: string; genre: string; mood: string; topic: string },
  styleResult: string,
  parts: {
    genreDetection?: GenreDetectionDebugInfo;
    titleGeneration?: GenerationDebugInfo;
    lyricsGeneration?: GenerationDebugInfo;
  }
): DebugInfo | undefined {
  if (!config.isDebugMode()) {
    return undefined;
  }

  const label = context.withLyrics ? 'DETERMINISTIC_PROMPT_LLM_TITLE_LYRICS' : 'FULLY_DETERMINISTIC';
  const userPrompt = `Creativity: ${context.level}, Genre: ${context.genre}, Mood: ${context.mood}, Topic: ${context.topic}`;

  const baseDebugInfo = config.buildDebugInfo(label, userPrompt, styleResult);

  return {
    ...baseDebugInfo,
    genreDetection: parts.genreDetection,
    titleGeneration: parts.titleGeneration,
    lyricsGeneration: parts.lyricsGeneration,
  };
}
