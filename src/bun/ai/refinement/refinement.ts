/**
 * Prompt Refinement Module
 *
 * Handles refinement of existing prompts based on user feedback.
 *
 * Architecture (unified for all providers):
 * - Style refinement: Always deterministic (no LLM calls, <50ms)
 * - Lyrics refinement: Uses LLM (cloud or Ollama based on settings)
 *
 * Supports three refinement types (auto-detected by frontend):
 * - 'style': Only style fields changed, no LLM calls needed
 * - 'lyrics': Only feedback text provided, refine lyrics with LLM
 * - 'combined': Both style changes AND feedback, do both
 *
 * This ensures fast, consistent style refinement while leveraging
 * LLM capabilities only for creative lyrics work.
 *
 * @module ai/refinement/refinement
 */

import { isDirectMode, buildDirectModePromptWithRuntime } from '@bun/ai/direct-mode';
import { remixLyrics } from '@bun/ai/remix';
import { extractStructuredDataForStory, tryStoryMode } from '@bun/ai/story-generator';
import { createLogger } from '@bun/logger';
import { traceDecision } from '@bun/trace';
import { ValidationError } from '@shared/errors';

import { refineLyricsWithFeedback } from './lyrics-refinement';
import { applyLockedPhraseIfNeeded } from './validation';

import type { RefinePromptOptions } from './types';
import type { TraceRuntime } from '@bun/ai/generation/types';
import type { GenerationResult, RefinementConfig } from '@bun/ai/types';
import type { TraceCollector } from '@bun/trace';

const log = createLogger('Refinement');

/**
 * Apply Story Mode transformation to refinement result if enabled.
 * Returns transformed result with narrative prose, or null to use original result.
 */
async function applyStoryModeIfEnabled(
  result: GenerationResult,
  config: RefinementConfig,
  runtime?: TraceRuntime,
  description?: string
): Promise<GenerationResult | null> {
  // Story Mode methods may not exist on older config mocks - safely check
  const storyMode = config.isStoryMode?.() ?? false;
  const llmAvailable = config.isLLMAvailable?.() ?? false;

  if (!storyMode || !llmAvailable) {
    return null;
  }

  const storyInput = extractStructuredDataForStory(result.text, null, { description });

  return tryStoryMode({
    input: storyInput,
    title: result.title ?? 'Untitled',
    lyrics: result.lyrics,
    fallbackText: result.text,
    config,
    trace: runtime?.trace,
    tracePrefix: 'refinement.storyMode',
    logLabel: 'refinePrompt',
  });
}

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
 * @param trace - Optional trace collector for debugging
 * @returns Refined prompt with updated style tags
 */
