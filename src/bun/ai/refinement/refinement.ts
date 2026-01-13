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
 * @module ai/refinement/refinement
 */

import { isDirectMode, buildDirectModePrompt } from '@bun/ai/direct-mode';
import { remixLyrics } from '@bun/ai/remix';
import { createLogger } from '@bun/logger';


import { refineLyricsWithFeedback } from './lyrics-refinement';
import { applyLockedPhraseIfNeeded } from './validation';

import type { RefinePromptOptions } from './types';
import type { GenerationResult, RefinementConfig } from '@bun/ai/types';
import type { TraceCollector } from '@bun/trace';

const log = createLogger('Refinement');

type TraceRuntime = {
  readonly trace?: TraceCollector;
  readonly rng?: () => number;
};

type LyricsAction = 'none' | 'refineExisting' | 'bootstrap';

function getLyricsAction(isLyricsMode: boolean, currentLyrics?: string): LyricsAction {
  if (!isLyricsMode) return 'none';
  return currentLyrics ? 'refineExisting' : 'bootstrap';
}

function getLyricsSeedInput(lyricsTopic: string | undefined, feedback: string): string {
  return lyricsTopic?.trim() || feedback.trim() || 'Untitled';
}

function getOptionalLyricsTopic(lyricsTopic: string | undefined): string | undefined {
  const topic = lyricsTopic?.trim();
  return topic ? topic : undefined;
}

function isDirectModeRefinement(sunoStyles: string[] | undefined): sunoStyles is string[] {
  if (!sunoStyles || sunoStyles.length === 0) return false;
  return isDirectMode(sunoStyles);
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
    debugTrace: undefined,
  };
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
  ollamaEndpoint?: string,
  runtime?: TraceRuntime
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

  const lyricsAction = getLyricsAction(isLyricsMode, currentLyrics);
  if (lyricsAction === 'refineExisting') {
    if (!currentLyrics) return styleResult;
    const lyricsResult = await refineLyricsWithFeedback(
      currentLyrics,
      feedback,
      currentPrompt,
      lyricsTopic,
      config,
      ollamaEndpoint,
      {
        trace: runtime?.trace,
        traceLabel: 'lyrics.refine',
      }
    );

    return {
      ...styleResult,
      lyrics: lyricsResult.lyrics,
      debugTrace: undefined,
    };
  }

  if (lyricsAction === 'bootstrap') {
    const seedInput = getLyricsSeedInput(lyricsTopic, feedback);
    const topic = getOptionalLyricsTopic(lyricsTopic);

    const lyricsResult = await remixLyrics(
      styleResult.text,
      seedInput,
      topic,
      config.isMaxMode(),
      config.getModel,
      config.getUseSunoTags?.() ?? false,
      config.isUseLocalLLM(),
      config.getOllamaEndpoint(),
      {
        trace: runtime?.trace,
        traceLabel: 'lyrics.bootstrap',
      }
    );

    return {
      ...styleResult,
      lyrics: lyricsResult.lyrics,
      debugTrace: undefined,
    };
  }

  return styleResult;
}

async function refinePromptDirectMode(
  options: RefinePromptOptions & { sunoStyles: string[] },
  config: RefinementConfig,
  runtime?: TraceRuntime
): Promise<GenerationResult> {
  const { sunoStyles, feedback, lyricsTopic, currentLyrics } = options;

  log.info('refinePrompt:directMode', { stylesCount: sunoStyles.length, maxMode: config.isMaxMode() });

  const { text: enrichedPrompt } = buildDirectModePrompt(sunoStyles, config.isMaxMode());
  const shouldBootstrapLyrics = config.isLyricsMode() && !currentLyrics;

  const seedInput = getLyricsSeedInput(lyricsTopic, feedback);
  const topic = getOptionalLyricsTopic(lyricsTopic);

  const lyricsResult = shouldBootstrapLyrics
    ? await remixLyrics(
        enrichedPrompt,
        seedInput,
        topic,
        config.isMaxMode(),
        config.getModel,
        config.getUseSunoTags?.() ?? false,
        config.isUseLocalLLM(),
        config.getOllamaEndpoint(),
        {
          trace: runtime?.trace,
          traceLabel: 'lyrics.bootstrap',
        }
      )
    : null;

  return {
    text: enrichedPrompt,
    title: options.currentTitle,
    lyrics: lyricsResult?.lyrics ?? currentLyrics,
    debugTrace: undefined,
  };
}

/**
 * Refine an existing prompt based on user feedback.
 *
 * Uses unified refinement strategy for ALL providers (cloud and offline):
 * - Direct Mode (sunoStyles): Uses shared enrichment (same as generation)
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
  config: RefinementConfig,
  runtime?: TraceRuntime
): Promise<GenerationResult> {
  const { sunoStyles } = options;

  // Direct Mode: Use shared enrichment (DRY - same as generation)
  // Title preserved (no LLM call) - only style prompt is enriched
  if (isDirectModeRefinement(sunoStyles)) {
    return refinePromptDirectMode({ ...options, sunoStyles }, config, runtime);
  }

  // Determine offline mode and endpoint
  const isOffline = config.isUseLocalLLM();
  const ollamaEndpoint = isOffline ? config.getOllamaEndpoint() : undefined;

  // Unified path: deterministic style + LLM lyrics (for all providers)
  return refineWithDeterministicStyle(options, config, ollamaEndpoint, runtime);
}

// Re-export types for convenience
export type { RefinePromptOptions } from './types';
