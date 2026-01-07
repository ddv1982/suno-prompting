/**
 * Initial Prompt Generation Module
 *
 * Handles initial prompt generation with two distinct paths:
 * - Deterministic path (lyrics OFF): No LLM calls, <50ms execution
 * - LLM-assisted path (lyrics ON): Genre detection, title, and lyrics via LLM
 *
 * Extracted from AIEngine for single responsibility and testability.
 *
 * @module ai/generation
 */

import { generateLyrics, generateTitle, detectGenreFromTopic } from '@bun/ai/content-generator';
import { cleanLyrics, cleanTitle } from '@bun/ai/utils';
import { createLogger } from '@bun/logger';
import {
  buildDeterministicMaxPrompt,
  buildDeterministicStandardPrompt,
  extractGenreFromPrompt,
  extractMoodFromPrompt,
} from '@bun/prompt/deterministic';
import { injectLockedPhrase } from '@bun/prompt/postprocess';
import { generateDeterministicTitle } from '@bun/prompt/title';
import { nowISO } from '@shared/utils';

import type { GenerationConfig, GenerationResult } from '@bun/ai/types';

const log = createLogger('Generation');

/**
 * Options for generating an initial prompt.
 */
export interface GenerateInitialOptions {
  /** User's song description */
  description: string;
  /** Optional phrase to inject into prompt */
  lockedPhrase?: string;
  /** Optional topic for lyrics generation */
  lyricsTopic?: string;
  /** Optional genre override from Advanced Mode */
  genreOverride?: string;
}

/**
 * Fully deterministic generation path (lyrics mode OFF).
 *
 * No LLM calls - executes in <50ms. Uses deterministic builders
 * for prompt and title generation, avoiding network calls.
 */
function generateInitialDeterministic(
  options: GenerateInitialOptions,
  config: GenerationConfig
): GenerationResult {
  const { description, lockedPhrase, genreOverride } = options;

  // 1. Build prompt deterministically (max or standard mode)
  const deterministicResult = config.isMaxMode()
    ? buildDeterministicMaxPrompt({ description, genreOverride })
    : buildDeterministicStandardPrompt({ description, genreOverride });

  let promptText = deterministicResult.text;

  // 2. Inject locked phrase if provided
  if (lockedPhrase) {
    promptText = injectLockedPhrase(promptText, lockedPhrase, config.isMaxMode());
  }

  // 3. Generate deterministic title from extracted genre/mood
  const genre = extractGenreFromPrompt(promptText);
  const mood = extractMoodFromPrompt(promptText);
  const title = generateDeterministicTitle(genre, mood);

  // 4. Build debug info if debug mode enabled
  const debugInfo = config.isDebugMode()
    ? {
        systemPrompt: 'Fully deterministic generation - no LLM calls',
        userPrompt: description,
        model: config.getModelName(),
        provider: config.getProvider(),
        timestamp: nowISO(),
        requestBody: JSON.stringify({ deterministicResult: deterministicResult.metadata }, null, 2),
        responseBody: promptText,
      }
    : undefined;

  return {
    text: promptText,
    title: cleanTitle(title),
    debugInfo,
  };
}

/**
 * LLM-assisted generation path (lyrics mode ON).
 *
 * Uses LLM for genre detection (when no override), title generation
 * (to match lyrics theme), and lyrics generation. Prompt building
 * remains deterministic for consistency.
 */
async function generateInitialWithLyrics(
  options: GenerateInitialOptions,
  config: GenerationConfig
): Promise<GenerationResult> {
  const { description, lockedPhrase, lyricsTopic, genreOverride } = options;

  let resolvedGenreOverride = genreOverride;
  let genreDetectionDebugInfo: { systemPrompt: string; userPrompt: string; detectedGenre: string } | undefined;

  // 1. Detect genre from lyrics topic if no override provided (LLM call)
  if (!genreOverride && lyricsTopic?.trim()) {
    const genreResult = await detectGenreFromTopic(lyricsTopic.trim(), config.getModel);
    resolvedGenreOverride = genreResult.genre;
    genreDetectionDebugInfo = genreResult.debugInfo;
    log.info('generateInitialWithLyrics:genreFromTopic', { lyricsTopic, detectedGenre: genreResult.genre });
  }

  // 2. Build prompt deterministically (no LLM)
  const deterministicResult = config.isMaxMode()
    ? buildDeterministicMaxPrompt({ description, genreOverride: resolvedGenreOverride })
    : buildDeterministicStandardPrompt({ description, genreOverride: resolvedGenreOverride });

  let promptText = deterministicResult.text;

  // 3. Inject locked phrase if provided
  if (lockedPhrase) {
    promptText = injectLockedPhrase(promptText, lockedPhrase, config.isMaxMode());
  }

  // 4. Extract genre and mood for title/lyrics generation
  const genre = extractGenreFromPrompt(promptText);
  const mood = extractMoodFromPrompt(promptText);

  // 5. Generate title via LLM (to match lyrics theme)
  const topicForTitle = lyricsTopic?.trim() || description;
  const titleResult = await generateTitle(topicForTitle, genre, mood, config.getModel);
  const title = titleResult.title;
  const titleDebugInfo = titleResult.debugInfo;

  // 6. Generate lyrics via LLM
  const topicForLyrics = lyricsTopic?.trim() || description;
  const lyricsResult = await generateLyrics(
    topicForLyrics,
    genre,
    mood,
    config.isMaxMode(),
    config.getModel,
    config.getUseSunoTags()
  );
  const lyrics = lyricsResult.lyrics;
  const lyricsDebugInfo = lyricsResult.debugInfo;

  // 7. Build debug info if debug mode enabled
  const debugInfo = config.isDebugMode()
    ? {
        systemPrompt: 'Deterministic prompt; LLM for genre detection, title, and lyrics',
        userPrompt: description,
        model: config.getModelName(),
        provider: config.getProvider(),
        timestamp: nowISO(),
        requestBody: JSON.stringify({ deterministicResult: deterministicResult.metadata }, null, 2),
        responseBody: promptText,
        genreDetection: genreDetectionDebugInfo,
        titleGeneration: titleDebugInfo,
        lyricsGeneration: lyricsDebugInfo,
      }
    : undefined;

  return {
    text: promptText,
    title: cleanTitle(title),
    lyrics: cleanLyrics(lyrics),
    debugInfo,
  };
}

/**
 * Generate initial prompt.
 *
 * Branches based on lyrics mode:
 * - Lyrics OFF: Fully deterministic path (<50ms, no LLM calls)
 * - Lyrics ON: LLM-assisted path (genre detection, title, lyrics generation)
 *
 * @param options - Options for generating initial prompt
 * @param config - Configuration with dependencies
 * @returns Generated prompt, title, and optionally lyrics
 */
export async function generateInitial(
  options: GenerateInitialOptions,
  config: GenerationConfig
): Promise<GenerationResult> {
  if (!config.isLyricsMode()) {
    return generateInitialDeterministic(options, config);
  }
  return generateInitialWithLyrics(options, config);
}
