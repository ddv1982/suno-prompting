/**
 * Prompt Refinement Module
 *
 * Handles refinement of existing prompts based on user feedback.
 * Uses LLM to apply feedback while maintaining prompt structure.
 * Supports both cloud providers and local Ollama for offline mode.
 *
 * Extracted from AIEngine for single responsibility and testability.
 *
 * @module ai/refinement
 */

import { generateText, type LanguageModel } from 'ai';

import { checkOllamaAvailable } from '@bun/ai/ollama-availability';
import { generateWithOllama } from '@bun/ai/ollama-client';
import { cleanLyrics, cleanTitle } from '@bun/ai/utils';
import { createLogger } from '@bun/logger';
import {
  buildCombinedSystemPrompt,
  buildCombinedWithLyricsSystemPrompt,
  buildSystemPrompt,
  buildMaxModeSystemPrompt,
  type RefinementContext,
} from '@bun/prompt/builders';
import { injectLockedPhrase } from '@bun/prompt/postprocess';
import { APP_CONSTANTS } from '@shared/constants';
import { AIGenerationError, OllamaModelMissingError, OllamaUnavailableError } from '@shared/errors';
import { cleanJsonResponse } from '@shared/prompt-utils';

import type { GenerationResult, ParsedCombinedResponse, RefinementConfig } from '@bun/ai/types';

const log = createLogger('Refinement');

const MAX_CHARS = APP_CONSTANTS.MAX_PROMPT_CHARS;

/**
 * Options for refining a prompt.
 */
export interface RefinePromptOptions {
  /** Current prompt to refine */
  currentPrompt: string;
  /** Current title */
  currentTitle: string;
  /** User feedback to apply */
  feedback: string;
  /** Current lyrics (when lyrics mode enabled) */
  currentLyrics?: string;
  /** Locked phrase to preserve */
  lockedPhrase?: string;
  /** Topic for lyrics refinement */
  lyricsTopic?: string;
}

/**
 * Parse JSON response from LLM.
 */
function parseJsonResponse(rawResponse: string, actionName: string): ParsedCombinedResponse | null {
  try {
    const cleaned = cleanJsonResponse(rawResponse);
    const parsed = JSON.parse(cleaned) as ParsedCombinedResponse;
    if (!parsed.prompt) {
      throw new AIGenerationError('Missing prompt in response');
    }
    return parsed;
  } catch (e) {
    log.warn(`${actionName}:json_parse_failed`, {
      error: e instanceof Error ? e.message : 'Unknown error',
      rawResponse: rawResponse.slice(0, 200),
    });
    return null;
  }
}

/**
 * Get system prompt based on mode.
 */
function getSystemPrompt(isMaxMode: boolean, useSunoTags: boolean): string {
  if (isMaxMode) {
    return buildMaxModeSystemPrompt(MAX_CHARS);
  }
  return buildSystemPrompt(MAX_CHARS, useSunoTags);
}

/**
 * Validate Ollama availability for offline mode.
 *
 * @throws {OllamaUnavailableError} When Ollama is not running
 * @throws {OllamaModelMissingError} When Gemma model is missing
 */
async function validateOllamaForRefinement(endpoint: string): Promise<void> {
  const status = await checkOllamaAvailable(endpoint);

  if (!status.available) {
    throw new OllamaUnavailableError(endpoint);
  }

  if (!status.hasGemma) {
    throw new OllamaModelMissingError('gemma3:4b');
  }

  log.info('refinePrompt:usingOllama', { endpoint });
}

/**
 * Generate text using either the AI SDK (cloud) or direct Ollama client (local).
 * Uses direct Ollama client for offline mode to bypass Bun fetch empty body bug.
 */
async function generateTextForRefinement(
  systemPrompt: string,
  userPrompt: string,
  getModel: () => LanguageModel,
  timeoutMs: number,
  ollamaEndpoint?: string
): Promise<string> {
  if (ollamaEndpoint) {
    // Use direct Ollama client to bypass Bun fetch empty body bug
    return generateWithOllama(ollamaEndpoint, systemPrompt, userPrompt, timeoutMs);
  }
  // Use AI SDK for cloud providers
  const result = await generateText({
    model: getModel(),
    system: systemPrompt,
    prompt: userPrompt,
    maxRetries: APP_CONSTANTS.AI.MAX_RETRIES,
    abortSignal: AbortSignal.timeout(timeoutMs),
  });
  return result.text;
}

/**
 * Refine an existing prompt based on user feedback.
 *
 * Uses combined system prompt that includes current prompt context,
 * expecting JSON response with refined prompt, title, and optional lyrics.
 * Falls back to simpler refinement if JSON parsing fails.
 *
 * When offline mode is enabled, uses Ollama local LLM instead of cloud provider.
 *
 * @param options - Options for refinement
 * @param config - Configuration with dependencies
 * @returns Refined prompt, title, and optionally lyrics
 *
 * @throws {OllamaUnavailableError} When offline mode is on but Ollama is not running
 * @throws {OllamaModelMissingError} When offline mode is on but Gemma model is missing
 */
