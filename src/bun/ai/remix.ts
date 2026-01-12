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
 * Supports both cloud providers and local Ollama for offline mode.
 *
 * @module ai/remix
 */

import { type LanguageModel } from 'ai';

import { generateTitle, generateLyrics } from '@bun/ai/content-generator';
import { checkOllamaAvailable } from '@bun/ai/ollama-availability';
import { createLogger } from '@bun/logger';
import {
  extractGenreFromPrompt,
  extractMoodFromPrompt,
} from '@bun/prompt/deterministic';
import { APP_CONSTANTS } from '@shared/constants';
import { OllamaModelMissingError, OllamaUnavailableError } from '@shared/errors';

const log = createLogger('Remix');

/**
 * Generate a new song title using AI based on prompt context.
 * Supports both cloud providers and local Ollama for offline mode.
 *
 * @param currentPrompt - The current prompt to extract genre/mood from
 * @param originalInput - The original user input for context
 * @param getModel - Function to get the language model
 * @param ollamaEndpoint - Optional Ollama endpoint for offline mode
 * @returns Generated title
 */
export async function remixTitle(
  currentPrompt: string,
  originalInput: string,
  getModel: () => LanguageModel,
  ollamaEndpoint?: string
): Promise<{ title: string }> {
  const genre = extractGenreFromPrompt(currentPrompt);
  const mood = extractMoodFromPrompt(currentPrompt);
  
  log.info('remixTitle', { genre, mood, offline: !!ollamaEndpoint });
  
  const result = await generateTitle(originalInput, genre, mood, getModel, undefined, ollamaEndpoint);
  return { title: result.title };
}

/**
 * Generate new lyrics using AI based on prompt context.
 *
 * When offline mode is enabled, uses Ollama local LLM instead of cloud provider.
 *
 * @param currentPrompt - The current prompt to extract genre/mood from
 * @param originalInput - The original user input for context
 * @param lyricsTopic - Optional specific topic for lyrics
 * @param maxMode - Whether to use max mode for lyrics generation
 * @param getModel - Function to get the language model (cloud or Ollama)
 * @param useSunoTags - Whether to include Suno-specific tags in lyrics
 * @param isOffline - Whether offline mode is enabled (uses Ollama)
 * @param ollamaEndpoint - Ollama server endpoint (required when isOffline is true)
 * @returns Generated lyrics
 *
 * @throws {OllamaUnavailableError} When offline mode is on but Ollama is not running
 * @throws {OllamaModelMissingError} When offline mode is on but Gemma model is missing
 */
export async function remixLyrics(
  currentPrompt: string,
  originalInput: string,
  lyricsTopic: string | undefined,
  maxMode: boolean,
  getModel: () => LanguageModel,
  useSunoTags: boolean = false,
  isOffline: boolean = false,
  ollamaEndpoint?: string
): Promise<{ lyrics: string }> {
  // Pre-flight check for Ollama when in offline mode
  if (isOffline && ollamaEndpoint) {
    const status = await checkOllamaAvailable(ollamaEndpoint);

    if (!status.available) {
      throw new OllamaUnavailableError(ollamaEndpoint);
    }

    if (!status.hasGemma) {
      throw new OllamaModelMissingError('gemma3:4b');
    }

    log.info('remixLyrics:usingOllama', { endpoint: ollamaEndpoint });
  }

  const genre = extractGenreFromPrompt(currentPrompt);
  const mood = extractMoodFromPrompt(currentPrompt);
  const topicForLyrics = lyricsTopic?.trim() || originalInput;

  // Use appropriate timeout based on mode
  const timeoutMs = isOffline
    ? APP_CONSTANTS.OLLAMA.GENERATION_TIMEOUT_MS
    : APP_CONSTANTS.AI.TIMEOUT_MS;

  const result = await generateLyrics(
    topicForLyrics,
    genre,
    mood,
    maxMode,
    getModel,
    useSunoTags,
    timeoutMs,
    isOffline ? ollamaEndpoint : undefined
  );
  return { lyrics: result.lyrics };
}