async function refinePromptDeterministic(
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
async function refineStyleOnly(
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
async function refineLyricsOnly(
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

async function refinePromptDirectMode(
  options: RefinePromptOptions & { sunoStyles: string[] },
  config: RefinementConfig,
  runtime?: TraceRuntime
): Promise<GenerationResult> {
  const { sunoStyles, feedback, lyricsTopic, currentLyrics } = options;

  log.info('refinePrompt:directMode', { stylesCount: sunoStyles.length, maxMode: config.isMaxMode() });

  const { text: enrichedPrompt } = buildDirectModePromptWithRuntime(sunoStyles, config.isMaxMode(), {
    trace: runtime?.trace,
  });
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

type NormalizedRefinementType = Exclude<RefinePromptOptions['refinementType'], undefined>;

type StyleChanges = RefinePromptOptions['styleChanges'];

type DirectModeResult = GenerationResult | null;

function resolveRefinementType(refinementType: RefinePromptOptions['refinementType']): NormalizedRefinementType {
  return refinementType ?? 'combined';
}

function traceRefinementRouting(
  trace: TraceCollector | undefined,
  type: NormalizedRefinementType,
  hasStyleChanges: boolean,
  hasFeedback: boolean
): void {
  log.info('refinePrompt:routing', {
    refinementType: type,
    hasStyleChanges,
    hasFeedback,
  });

  traceDecision(trace, {
    domain: 'other',
    key: 'refinement.routing',
    branchTaken: type,
    why: `refinementType=${type} hasStyleChanges=${hasStyleChanges} hasFeedback=${hasFeedback}`,
  });
}

function traceStyleChanges(trace: TraceCollector | undefined, styleChanges: StyleChanges): void {
  if (!styleChanges) return;

  const { seedGenres, sunoStyles: changedSunoStyles, ...otherChanges } = styleChanges;

  if (seedGenres !== undefined) {
    traceDecision(trace, {
      domain: 'genre',
      key: 'refinement.genre.changed',
      branchTaken: seedGenres.length > 0 ? seedGenres.join(', ') : 'cleared',
      why: `New genre selection: ${seedGenres.length} genre(s)`,
    });
  }

  if (changedSunoStyles !== undefined) {
    traceDecision(trace, {
      domain: 'styleTags',
      key: 'refinement.sunoStyles.changed',
      branchTaken: changedSunoStyles.length > 0 ? changedSunoStyles.join(', ') : 'cleared',
      why: `New Suno V5 styles: ${changedSunoStyles.length} selected`,
    });
  }

  const otherChangedFields = Object.entries(otherChanges)
    .filter(([, v]) => v !== undefined)
    .map(([k]) => k);

  if (otherChangedFields.length > 0) {
    traceDecision(trace, {
      domain: 'styleTags',
      key: 'refinement.styleChanges.other',
      branchTaken: otherChangedFields.join(', '),
      why: `Additional fields changed: ${otherChangedFields.join(', ')}`,
    });
  }
}

async function handleDirectModeRefinement(
  options: RefinePromptOptions,
  config: RefinementConfig,
  runtime?: TraceRuntime
): Promise<DirectModeResult> {
  if (!isDirectModeRefinement(options.sunoStyles)) return null;

  traceDecision(runtime?.trace, {
    domain: 'other',
    key: 'refinement.routing',
    branchTaken: 'directMode',
    why: `Suno V5 styles detected (${options.sunoStyles.length} styles), using Direct Mode enrichment`,
  });

  if (options.styleChanges?.sunoStyles) {
    traceDecision(runtime?.trace, {
      domain: 'styleTags',
      key: 'refinement.sunoStyles.changed',
      branchTaken: options.styleChanges.sunoStyles.join(', ') || 'cleared',
      why: `New Suno V5 styles: ${options.styleChanges.sunoStyles.length} selected`,
    });
  }

  return refinePromptDirectMode({ ...options, sunoStyles: options.sunoStyles }, config, runtime);
}

async function refineByType(
  type: NormalizedRefinementType,
  options: RefinePromptOptions,
  config: RefinementConfig,
  runtime?: TraceRuntime
): Promise<GenerationResult> {
  switch (type) {
    case 'style':
      return refineStyleOnly(options, config, runtime);

    case 'lyrics':
      return refineLyricsOnly(options, config, runtime);

    case 'combined': {
      const isOffline = config.isUseLocalLLM();
      const ollamaEndpoint = isOffline ? config.getOllamaEndpoint() : undefined;
      return refineWithDeterministicStyle(options, config, ollamaEndpoint, runtime);
    }

    default:
      throw new ValidationError(`Invalid refinement type: ${type as string}`, 'refinementType');
  }
}

/**
 * Refine an existing prompt based on user feedback.
 *
 * Uses unified refinement strategy for ALL providers (cloud and offline):
 * - Direct Mode (sunoStyles): Uses shared enrichment (same as generation)
 * - Style refinement: Always deterministic (no LLM calls, <50ms)
 * - Lyrics refinement: Uses LLM (cloud or Ollama based on settings)
 *
 * Supports three refinement types (auto-detected by frontend):
 * - 'style': Only style fields changed, no LLM calls needed
 * - 'lyrics': Only feedback text provided, refine lyrics with LLM
 * - 'combined': Both style changes AND feedback, do both (default)
 *
 * This architecture ensures fast, consistent style refinement while
 * leveraging LLM capabilities only for creative lyrics work.
 *
 * @param options - Options for refinement
 * @param config - Configuration with dependencies
 * @returns Refined prompt, title, and optionally lyrics
 *
 * @throws {ValidationError} When refinementType is invalid
 * @throws {ValidationError} When lyrics refinement requested without existing lyrics
 * @throws {ValidationError} When lyrics refinement requested without feedback
 * @throws {OllamaUnavailableError} When offline mode is on but Ollama is not running
 * @throws {OllamaModelMissingError} When offline mode is on but Gemma model is missing
 */
export async function refinePrompt(
  options: RefinePromptOptions,
  config: RefinementConfig,
  runtime?: TraceRuntime
): Promise<GenerationResult> {
  const directModeResult = await handleDirectModeRefinement(options, config, runtime);
  if (directModeResult) return directModeResult;

  const type = resolveRefinementType(options.refinementType);
  traceRefinementRouting(runtime?.trace, type, !!options.styleChanges, !!options.feedback?.trim());
  traceStyleChanges(runtime?.trace, options.styleChanges);

  return refineByType(type, options, config, runtime);
}

// Re-export types for convenience
export type { RefinePromptOptions } from './types';
