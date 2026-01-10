/**
 * Prompt Refinement Module
 *
 * Handles refinement of existing prompts based on user feedback.
 * 
 * Architecture (unified for all providers):
 * - Style refinement: Always deterministic (no LLM calls, <50ms)
 * - Lyrics refinement: Uses LLM (cloud or Ollama based on settings)
 *
 * This ensures fast, consistent style refinement while leveraging
 * LLM capabilities only for creative lyrics work.
 *
 * @module ai/refinement
 */

import { callLLM } from '@bun/ai/llm-utils';
import { checkOllamaAvailable } from '@bun/ai/ollama-availability';
import { cleanLyrics } from '@bun/ai/utils';
import { createLogger } from '@bun/logger';
import { APP_CONSTANTS } from '@shared/constants';
import { OllamaModelMissingError, OllamaUnavailableError } from '@shared/errors';

import type { GenerationResult, RefinementConfig } from '@bun/ai/types';

const log = createLogger('Refinement');

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
          'DETERMINISTIC_REFINE (style-only)',
          `Genre: ${genre}\nFeedback: ${options.feedback}`,
          'Style tags regenerated deterministically'
        )
      : undefined,
  };
}

/**
 * Build system prompt for lyrics refinement.
 * Used when lyrics mode is ON (works with both cloud and local LLM).
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
 * Style fields remain unchanged (handled by deterministic refinement).
 * 
 * Works with both cloud providers and local Ollama:
 * - Cloud: Uses configured AI provider (Groq/OpenAI/Anthropic)
 * - Offline: Uses local Ollama with Gemma model
 *
 * @param currentLyrics - Current lyrics to refine
 * @param feedback - User feedback to apply
 * @param currentPrompt - Current prompt for genre/mood extraction
 * @param lyricsTopic - Optional topic for context
 * @param config - Configuration with dependencies
 * @param ollamaEndpoint - Optional Ollama endpoint for offline mode
 * @returns Refined lyrics
 *
 * @throws {OllamaUnavailableError} When offline mode but Ollama is not running
 * @throws {OllamaModelMissingError} When offline mode but Gemma model is missing
 */
async function refineLyricsWithFeedback(
  currentLyrics: string,
  feedback: string,
  currentPrompt: string,
  lyricsTopic: string | undefined,
  config: RefinementConfig,
  ollamaEndpoint?: string
): Promise<{ lyrics: string }> {
  const { extractGenreFromPrompt, extractMoodFromPrompt } = await import('@bun/prompt/deterministic');

  const genre = extractGenreFromPrompt(currentPrompt);
  const mood = extractMoodFromPrompt(currentPrompt);
  const isOffline = !!ollamaEndpoint;
  const timeoutMs = isOffline
    ? APP_CONSTANTS.OLLAMA.GENERATION_TIMEOUT_MS
    : APP_CONSTANTS.AI.TIMEOUT_MS;

  log.info('refineLyricsWithFeedback:start', {
    genre,
    mood,
    feedbackLength: feedback.length,
    currentLyricsLength: currentLyrics.length,
    isOffline,
  });

  // Validate Ollama is available (only for offline mode)
  if (ollamaEndpoint) {
    await validateOllamaForRefinement(ollamaEndpoint);
  }

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
    isOffline,
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
 * Unified refinement: deterministic style + optional LLM lyrics.
 * 
 * This is now the main refinement path for ALL providers (cloud and offline).
 * Style refinement is always deterministic (no LLM calls).
 * LLM is only used for lyrics refinement when lyrics mode is enabled.
 * 
 * @param options - Refinement options
 * @param config - Configuration with dependencies
 * @param ollamaEndpoint - Optional Ollama endpoint for offline mode
 */
async function refineWithDeterministicStyle(
  options: RefinePromptOptions,
  config: RefinementConfig,
  ollamaEndpoint?: string
): Promise<GenerationResult> {
  const { currentPrompt, feedback, currentLyrics, lyricsTopic } = options;
  const isLyricsMode = config.isLyricsMode();
  const isOffline = !!ollamaEndpoint;

  log.info('refinePrompt:unified', {
    isLyricsMode,
    hasCurrentLyrics: !!currentLyrics,
    isOffline,
    reason: 'style always deterministic, LLM for lyrics only',
  });

  // Step 1: ALWAYS do deterministic style refinement (no LLM)
  const styleResult = await refinePromptDeterministic(options, config);

  // Step 2: If lyrics mode is ON and we have lyrics, refine them with LLM
  if (isLyricsMode && currentLyrics) {
    const lyricsResult = await refineLyricsWithFeedback(
      currentLyrics,
      feedback,
      currentPrompt,
      lyricsTopic,
      config,
      ollamaEndpoint
    );

    return {
      ...styleResult,
      lyrics: lyricsResult.lyrics,
      debugInfo: config.isDebugMode()
        ? config.buildDebugInfo(
            `UNIFIED_REFINEMENT (style: deterministic, lyrics: ${isOffline ? 'Ollama' : 'Cloud LLM'})`,
            `Style feedback + lyrics feedback: ${feedback}`,
            `Style: deterministic remix\nLyrics: ${isOffline ? 'local' : 'cloud'} LLM refined`
          )
        : undefined,
    };
  }

  return styleResult;
}

/**
 * Refine an existing prompt based on user feedback.
 *
 * Uses unified refinement strategy for ALL providers (cloud and offline):
 * - Style refinement: Always deterministic (no LLM calls, <50ms)
 * - Lyrics refinement: Uses LLM (cloud or Ollama based on settings)
 *
 * This architecture ensures fast, consistent style refinement while
 * leveraging LLM capabilities only for creative lyrics work.
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
  // Determine offline mode and endpoint
  const isOffline = config.isUseLocalLLM();
  const ollamaEndpoint = isOffline ? config.getOllamaEndpoint() : undefined;

  // Unified path: deterministic style + LLM lyrics (for all providers)
  return refineWithDeterministicStyle(options, config, ollamaEndpoint);
}


