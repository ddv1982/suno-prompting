/**
 * Initial Prompt Generation Module
 *
 * Handles initial prompt generation with three distinct paths:
 * - Deterministic path (lyrics OFF): No LLM calls, <50ms execution
 * - LLM-assisted path (lyrics ON, cloud): Genre detection, title, and lyrics via cloud LLM
 * - Offline path (lyrics ON, offline mode): Same as LLM-assisted but using local Ollama
 *
 * Extracted from AIEngine for single responsibility and testability.
 *
 * @module ai/generation
 */

import { generateLyrics, generateTitle, detectGenreFromTopic } from '@bun/ai/content-generator';
import { checkOllamaAvailable } from '@bun/ai/ollama-availability';
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
import { OllamaModelMissingError, OllamaUnavailableError } from '@shared/errors';
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
  /** Optional Suno V5 styles for Direct Mode (mutually exclusive with genreOverride) */
  sunoStyles?: string[];
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
 *
 * @param options - Generation options
 * @param config - Configuration with dependencies
 * @param useOffline - Whether to use Ollama for offline generation
 */
async function generateInitialWithLyrics(
  options: GenerateInitialOptions,
  config: GenerationConfig,
  useOffline: boolean = false
): Promise<GenerationResult> {
  const { description, lockedPhrase, lyricsTopic, genreOverride } = options;

  // For offline mode, use direct Ollama client to bypass Bun fetch empty body bug
  // For cloud mode, use AI SDK as normal
  const getModelFn = config.getModel;
  const ollamaEndpoint = useOffline ? config.getOllamaEndpoint() : undefined;

  let resolvedGenreOverride = genreOverride;
  let genreDetectionDebugInfo: { systemPrompt: string; userPrompt: string; detectedGenre: string } | undefined;

  // 1. Detect genre from lyrics topic if no override provided (LLM call)
  if (!genreOverride && lyricsTopic?.trim()) {
    const genreResult = await detectGenreFromTopic(lyricsTopic.trim(), getModelFn, undefined, ollamaEndpoint);
    resolvedGenreOverride = genreResult.genre;
    genreDetectionDebugInfo = genreResult.debugInfo;
    log.info('generateInitialWithLyrics:genreFromTopic', { lyricsTopic, detectedGenre: genreResult.genre, offline: useOffline });
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
  const titleResult = await generateTitle(topicForTitle, genre, mood, getModelFn, undefined, ollamaEndpoint);
  const title = titleResult.title;
  const titleDebugInfo = titleResult.debugInfo;

  // 6. Generate lyrics via LLM
  const topicForLyrics = lyricsTopic?.trim() || description;
  const lyricsResult = await generateLyrics(
    topicForLyrics,
    genre,
    mood,
    config.isMaxMode(),
    getModelFn,
    config.getUseSunoTags(),
    undefined,
    ollamaEndpoint
  );
  const lyrics = lyricsResult.lyrics;
  const lyricsDebugInfo = lyricsResult.debugInfo;

  // 7. Build debug info if debug mode enabled
  const modelLabel = useOffline ? 'ollama:gemma3:4b' : config.getModelName();
  const debugInfo = config.isDebugMode()
    ? {
        systemPrompt: `Deterministic prompt; ${useOffline ? 'Ollama (direct)' : 'LLM'} for genre detection, title, and lyrics`,
        userPrompt: description,
        model: modelLabel,
        provider: config.getProvider(),
        timestamp: nowISO(),
        requestBody: JSON.stringify({ deterministicResult: deterministicResult.metadata, offline: useOffline }, null, 2),
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
 * Offline generation path using Ollama local LLM.
 *
 * Pre-flight checks Ollama availability before delegating to the
 * standard LLM-assisted generation with the Ollama model.
 *
 * @throws {OllamaUnavailableError} When Ollama server is not running
 * @throws {OllamaModelMissingError} When Gemma 3 4B model is not installed
 */
async function generateInitialWithOfflineLyrics(
  options: GenerateInitialOptions,
  config: GenerationConfig
): Promise<GenerationResult> {
  // Pre-flight check: Verify Ollama is available
  const endpoint = config.getOllamaEndpoint();
  const status = await checkOllamaAvailable(endpoint);

  if (!status.available) {
    throw new OllamaUnavailableError(endpoint);
  }

  if (!status.hasGemma) {
    throw new OllamaModelMissingError('gemma3:4b');
  }

  log.info('generateInitialWithOfflineLyrics:start', { endpoint });

  // Delegate to standard generation with offline flag
  return generateInitialWithLyrics(options, config, true);
}

/**
 * Generate initial prompt.
 *
 * Branches based on Direct Mode, lyrics, and offline mode:
 * - Direct Mode (sunoStyles provided): Uses Suno V5 styles as-is with enrichment
 * - Lyrics OFF: Fully deterministic path (<50ms, no LLM calls)
 * - Lyrics ON + Offline: Ollama-assisted path (local Gemma 3 4B)
 * - Lyrics ON + Cloud: LLM-assisted path (genre detection, title, lyrics generation)
 *
 * @param options - Options for generating initial prompt
 * @param config - Configuration with dependencies
 * @returns Generated prompt, title, and optionally lyrics
 */
export async function generateInitial(
  options: GenerateInitialOptions,
  config: GenerationConfig
): Promise<GenerationResult> {
  // Direct Mode: Use sunoStyles as-is (bypasses deterministic genre logic)
  if (options.sunoStyles && options.sunoStyles.length > 0) {
    const { generateDirectModeTitle } = await import('@bun/ai/llm-utils');
    const { buildDirectModePrompt } = await import('@bun/ai/direct-mode');
    
    const title = await generateDirectModeTitle(
      options.description || '',
      options.sunoStyles,
      config.getModel
    );
    
    // Use centralized prompt building
    const { text, enriched } = buildDirectModePrompt(options.sunoStyles, config.isMaxMode());
    
    const debugInfo = config.isDebugMode()
      ? config.buildDebugInfo(
          'DIRECT_MODE (Full Prompt Advanced): Styles preserved, prompt enriched.',
          `Suno V5 Styles: ${options.sunoStyles.join(', ')}\nExtracted Genres: ${enriched.extractedGenres.join(', ') || '(none)'}\nDescription: ${options.description || '(none)'}`,
          text
        )
      : undefined;
    
    return {
      text,
      title,
      debugInfo,
    };
  }
  
  if (!config.isLyricsMode()) {
    return generateInitialDeterministic(options, config);
  }
  
  // Use offline generation with Ollama when offline mode is enabled
  if (config.isUseLocalLLM()) {
    return generateInitialWithOfflineLyrics(options, config);
  }
  
  return generateInitialWithLyrics(options, config);
}