export async function refinePrompt(
  options: RefinePromptOptions,
  config: RefinementConfig
): Promise<GenerationResult> {
  const {
    currentPrompt,
    currentTitle,
    feedback,
    currentLyrics,
    lockedPhrase,
    lyricsTopic,
  } = options;

  // Determine offline mode and endpoint
  const isOffline = config.isUseLocalLLM();
  const ollamaEndpoint = isOffline ? config.getOllamaEndpoint() : undefined;
  const timeoutMs = isOffline
    ? APP_CONSTANTS.OLLAMA.GENERATION_TIMEOUT_MS
    : APP_CONSTANTS.AI.TIMEOUT_MS;

  // Validate Ollama if in offline mode
  if (isOffline && ollamaEndpoint) {
    await validateOllamaForRefinement(ollamaEndpoint);
  }

  // Remove locked phrase from prompt before sending to LLM
  const promptForLLM = lockedPhrase
    ? currentPrompt.replace(`, ${lockedPhrase}`, '').replace(`${lockedPhrase}, `, '').replace(lockedPhrase, '')
    : currentPrompt;

  const refinement: RefinementContext = {
    currentPrompt: promptForLLM,
    currentTitle: currentTitle || 'Untitled',
    currentLyrics: currentLyrics,
    lyricsTopic: lyricsTopic,
  };

  const isLyricsMode = config.isLyricsMode();
  const systemPrompt = isLyricsMode
    ? buildCombinedWithLyricsSystemPrompt(MAX_CHARS, config.getUseSunoTags(), config.isMaxMode(), refinement)
    : buildCombinedSystemPrompt(MAX_CHARS, config.getUseSunoTags(), config.isMaxMode(), refinement);

  const userPrompt = `Apply this feedback and return the refined JSON:\n\n${feedback}`;

  // Use direct Ollama client for offline mode to bypass Bun fetch bug
  const rawResponse = await generateTextForRefinement(
    systemPrompt,
    userPrompt,
    config.getModel,
    timeoutMs,
    ollamaEndpoint
  );

  const parsed = parseJsonResponse(rawResponse, 'refinePrompt');
  if (!parsed) {
    // Use fallback refinement with same provider routing
    const fallbackResult = await refinePromptFallbackWithModel(
      promptForLLM,
      feedback,
      lockedPhrase,
      config,
      timeoutMs,
      ollamaEndpoint
    );
    return {
      ...fallbackResult,
      title: currentTitle,
      lyrics: isLyricsMode ? currentLyrics : undefined,
    };
  }

  let promptText = await config.postProcess(parsed.prompt);

  if (lockedPhrase) {
    promptText = injectLockedPhrase(promptText, lockedPhrase, config.isMaxMode());
  }

  return {
    text: promptText,
    title: cleanTitle(parsed.title, currentTitle),
    lyrics: isLyricsMode ? (cleanLyrics(parsed.lyrics) || currentLyrics) : undefined,
    debugInfo: config.isDebugMode()
      ? config.buildDebugInfo(systemPrompt, userPrompt, rawResponse)
      : undefined,
  };
}

/**
 * Fallback refinement when JSON parsing fails.
 * Uses direct Ollama client for offline mode to bypass Bun fetch bug.
 */
async function refinePromptFallbackWithModel(
  currentPrompt: string,
  feedback: string,
  lockedPhrase: string | undefined,
  config: RefinementConfig,
  timeoutMs: number,
  ollamaEndpoint?: string
): Promise<GenerationResult> {
  const systemPrompt = getSystemPrompt(config.isMaxMode(), config.getUseSunoTags());
  const userPrompt = `Previous prompt:\n${currentPrompt}\n\nFeedback:\n${feedback}`;

  try {
    // Use direct Ollama client for offline mode to bypass Bun fetch bug
    const text = await generateTextForRefinement(
      systemPrompt,
      userPrompt,
      config.getModel,
      timeoutMs,
      ollamaEndpoint
    );

    if (!text?.trim()) {
      throw new AIGenerationError('Empty response from AI model (refine prompt fallback)');
    }

    let result = await config.postProcess(text);

    if (lockedPhrase) {
      result = injectLockedPhrase(result, lockedPhrase, config.isMaxMode());
    }

    return {
      text: result,
      debugInfo: config.isDebugMode()
        ? config.buildDebugInfo(systemPrompt, userPrompt, text)
        : undefined,
    };
  } catch (error: unknown) {
    if (error instanceof AIGenerationError) throw error;
    throw new AIGenerationError(
      `Failed to refine prompt fallback: ${error instanceof Error ? error.message : 'Unknown error'}`,
      error instanceof Error ? error : undefined
    );
  }
}
