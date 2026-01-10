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

import { callLLM } from '@bun/ai/llm-utils';
import { checkOllamaAvailable } from '@bun/ai/ollama-availability';
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
 * Apply locked phrase to prompt if provided.
 * 
 * @param prompt - Prompt text to modify
 * @param lockedPhrase - Optional locked phrase to inject
 * @param isMaxMode - Whether max mode is enabled
 * @returns Prompt with locked phrase injected if provided
 */
async function applyLockedPhraseIfNeeded(
  prompt: string,
  lockedPhrase: string | undefined,
  isMaxMode: boolean
): Promise<string> {
  if (!lockedPhrase) return prompt;
  
  const { injectLockedPhrase } = await import('@bun/prompt/postprocess');
  return injectLockedPhrase(prompt, lockedPhrase, isMaxMode);
}

/**
 * Refine prompt deterministically without LLM calls.
 * Used when local LLM is active and lyrics mode is disabled.
 * 
 * Regenerates style tags using genre-based deterministic logic,
 * preserving title and other prompt fields.
 * 
 * @param options - Refinement options
 * @param config - Configuration with dependencies
 * @returns Refined prompt with updated style tags
 */
async function refinePromptDeterministic(
  options: RefinePromptOptions,
  config: RefinementConfig
): Promise<GenerationResult> {
  const { currentPrompt, currentTitle, lockedPhrase } = options;

  const { extractGenreFromPrompt, remixStyleTags } = await import('@bun/prompt/deterministic');

  const genre = extractGenreFromPrompt(currentPrompt);
  
  log.info('refinePromptDeterministic:start', { genre, hasLockedPhrase: !!lockedPhrase });

  const { text: updatedPrompt } = remixStyleTags(currentPrompt);

  let finalPrompt = await config.postProcess(updatedPrompt);
  finalPrompt = await applyLockedPhraseIfNeeded(finalPrompt, lockedPhrase, config.isMaxMode());

  log.info('refinePromptDeterministic:complete', { 
    promptLength: finalPrompt.length,
    genre,
  });

  return {
    text: finalPrompt,
    title: currentTitle,
    debugInfo: config.isDebugMode()
      ? config.buildDebugInfo(
          'DETERMINISTIC_REFINE (offline mode, style-only)',
          `Genre: ${genre}\nFeedback: ${options.feedback}`,
          'Style tags regenerated deterministically'
        )
      : undefined,
  };
}

/**
 * Build system prompt for lyrics refinement.
 * Used when local LLM is active and lyrics mode is ON.
 *
 * @param genre - Genre for lyrics context
 * @param mood - Mood for lyrics context
 * @param useSunoTags - Whether to use Suno-compatible tags
 * @returns System prompt for lyrics refinement
 */
function buildLyricsRefinementPrompt(
  genre: string,
  mood: string,
  useSunoTags: boolean
): string {
  const tagInstructions = useSunoTags
    ? 'Use Suno-compatible section tags: [Verse], [Chorus], [Bridge], [Outro], etc.'
    : 'Use standard section markers like [Verse 1], [Chorus], [Bridge].';

  return `You are a professional songwriter refining existing lyrics for a ${genre} song with a ${mood} mood.

TASK: Apply the user's feedback to improve the lyrics while maintaining the song structure.

RULES:
- Keep the same overall structure (verses, chorus, bridge)
- Apply the specific changes requested in the feedback
- Maintain the genre (${genre}) and mood (${mood})
- ${tagInstructions}
- Keep lines singable with natural rhythm
- Output ONLY the refined lyrics, no explanations

IMPORTANT: Return only the refined lyrics text, nothing else.`;
}

/**
 * Refine only the lyrics using LLM, applying user feedback.
 * Used when local LLM is active and lyrics mode is ON.
 * Style fields remain unchanged (handled by deterministic refinement).
 *
 * @param currentLyrics - Current lyrics to refine
 * @param feedback - User feedback to apply
 * @param currentPrompt - Current prompt for genre/mood extraction
 * @param lyricsTopic - Optional topic for context
 * @param config - Configuration with dependencies
 * @returns Refined lyrics
 *
 * @throws {OllamaUnavailableError} When Ollama is not running
 * @throws {OllamaModelMissingError} When Gemma model is missing
 */
