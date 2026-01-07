/**
 * Prompt Refinement Module
 *
 * Handles refinement of existing prompts based on user feedback.
 * Uses LLM to apply feedback while maintaining prompt structure.
 *
 * Extracted from AIEngine for single responsibility and testability.
 *
 * @module ai/refinement
 */

import { generateText } from 'ai';

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
import { AIGenerationError } from '@shared/errors';
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
 * Clean title by removing quotes and trimming.
 */
function cleanTitle(title: string | undefined, fallback: string = 'Untitled'): string {
  return title?.trim().replace(/^["']|["']$/g, '') || fallback;
}

/**
 * Clean lyrics by trimming whitespace.
 */
function cleanLyrics(lyrics: string | undefined): string | undefined {
  return lyrics?.trim() || undefined;
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
 * Fallback refinement when JSON parsing fails.
 *
 * Uses simpler prompt format without JSON structure,
 * relying on conversation history for context.
 */
async function refinePromptFallback(
  currentPrompt: string,
  feedback: string,
  lockedPhrase: string | undefined,
  config: RefinementConfig
): Promise<GenerationResult> {
  const systemPrompt = getSystemPrompt(config.isMaxMode(), config.getUseSunoTags());
  const userPrompt = `Previous prompt:\n${currentPrompt}\n\nFeedback:\n${feedback}`;
  const messages: Array<{ role: 'assistant' | 'user'; content: string }> = [
    { role: 'assistant', content: currentPrompt },
    { role: 'user', content: feedback },
  ];

  try {
    const genResult = await generateText({
      model: config.getModel(),
      system: systemPrompt,
      messages,
      maxRetries: APP_CONSTANTS.AI.MAX_RETRIES,
      abortSignal: AbortSignal.timeout(APP_CONSTANTS.AI.TIMEOUT_MS),
    });

    if (!genResult.text?.trim()) {
      throw new AIGenerationError('Empty response from AI model (refine prompt fallback)');
    }

    let result = await config.postProcess(genResult.text);

    if (lockedPhrase) {
      result = injectLockedPhrase(result, lockedPhrase, config.isMaxMode());
    }

    return {
      text: result,
      debugInfo: config.isDebugMode()
        ? config.buildDebugInfo(systemPrompt, userPrompt, genResult.text, messages)
        : undefined,
    };
  } catch (error) {
    if (error instanceof AIGenerationError) throw error;
    throw new AIGenerationError(
      `Failed to refine prompt fallback: ${error instanceof Error ? error.message : 'Unknown error'}`,
      error instanceof Error ? error : undefined
    );
  }
}

/**
 * Refine an existing prompt based on user feedback.
 *
 * Uses combined system prompt that includes current prompt context,
 * expecting JSON response with refined prompt, title, and optional lyrics.
 * Falls back to simpler refinement if JSON parsing fails.
 *
 * @param options - Options for refinement
 * @param config - Configuration with dependencies
 * @returns Refined prompt, title, and optionally lyrics
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

  const { text: rawResponse } = await generateText({
    model: config.getModel(),
    system: systemPrompt,
    prompt: userPrompt,
    maxRetries: APP_CONSTANTS.AI.MAX_RETRIES,
    abortSignal: AbortSignal.timeout(APP_CONSTANTS.AI.TIMEOUT_MS),
  });

  const parsed = parseJsonResponse(rawResponse, 'refinePrompt');
  if (!parsed) {
    const fallbackResult = await refinePromptFallback(promptForLLM, feedback, lockedPhrase, config);
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
