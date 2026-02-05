/**
 * Refinement Strategy Functions
 *
 * Contains the 5 core strategy implementations for prompt refinement:
 * - refinePromptDeterministic: No LLM, deterministic style regeneration
 * - refineStyleOnly: Style-only changes (deterministic)
 * - refineLyricsOnly: Lyrics-only changes (LLM)
 * - refineWithDeterministicStyle: Combined style + optional lyrics
 * - refinePromptDirectMode: Direct Mode (Suno V5 styles)
 *
 * @module ai/refinement/strategies
 */

import { buildDirectModePromptWithRuntime } from '@bun/ai/direct-mode';
import { remixLyrics } from '@bun/ai/remix';
import { createLogger } from '@bun/logger';
import { traceDecision } from '@bun/trace';
import { ValidationError } from '@shared/errors';

import {
  applyStoryModeIfEnabled,
  getLyricsAction,
  getLyricsSeedInput,
  getOptionalLyricsTopic,
} from './helpers';
import { refineLyricsWithFeedback } from './lyrics-refinement';
import { applyLockedPhraseIfNeeded } from './validation';

import type { RefinePromptOptions } from './types';
import type { TraceRuntime } from '@bun/ai/generation/types';
import type { GenerationResult, RefinementConfig } from '@bun/ai/types';
import type { TraceCollector } from '@bun/trace';

const log = createLogger('Refinement');

/**
 * Refine prompt deterministically without LLM calls.
 * Used when local LLM is active and lyrics mode is disabled.
 *
 * Regenerates style tags using genre-based deterministic logic,
 * preserving title and other prompt fields.
 *
 * @param options - Refinement options
 * @param config - Configuration with dependencies
 * @param trace - Optional trace collector for debugging
 * @returns Refined prompt with updated style tags
 */