async function refineLyricsWithFeedback(
  currentLyrics: string,
  feedback: string,
  currentPrompt: string,
  lyricsTopic: string | undefined,
  config: RefinementConfig
): Promise<{ lyrics: string }> {
  const { extractGenreFromPrompt, extractMoodFromPrompt } = await import('@bun/prompt/deterministic');

  const genre = extractGenreFromPrompt(currentPrompt);
  const mood = extractMoodFromPrompt(currentPrompt);
  const ollamaEndpoint = config.getOllamaEndpoint();
  const timeoutMs = APP_CONSTANTS.OLLAMA.GENERATION_TIMEOUT_MS;

  log.info('refineLyricsWithFeedback:start', {
    genre,
    mood,
    feedbackLength: feedback.length,
    currentLyricsLength: currentLyrics.length,
  });

  // Validate Ollama is available
  await validateOllamaForRefinement(ollamaEndpoint);

  const systemPrompt = buildLyricsRefinementPrompt(genre, mood, config.getUseSunoTags());
  const userPrompt = `Current lyrics:\n${currentLyrics}\n\nFeedback to apply:\n${feedback}${lyricsTopic ? `\n\nTopic/theme: ${lyricsTopic}` : ''}`;

  const refinedLyrics = await callLLM({
    getModel: config.getModel,
    systemPrompt,
    userPrompt,
    errorContext: 'refine lyrics with feedback',
    ollamaEndpoint,
    timeoutMs,
  });

  log.info('refineLyricsWithFeedback:complete', {
    outputLength: refinedLyrics.length,
  });

  return { lyrics: cleanLyrics(refinedLyrics) || currentLyrics };
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
 * Refine an existing prompt based on user feedback.
 *
 * Uses combined system prompt that includes current prompt context,
 * expecting JSON response with refined prompt, title, and optional lyrics.
 * Falls back to simpler refinement if JSON parsing fails.
 *
 * When offline mode is enabled:
 * - For style-only refinement (no lyrics): Uses deterministic style tag generation
 * - For lyrics refinement: Uses Ollama local LLM
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
  const isLyricsMode = config.isLyricsMode();
  const ollamaEndpoint = isOffline ? config.getOllamaEndpoint() : undefined;
  const timeoutMs = isOffline
    ? APP_CONSTANTS.OLLAMA.GENERATION_TIMEOUT_MS
    : APP_CONSTANTS.AI.TIMEOUT_MS;

  // When local LLM is active: style is ALWAYS deterministic
  // LLM is used ONLY for lyrics (matching README architecture)
  if (isOffline) {
    log.info('refinePrompt:offlineMode', {
      isLyricsMode,
      hasCurrentLyrics: !!currentLyrics,
      reason: 'local LLM = style always deterministic, LLM for lyrics only',
    });

    // Step 1: ALWAYS do deterministic style refinement
    const styleResult = await refinePromptDeterministic(options, config);

    // Step 2: If lyrics mode is ON and we have lyrics, refine them with local LLM
    if (isLyricsMode && currentLyrics) {
      const lyricsResult = await refineLyricsWithFeedback(
        currentLyrics,
        feedback,
        currentPrompt,
        lyricsTopic,
        config
      );

      return {
        ...styleResult,
        lyrics: lyricsResult.lyrics,
        debugInfo: config.isDebugMode()
          ? config.buildDebugInfo(
              'OFFLINE_REFINEMENT (style: deterministic, lyrics: LLM)',
              `Style feedback + lyrics feedback: ${feedback}`,
              `Style: deterministic remix\nLyrics: local LLM refined`
            )
          : undefined,
      };
    }

    return styleResult;
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

  const systemPrompt = isLyricsMode
    ? buildCombinedWithLyricsSystemPrompt(MAX_CHARS, config.getUseSunoTags(), config.isMaxMode(), refinement)
    : buildCombinedSystemPrompt(MAX_CHARS, config.getUseSunoTags(), config.isMaxMode(), refinement);

  const userPrompt = `Apply this feedback and return the refined JSON:\n\n${feedback}`;

  const rawResponse = await callLLM({
    getModel: config.getModel,
    systemPrompt,
    userPrompt,
    errorContext: 'refine prompt (combined JSON)',
    ollamaEndpoint,
    timeoutMs,
  });

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
    const text = await callLLM({
      getModel: config.getModel,
      systemPrompt,
      userPrompt,
      errorContext: 'refine prompt (fallback)',
      ollamaEndpoint,
      timeoutMs,
    });

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