export async function refinePromptDeterministic(
  options: RefinePromptOptions,
  config: RefinementConfig,
  trace?: TraceCollector
): Promise<GenerationResult> {
  const { currentPrompt, currentTitle, lockedPhrase } = options;

  const { extractGenreFromPrompt, remixStyleTags } = await import('@bun/prompt/deterministic');

  const genre = extractGenreFromPrompt(currentPrompt);

  traceDecision(trace, {
    domain: 'genre',
    key: 'refinement.genre.fromPrompt',
    branchTaken: genre || 'unknown',
    why: 'Genre extracted from existing prompt text (used for style tag generation)',
  });

  log.info('refinePromptDeterministic:start', { genre, hasLockedPhrase: !!lockedPhrase });

  const { text: updatedPrompt } = remixStyleTags(currentPrompt);

  traceDecision(trace, {
    domain: 'styleTags',
    key: 'refinement.styleTags.remix',
    branchTaken: 'regenerated',
    why: `Style tags regenerated for genre=${genre || 'unknown'}`,
  });

  let finalPrompt = await config.postProcess(updatedPrompt);
  finalPrompt = await applyLockedPhraseIfNeeded(finalPrompt, lockedPhrase);

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
 * Style-only refinement (no LLM calls).
 *
 * Performs deterministic style refinement without any LLM calls.
 * Used when only style fields (genre, bpm, instruments, etc.) have changed
 * and no feedback text is provided.
 *
 * Performance: < 100ms execution (deterministic, no network calls)
 *
 * @param options - Refinement options
 * @param config - Configuration with dependencies
 * @param runtime - Optional trace runtime for debugging
 * @returns GenerationResult with updated prompt text, unchanged title and lyrics
 */
export async function refineStyleOnly(
  options: RefinePromptOptions,
  config: RefinementConfig,
  runtime?: TraceRuntime
): Promise<GenerationResult> {
  const { currentTitle, currentLyrics } = options;

  log.info('refineStyleOnly:start', {
    hasTitle: !!currentTitle,
    hasLyrics: !!currentLyrics,
  });

  // Use existing deterministic refinement for style changes
  const styleResult = await refinePromptDeterministic(options, config, runtime?.trace);

  log.info('refineStyleOnly:complete', {
    promptLength: styleResult.text.length,
  });

  // Preserve existing title and lyrics unchanged
  const result: GenerationResult = {
    text: styleResult.text,
    title: currentTitle,
    lyrics: currentLyrics,
    debugTrace: undefined,
  };

  // Apply Story Mode transformation if enabled
  const storyResult = await applyStoryModeIfEnabled(result, config, runtime);
  if (storyResult) return storyResult;

  return result;
}

/**
 * Lyrics-only refinement (LLM call for lyrics, prompt unchanged).
 *
 * Handles both refinement of existing lyrics and bootstrap of new lyrics.
 * Used when feedback text is provided but no style fields have changed.
 *
 * @param options - Refinement options
 * @param config - Configuration with dependencies
 * @param runtime - Optional trace runtime for debugging
 * @returns GenerationResult with unchanged prompt, updated/new lyrics
 *
 * @throws {ValidationError} When feedback is empty or missing
 * @throws {OllamaUnavailableError} When offline mode but Ollama is not running
 * @throws {OllamaModelMissingError} When offline mode but Gemma model is missing
 */
export async function refineLyricsOnly(
  options: RefinePromptOptions,
  config: RefinementConfig,
  runtime?: TraceRuntime
): Promise<GenerationResult> {
  const { currentPrompt, currentTitle, currentLyrics, feedback, lyricsTopic } = options;

  // Validate: feedback is required for lyrics operations
  if (!feedback?.trim()) {
    throw new ValidationError('Feedback is required for lyrics refinement', 'feedback');
  }

  // Determine whether to refine existing or bootstrap new lyrics
  const lyricsAction = getLyricsAction(config.isLyricsMode(), currentLyrics);

  log.info('refineLyricsOnly:start', {
    lyricsAction,
    hasLyricsTopic: !!lyricsTopic,
    feedbackLength: feedback.length,
    currentLyricsLength: currentLyrics?.length ?? 0,
  });

  // Determine offline mode and endpoint
  const isOffline = config.isUseLocalLLM();
  const ollamaEndpoint = isOffline ? config.getOllamaEndpoint() : undefined;

  // Bootstrap new lyrics when none exist (same pattern as 'combined' path)
  if (lyricsAction === 'bootstrap') {
    const seedInput = getLyricsSeedInput(lyricsTopic, feedback);
    const topic = getOptionalLyricsTopic(lyricsTopic);

    const lyricsResult = await remixLyrics(
      currentPrompt,
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

    log.info('refineLyricsOnly:bootstrap:complete', {
      outputLyricsLength: lyricsResult.lyrics.length,
      isOffline,
    });

    return {
      text: currentPrompt,
      title: currentTitle,
      lyrics: lyricsResult.lyrics,
      debugTrace: undefined,
    };
  }

  // Refine existing lyrics
  if (!currentLyrics) {
    // Safety check - should not reach here if getLyricsAction works correctly
    throw new ValidationError('Cannot refine lyrics without existing lyrics', 'currentLyrics');
  }

  const lyricsResult = await refineLyricsWithFeedback(
    currentLyrics,
    feedback,
    currentPrompt,
    lyricsTopic,
    config,
    config.isMaxMode(),
    ollamaEndpoint,
    {
      trace: runtime?.trace,
      traceLabel: 'lyrics.refine',
    }
  );

  log.info('refineLyricsOnly:refine:complete', {
    outputLyricsLength: lyricsResult.lyrics.length,
    isOffline,
  });

  // Return unchanged prompt with updated lyrics
  return {
    text: currentPrompt,
    title: currentTitle,
    lyrics: lyricsResult.lyrics,
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
export async function refineWithDeterministicStyle(
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
  const styleResult = await refinePromptDeterministic(options, config, runtime?.trace);

  const lyricsAction = getLyricsAction(isLyricsMode, currentLyrics);
  if (lyricsAction === 'refineExisting') {
    if (!currentLyrics) return styleResult;
    const lyricsResult = await refineLyricsWithFeedback(
      currentLyrics,
      feedback,
      currentPrompt,
      lyricsTopic,
      config,
      config.isMaxMode(),
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

  // Apply Story Mode transformation if enabled (only when no lyrics mode)
  const storyResult = await applyStoryModeIfEnabled(styleResult, config, runtime);
  if (storyResult) return storyResult;

  return styleResult;
}

export async function refinePromptDirectMode(
  options: RefinePromptOptions & { sunoStyles: string[] },
  config: RefinementConfig,
  runtime?: TraceRuntime
): Promise<GenerationResult> {
  const { sunoStyles, feedback, lyricsTopic, currentLyrics } = options;

  log.info('refinePrompt:directMode', {
    stylesCount: sunoStyles.length,
    maxMode: config.isMaxMode(),
  });

  const { text: enrichedPrompt } = buildDirectModePromptWithRuntime(
    sunoStyles,
    config.isMaxMode(),
    {
      trace: runtime?.trace,
    }
  );
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
